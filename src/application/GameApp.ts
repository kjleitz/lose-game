import { GameSessionECS } from "../domain/ecs/GameSessionECS";
import type { EnemyView as Enemy } from "../domain/game/views";
import { PlayerInventoryManager } from "../domain/game/inventory/PlayerInventory";
import { ItemFactory } from "../domain/game/items/ItemFactory";
import type { Planet } from "../domain/game/planets";
import type { Camera } from "../domain/render/camera";
import { GameRenderer } from "../domain/render/GameRenderer";
import { setSpriteConfig } from "../domain/render/sprites";
import type { Circle2D, Kinematics2D, ViewSize } from "../shared/types/geometry";
import { GameLoop } from "./game/loop";
import type { GameController, GameOptions, GameSnapshot } from "./GameAPI";
import { SimpleGameBus } from "./GameBus";
import type { Action } from "./input/ActionTypes";
import { InputManager } from "./input/InputManager";
import { setKeyBinding } from "./input/KeyBindings";
import {
  type InventoryEntry,
  loadSessionState,
  saveSessionState,
} from "./persistence/sessionStorage";
import { getDefaultSettings, loadSettings, updateSettings } from "./settings/settingsStorage";
import { deleteSessionState } from "./persistence/sessionStorage";
import { AudioService } from "../infrastructure/audio/AudioService";

function defaultKinematics(): Kinematics2D {
  return { x: 0, y: 0, vx: 0, vy: 0, angle: 0 };
}

function defaultKinematicsWithHealth(): Kinematics2D & { health: number } {
  const k = defaultKinematics();
  return { ...k, health: 100 };
}

export class GameApp {
  static create(canvas: HTMLCanvasElement, options: GameOptions): Promise<GameController> {
    const input = new InputManager();
    const bus = new SimpleGameBus();
    interface ECSConfig {
      camera?: Camera;
      size?: ViewSize;
      planets?: Planet[];
      enemies?: Enemy[];
    }
    const ecsConfig: ECSConfig = {
      camera: options.camera ?? { x: 0, y: 0, zoom: 1 },
      size: options.size,
    };
    if (options.initialWorld?.planets) {
      ecsConfig.planets = options.initialWorld.planets.map(
        (planetIn): Planet => ({
          id: planetIn.id,
          x: planetIn.x,
          y: planetIn.y,
          radius: planetIn.radius,
          color: planetIn.color ?? "#8888ff",
          design: planetIn.design ?? "solid",
        }),
      );
    }
    if (options.initialWorld?.enemies) {
      ecsConfig.enemies = options.initialWorld.enemies.map(
        (enemyIn): Enemy => ({
          id: enemyIn.id,
          x: enemyIn.x,
          y: enemyIn.y,
          radius: enemyIn.radius,
          health: enemyIn.health,
          angle: enemyIn.angle,
          vx: 0,
          vy: 0,
          visionRadius: 700,
          visionHysteresis: 80,
          turnSpeed: 1.8,
          accel: 200,
          maxSpeed: 300,
        }),
      );
    }
    const session = new GameSessionECS(ecsConfig);
    // Preserve last known player kinematics for stable render during death overlay
    let lastRenderPV: Kinematics2D | null = null;
    const audio = new AudioService();
    // Restore last session state (e.g., player position)
    const last = loadSessionState();
    if (last) {
      session.setPlayerPosition({ x: last.player.x, y: last.player.y });
      session.restoreMode({ mode: last.mode, planetId: last.planetId });
      if (typeof last.perkPoints === "number") session.setPlayerPerkPoints(last.perkPoints);
    }
    const renderer = new GameRenderer();
    // Bridge: maintain a domain inventory for the HUD fed by ECS pickup events
    const hudInventory = new PlayerInventoryManager(20, 100);
    // Prepare item factory and restore saved inventory entries if any
    const factory = new ItemFactory();
    if (last?.inventory && last.inventory.length > 0) {
      for (const entry of last.inventory) {
        const { type, quantity } = entry;
        // Recreate item from templates by type
        try {
          const item = factory.createItem(type);
          hudInventory.addItem(item, quantity);
        } catch {
          // ignore unknown templates
        }
      }
    } else {
      // Seed a simple starting inventory if none saved
      try {
        hudInventory.addItem(factory.createItem("ten_foot_pole"), 1);
      } catch {}
      try {
        hudInventory.addItem(factory.createItem("towel"), 1);
      } catch {}
    }

    // Attach DOM listeners
    const target: Window | HTMLElement = options.input?.target ?? window;
    const keydown: EventListener = (evt) => {
      if (!(evt instanceof KeyboardEvent)) return;
      input.enqueueKeyDown(evt.code);
      if (evt.code.startsWith("Arrow") || evt.code === "Space") evt.preventDefault();
    };
    const keyup: EventListener = (evt) => {
      if (!(evt instanceof KeyboardEvent)) return;
      input.enqueueKeyUp(evt.code);
      if (evt.code.startsWith("Arrow") || evt.code === "Space") evt.preventDefault();
    };
    target.addEventListener("keydown", keydown);
    target.addEventListener("keyup", keyup);

    // Track cursor position over the canvas to support planet-mode cursor aim perk
    const onMouseMove: EventListener = (evt) => {
      if (!(evt instanceof MouseEvent)) return;
      const rect = canvas.getBoundingClientRect();
      // Mouse coordinates in CSS pixels relative to the canvas element
      const cssX = evt.clientX - rect.left;
      const cssY = evt.clientY - rect.top;
      // Convert to world using camera and current zoom (DPR cancels out)
      const cam = session.getCamera();
      const worldX = (cssX - size.width / 2) / cam.zoom + cam.x;
      const worldY = (cssY - size.height / 2) / cam.zoom + cam.y;
      session.setCursorTarget({ x: worldX, y: worldY });
    };
    canvas.addEventListener("mousemove", onMouseMove);

    // Mouse shooting: left-click holds Fire while pressed
    const onMouseDown: EventListener = (evt) => {
      if (!(evt instanceof MouseEvent)) return;
      if (evt.button !== 0) return; // left button only
      const next = new Set(input.actions);
      next.add("fire");
      input.actions = next;
    };
    const onMouseUp: EventListener = (evt) => {
      if (!(evt instanceof MouseEvent)) return;
      if (evt.button !== 0) return;
      const next = new Set(input.actions);
      next.delete("fire");
      input.actions = next;
    };
    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);

    // Size and DPR management
    const size: ViewSize = { ...options.size };
    let dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    const resizeCanvas = (): void => {
      const nextDpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
      dpr = nextDpr;
      canvas.style.width = `${size.width}px`;
      canvas.style.height = `${size.height}px`;
      canvas.width = Math.floor(size.width * dpr);
      canvas.height = Math.floor(size.height * dpr);
    };
    resizeCanvas();

    // FPS tracking
    let fps = 0;
    let frames = 0;
    let fpsTime = performance.now();
    const updateFps = (): void => {
      frames += 1;
      const now = performance.now();
      if (now - fpsTime >= 500) {
        fps = Math.round((frames * 1000) / (now - fpsTime));
        frames = 0;
        fpsTime = now;
      }
    };

    // Speed multiplier bounds
    const MIN_SPEED = 0.25;
    const MAX_SPEED = 5;
    // Load persisted settings
    const loaded = loadSettings() ?? getDefaultSettings();
    // Apply sprite theme configuration at startup
    setSpriteConfig({ defaultVariant: loaded.spriteTheme, overrides: loaded.spriteOverrides });
    let speedMultiplier = Math.min(MAX_SPEED, Math.max(MIN_SPEED, loaded.speed));
    // bounds declared above

    // Derive a snapshot for HUD per frame
    const getSnapshot = (): GameSnapshot => {
      const playerView = session.getPlayer();
      const player: Kinematics2D & {
        health: number;
        healthMax: number;
        experience: number;
        level: number;
        xpToNextLevel: number;
        perkPoints: number;
        perks: Record<string, number>;
        ammo: import("../shared/types/combat").AmmoType;
      } =
        playerView != null
          ? {
              x: playerView.x,
              y: playerView.y,
              vx: playerView.vx,
              vy: playerView.vy,
              angle: playerView.angle,
              health: playerView.health,
              healthMax: playerView.healthMax,
              experience: playerView.experience,
              level: playerView.level,
              xpToNextLevel: playerView.xpToNextLevel,
              perkPoints: playerView.perkPoints,
              perks: playerView.perks,
              ammo: session.getSelectedAmmo(),
            }
          : {
              ...defaultKinematicsWithHealth(),
              healthMax: 100,
              experience: 0,
              level: 1,
              xpToNextLevel: 100,
              perkPoints: 0,
              perks: {},
              ammo: session.getSelectedAmmo(),
            };
      const camera = session.getCamera();
      const planets = session.getPlanets();
      const stars = typeof session.getStars === "function" ? session.getStars() : [];
      const enemies = session.getEnemies();
      const projectiles = session.getProjectiles();
      const entityCount = session.getEntityCount();
      return {
        mode: session.getCurrentModeType(),
        planet:
          session.getCurrentModeType() === "planet"
            ? {
                inShip: session.isInPlanetShip(),
                ship: ((): { x: number; y: number; angle: number } | null => {
                  const surface = session.getPlanetSurface?.();
                  return surface
                    ? {
                        x: surface.landingSite.x,
                        y: surface.landingSite.y,
                        angle: typeof surface.shipAngle === "number" ? surface.shipAngle : 0,
                      }
                    : null;
                })(),
              }
            : undefined,
        player: {
          ...player,
          experience: player.experience ?? 0,
          health: player.health ?? 100,
          healthMax: player.healthMax ?? 100,
          level: player.level ?? 1,
          xpToNextLevel: player.xpToNextLevel ?? 100,
          perkPoints: player.perkPoints ?? 0,
          perks: player.perks ?? {},
        },
        camera,
        planets: planets.map((pl) => ({
          id: pl.id,
          x: pl.x,
          y: pl.y,
          radius: pl.radius,
          color: pl.color,
          design: pl.design,
        })),
        stars: stars.map((st) => ({
          id: st.id,
          x: st.x,
          y: st.y,
          radius: st.radius,
          color: st.color,
        })),
        enemies: enemies.map((enemy) => ({
          id: enemy.id,
          x: enemy.x,
          y: enemy.y,
          angle: enemy.angle,
          health: enemy.health,
          radius: enemy.radius,
        })),
        projectiles: projectiles.map((pr): Circle2D => ({ x: pr.x, y: pr.y, radius: pr.radius })),
        stats: { fps, entityCount },
      };
    };

    // Track notifications and inputs to avoid spamming the bus
    let lastNotification: string | null = null;
    let lastActionsKey = "";

    // Game loop
    let lastSavedAt = performance.now();
    const SAVE_INTERVAL_MS = 1500;
    const loop = new GameLoop({
      update: (dt: number): void => {
        // When awaiting respawn, freeze world updates until user clicks respawn
        const isAwaitingRespawn = session.isAwaitingRespawn();
        if (isAwaitingRespawn) {
          // Still process input for UI, but don't mutate world state
          input.updateActions();
          return;
        }
        // Update input state and publish input changes
        const actions = input.updateActions();
        const actionsArr = Array.from(actions.values());
        const actionsKey = actionsArr.sort().join(",");
        if (actionsKey !== lastActionsKey) {
          bus.publish({ type: "inputChanged", actions: actionsArr });
          lastActionsKey = actionsKey;
        }

        // Allow speed control from keyboard
        let changedSpeed = false;
        if (actions.has("speedUp")) {
          const prev = speedMultiplier;
          speedMultiplier = Math.min(MAX_SPEED, speedMultiplier + 1.0 * dt);
          changedSpeed = changedSpeed || speedMultiplier !== prev;
        }
        if (actions.has("speedDown")) {
          const prev = speedMultiplier;
          speedMultiplier = Math.max(MIN_SPEED, speedMultiplier - 1.0 * dt);
          changedSpeed = changedSpeed || speedMultiplier !== prev;
        }
        if (changedSpeed) {
          bus.publish({ type: "speedChanged", value: speedMultiplier });
          updateSettings({ speed: speedMultiplier });
        }

        session.update(actions, dt * speedMultiplier);
        // If the session reports a death, show overlay via event and wait for respawn
        const deaths = session.getAndClearDeathEvents();
        if (deaths > 0) {
          bus.publish({ type: "death" });
        }
        // Periodically persist session state (position, mode, inventory)
        const now = performance.now();
        if (now - lastSavedAt >= SAVE_INTERVAL_MS) {
          const playerView = session.getPlayer();
          if (playerView) {
            const mode = session.getCurrentModeType();
            const modeData = session.getModeSnapshot();
            const inv: InventoryEntry[] = hudInventory
              .getSlots()
              .filter((slot) => slot.item != null && slot.quantity > 0)
              .map((slot) => {
                const item = slot.item!;
                return { type: item.type, quantity: slot.quantity };
              });
            saveSessionState({
              player: { x: playerView.x, y: playerView.y },
              mode,
              planetId: modeData.planetId,
              inventory: inv,
              perkPoints: playerView.perkPoints,
            });
          }
          lastSavedAt = now;
        }
        // Bridge picked-up items to HUD inventory
        const picked = session.getAndClearPickupEvents();
        for (const ev of picked) {
          if (ev.autoUsed !== true) hudInventory.addItem(ev.item, ev.quantity);
        }
        // Play SFX events emitted by session
        const sfx = session.getAndClearSfxEvents();
        let maxAttract = 0;
        for (const ev of sfx) {
          if (ev.type === "shoot") audio.playShoot(ev.team, ev.ammo);
          else if (ev.type === "playerHit") audio.playPlayerHit();
          else if (ev.type === "hit") audio.playHit();
          else if (ev.type === "pickup") audio.playPickup();
          else if (ev.type === "attract") {
            if (ev.strength > maxAttract) maxAttract = ev.strength;
          }
        }
        // Apply the strongest attraction for a clean single ramp tone
        audio.setAttractStrength(maxAttract);
        // Emit HUD hint changes (including clears) and transient toasts
        const current = session.getNotification();
        if (current !== lastNotification) {
          bus.publish({ type: "notification", message: current });
        }
        lastNotification = current;
        const toasts = session.getAndClearToastEvents();
        for (const msg of toasts) bus.publish({ type: "toast", message: msg });
        bus.publish({ type: "tick", snapshot: getSnapshot() });
      },
      render: (): void => {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const awaiting = session.isAwaitingRespawn();
        const pv = session.getPlayer();
        const playerForRender: Kinematics2D =
          pv != null
            ? { x: pv.x, y: pv.y, vx: pv.vx, vy: pv.vy, angle: pv.angle }
            : awaiting && lastRenderPV != null
              ? lastRenderPV
              : defaultKinematics();
        // Remember last seen PV when valid
        if (pv != null) lastRenderPV = playerForRender;
        renderer.render(
          ctx,
          playerForRender,
          session.getCamera(),
          session.getPlanets(),
          session.getProjectiles(),
          session.getEnemies(),
          input.actions,
          size,
          dpr,
          session,
        );
        updateFps();
      },
    });

    const controller: GameController & { getInventory: () => PlayerInventoryManager } = {
      start(): void {
        loop.start();
      },
      stop(): void {
        loop.stop();
      },
      pause(): void {
        loop.pause();
      },
      resume(): void {
        loop.resume();
      },
      dispose(): void {
        loop.stop();
        target.removeEventListener("keydown", keydown);
        target.removeEventListener("keyup", keyup);
        canvas.removeEventListener("mousemove", onMouseMove);
        canvas.removeEventListener("mousedown", onMouseDown);
        window.removeEventListener("mouseup", onMouseUp);
      },
      setSpeed(multiplier: number): void {
        const clamped = Math.min(MAX_SPEED, Math.max(MIN_SPEED, multiplier));
        if (clamped !== speedMultiplier) {
          speedMultiplier = clamped;
          bus.publish({ type: "speedChanged", value: speedMultiplier });
          updateSettings({ speed: speedMultiplier });
        }
      },
      getSpeed(): number {
        return speedMultiplier;
      },
      setZoom(zoom: number): void {
        session.camera.zoom = zoom;
      },
      getSnapshot,
      bus,
      dispatch(action: Action): void {
        // Programmatic input: set into current actions set
        const next = new Set(input.actions);
        next.add(action);
        input.actions = next;
      },
      rebind(action: Action, code: string): void {
        setKeyBinding(action, code);
      },
      getInventory(): PlayerInventoryManager {
        return hudInventory;
      },
      respawn(): void {
        // Clear saved session only; keep settings and keybindings
        deleteSessionState();
        // Clear HUD inventory runtime state
        const slots = hudInventory.getSlots();
        for (const slot of slots) {
          slot.item = null;
          slot.quantity = 0;
        }
        // Respawn world to a fresh new game
        session.respawnFromDeath();
        // Reset lastSavedAt to defer autosave until the new state stabilizes
        lastSavedAt = performance.now();
      },
      unlockPerk(perkId) {
        session.requestUnlockPerk(perkId);
        // If UI is paused (e.g., perks modal open), apply immediately and emit a tick
        session.applyPendingPerkUnlocks?.();
        bus.publish({ type: "tick", snapshot: getSnapshot() });
      },
      sellPerk(perkId) {
        session.requestSellPerk(perkId);
        // If UI is paused (e.g., perks modal open), apply immediately and emit a tick
        session.applyPendingPerkSells?.();
        bus.publish({ type: "tick", snapshot: getSnapshot() });
      },
      grantPerkPoints(amount: number) {
        // Clamp to a reasonable positive number to avoid overflow
        const clampedAmount = Math.max(0, Math.min(1_000_000, Math.floor(amount)));
        if (clampedAmount > 0) session.grantPerkPoints(clampedAmount);
      },
      setAmmo(type) {
        session.setSelectedAmmo(type);
        // Emit update so HUD reflects the change immediately
        bus.publish({ type: "tick", snapshot: getSnapshot() });
      },
    };

    // Publish initial tick for HUD initialization
    bus.publish({ type: "tick", snapshot: getSnapshot() });

    return Promise.resolve(controller);
  }
}
