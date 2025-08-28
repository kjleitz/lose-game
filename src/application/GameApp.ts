import { GameSessionECS } from "../domain/ecs/GameSessionECS";
import type { Enemy } from "../domain/game/enemies";
import type { Planet } from "../domain/game/planets";
import { PlayerInventoryManager } from "../domain/game/inventory/PlayerInventory";
import type { Camera } from "../domain/render/camera";
import { GameRenderer } from "../domain/render/GameRenderer";
import type { Action } from "../engine/input/ActionTypes";
import { InputManager } from "../engine/input/InputManager";
import { setKeyBinding } from "../engine/input/KeyBindings";
import type { Circle2D, Kinematics2D, ViewSize } from "../shared/types/geometry";
import { GameLoop } from "./game/loop";
import { loadSettings, saveSettings, getDefaultSettings } from "./settings/settingsStorage";
import {
  loadSessionState,
  saveSessionState,
  type InventoryEntry,
} from "./persistence/sessionStorage";
import { ItemFactory } from "../domain/game/items/ItemFactory";
import type { GameController, GameOptions, GameSnapshot } from "./GameAPI";
import { SimpleGameBus } from "./GameBus";

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
        (p): Planet => ({
          id: p.id,
          x: p.x,
          y: p.y,
          radius: p.radius,
          color: p.color ?? "#8888ff",
          design: p.design ?? "solid",
        }),
      );
    }
    if (options.initialWorld?.enemies) {
      ecsConfig.enemies = options.initialWorld.enemies.map(
        (e): Enemy => ({
          id: e.id,
          x: e.x,
          y: e.y,
          radius: e.radius,
          health: e.health,
          angle: e.angle,
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
    // Restore last session state (e.g., player position)
    const last = loadSessionState();
    if (last) {
      session.setPlayerPosition({ x: last.player.x, y: last.player.y });
      session.restoreMode({ mode: last.mode, planetId: last.planetId });
    }
    const renderer = new GameRenderer();
    // Bridge: maintain a domain inventory for the HUD fed by ECS pickup events
    const hudInventory = new PlayerInventoryManager(20, 100);
    // Restore saved inventory entries if any
    if (last?.inventory && last.inventory.length > 0) {
      const factory = new ItemFactory();
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
    // Load persisted speed
    const loaded = loadSettings() ?? getDefaultSettings();
    let speedMultiplier = Math.min(MAX_SPEED, Math.max(MIN_SPEED, loaded.speed));
    // bounds declared above

    // Derive a snapshot for HUD per frame
    const getSnapshot = (): GameSnapshot => {
      const p = session.getPlayer();
      const player: Kinematics2D & { health: number } = p
        ? { x: p.x, y: p.y, vx: p.vx, vy: p.vy, angle: p.angle, health: p.health }
        : defaultKinematicsWithHealth();
      const camera = session.getCamera();
      const planets = session.getPlanets();
      const enemies = session.getEnemies();
      const projectiles = session.getProjectiles();
      const entityCount = session.getEntityCount();
      return {
        player: { ...player, experience: 0, health: player.health ?? 100 },
        camera,
        planets: planets.map((pl) => ({
          id: pl.id,
          x: pl.x,
          y: pl.y,
          radius: pl.radius,
          color: pl.color,
          design: pl.design,
        })),
        enemies: enemies.map((e) => ({
          id: e.id,
          x: e.x,
          y: e.y,
          angle: e.angle,
          health: e.health,
          radius: e.radius,
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
          saveSettings({ speed: speedMultiplier });
        }

        session.update(actions, dt * speedMultiplier);
        // Periodically persist session state (position, mode, inventory)
        const now = performance.now();
        if (now - lastSavedAt >= SAVE_INTERVAL_MS) {
          const p = session.getPlayer();
          if (p) {
            const mode = session.getCurrentModeType();
            const modeData = session.getModeSnapshot();
            const inv: InventoryEntry[] = hudInventory
              .getSlots()
              .filter((s) => s.item !== null && s.quantity > 0)
              .map((s) => {
                const item = s.item!;
                return { type: item.type, quantity: s.quantity };
              });
            saveSessionState({
              player: { x: p.x, y: p.y },
              mode,
              planetId: modeData.planetId,
              inventory: inv,
            });
          }
          lastSavedAt = now;
        }
        // Bridge picked-up items to HUD inventory
        const picked = session.getAndClearPickupEvents();
        for (const ev of picked) hudInventory.addItem(ev.item, ev.quantity);
        const current = session.getNotification();
        if (current && current !== lastNotification) {
          bus.publish({ type: "notification", message: current });
        }
        lastNotification = current;
        bus.publish({ type: "tick", snapshot: getSnapshot() });
      },
      render: (): void => {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const pv = session.getPlayer();
        const playerForRender: Kinematics2D = pv
          ? { x: pv.x, y: pv.y, vx: pv.vx, vy: pv.vy, angle: pv.angle }
          : defaultKinematics();
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
      },
      setSpeed(multiplier: number): void {
        const clamped = Math.min(MAX_SPEED, Math.max(MIN_SPEED, multiplier));
        if (clamped !== speedMultiplier) {
          speedMultiplier = clamped;
          bus.publish({ type: "speedChanged", value: speedMultiplier });
          saveSettings({ speed: speedMultiplier });
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
    };

    // Publish initial tick for HUD initialization
    bus.publish({ type: "tick", snapshot: getSnapshot() });

    return Promise.resolve(controller);
  }
}
