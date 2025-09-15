import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";

import type { GameController } from "../../application/GameAPI";
import { GameApp } from "../../application/GameApp";
import type { Item } from "../../domain/game/items/Item";
import type { Planet } from "../../domain/game/planets";
import type { Action } from "../../application/input/ActionTypes";
import type { Point2D, ViewSize } from "../../shared/types/geometry";
import { Hud } from "../hud/Hud";
import { SettingsModal, DeathOverlay } from "../overlays/dialogs";
import { PerkModal } from "../overlays/dialogs/PerkModal";
import { PauseMenu } from "../overlays/menus/PauseMenu";
import { MapMaker } from "../../tools/map-maker/MapMaker";

function useCanvasSize(): ViewSize {
  const [size, setSize] = useState<ViewSize>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const onResize = (): void => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", onResize);
    return (): void => window.removeEventListener("resize", onResize);
  }, []);

  return size;
}

export function CanvasRoot(): JSX.Element {
  const size = useCanvasSize();
  const { width, height } = size;
  const [paused, setPaused] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: number; message: string }>>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [perksOpen, setPerksOpen] = useState(false);
  const [dead, setDead] = useState(false);
  const [mapMakerOpen, setMapMakerOpen] = useState(false);
  const [, /* inventoryVisible */ setInventoryVisible] = useState(true);
  const controllerRef = useRef<GameController | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // When any UI menu is open, the game should be paused.
  // We centralize pause/resume side effects based on this derived state.
  const uiPaused = paused || settingsOpen || perksOpen || mapMakerOpen;
  const lastAppliedPause = useRef<boolean>(false);
  const [hudState, setHudState] = useState<{
    mode: "space" | "planet" | "ship";
    planet?: { inShip: boolean; ship: { x: number; y: number; angle: number } | null };
    player: Point2D;
    experience: number;
    level: number;
    xpToNextLevel: number;
    perkPoints: number;
    health: number;
    healthMax: number;
    planets: Planet[];
    ammo: import("../../shared/types/combat").AmmoType;
    perks: Record<string, number>;
  }>(() => ({
    mode: "space",
    planet: undefined,
    player: { x: 0, y: 0 },
    experience: 0,
    level: 1,
    xpToNextLevel: 100,
    perkPoints: 0,
    health: 100,
    healthMax: 100,
    planets: [],
    ammo: "standard",
    perks: {},
  }));
  // HUD actions readout and speed mirror
  const [hudActions, setHudActions] = useState<Set<Action>>(() => new Set());
  const [speed, setSpeed] = useState<number>(1);
  const [playerSpeed, setPlayerSpeed] = useState<number>(0);
  const [cursorAimEnabled, setCursorAimEnabled] = useState<boolean>(false);
  const [showCursorHint, setShowCursorHint] = useState<boolean>(false);
  const cursorHintShown = useRef<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let unsub: (() => void) | null = null;
    let unsubNotif: (() => void) | null = null;
    let unsubInput: (() => void) | null = null;
    let unsubSpeed: (() => void) | null = null;
    let unsubToast: (() => void) | null = null;
    let unsubDeath: (() => void) | null = null;

    void (async (): Promise<void> => {
      const ctrl = await GameApp.create(canvas, { size: { width, height } });
      if (disposed) return;
      controllerRef.current = ctrl;
      setSpeed(ctrl.getSpeed());
      unsub = ctrl.bus.subscribe("tick", (event): void => {
        const snapshot = event.snapshot;
        setHudState({
          mode: snapshot.mode,
          planet: snapshot.planet,
          player: { x: snapshot.player.x, y: snapshot.player.y },
          experience: snapshot.player.experience,
          level: snapshot.player.level,
          xpToNextLevel: snapshot.player.xpToNextLevel,
          perkPoints: snapshot.player.perkPoints,
          health: snapshot.player.health,
          healthMax: snapshot.player.healthMax,
          planets: snapshot.planets,
          ammo: snapshot.player.ammo,
          perks: snapshot.player.perks,
        });
        setPlayerSpeed(Math.hypot(snapshot.player.vx, snapshot.player.vy));
        // Detect perk for cursor aim and trigger one-time hint
        const enabled = (snapshot.player.perks["combat.cursor-aim-planet"] ?? 0) > 0;
        setCursorAimEnabled(enabled);
        if (
          enabled &&
          snapshot.mode === "planet" &&
          snapshot.planet &&
          !snapshot.planet.inShip &&
          !cursorHintShown.current
        ) {
          cursorHintShown.current = true;
          setShowCursorHint(true);
          window.setTimeout(() => setShowCursorHint(false), 2500);
        }
      });
      unsubNotif = ctrl.bus.subscribe("notification", (event): void => {
        setNotification(event.message);
      });
      unsubToast = ctrl.bus.subscribe("toast", (event): void => {
        const id = Date.now() + Math.floor(Math.random() * 10000);
        setToasts((prev) => [...prev, { id, message: event.message }]);
        // Auto-remove after a short duration
        window.setTimeout(() => {
          setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, 3000);
      });
      unsubInput = ctrl.bus.subscribe("inputChanged", (event): void => {
        setHudActions(new Set(event.actions));
      });
      unsubSpeed = ctrl.bus.subscribe("speedChanged", (event): void => {
        setSpeed(event.value);
      });
      // Death overlay trigger
      unsubDeath = ctrl.bus.subscribe("death", (): void => {
        setDead(true);
      });
      ctrl.start();
    })();

    return (): void => {
      disposed = true;
      if (unsub) unsub();
      if (unsubNotif) unsubNotif();
      if (unsubInput) unsubInput();
      if (unsubSpeed) unsubSpeed();
      if (unsubToast) unsubToast();
      if (unsubDeath) unsubDeath();
      controllerRef.current?.dispose();
      controllerRef.current = null;
    };
  }, [width, height]);

  // Keyboard shortcuts listener, depends on current UI state flags
  useEffect(() => {
    const onEsc = (event: KeyboardEvent): void => {
      if (event.code === "Escape") {
        // Close map-maker first if open, otherwise toggle pause menu
        if (mapMakerOpen) {
          setMapMakerOpen(false);
        } else {
          setPaused((prev) => !prev);
        }
      }
      // Press 'M' to toggle Map Maker (only when gameplay UI is active)
      if (event.code === "KeyM" && !settingsOpen && !perksOpen && !paused && !dead) {
        setMapMakerOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onEsc);
    return (): void => {
      window.removeEventListener("keydown", onEsc);
    };
  }, [mapMakerOpen, settingsOpen, perksOpen, paused, dead]);

  function handleItemUse(item: Item): void {
    console.log("Using item:", item.name);
  }

  function handleItemDrop(item: Item, quantity: number): void {
    console.log("Dropping item:", item.name, "quantity:", quantity);
  }

  // Pause/resume the game loop whenever any menu is open (settings/perks or explicit pause)
  useEffect(() => {
    const ctrl = controllerRef.current;
    if (!ctrl) return;
    if (uiPaused !== lastAppliedPause.current) {
      if (uiPaused) ctrl.pause();
      else ctrl.resume();
      lastAppliedPause.current = uiPaused;
    }
  }, [uiPaused]);

  return (
    <div className="relative w-screen h-screen overflow-hidden" data-testid="game-root">
      <canvas ref={canvasRef} className="block w-full h-full" />
      {/* Crosshair overlay for cursor aim perk on planet (on foot) */}
      {hudState.mode === "planet" && hudState.planet && !hudState.planet.inShip ? (
        <CrosshairOverlay
          enabled={cursorAimEnabled}
          canvasRef={canvasRef}
          showHint={showCursorHint}
          onHintDone={(): void => setShowCursorHint(false)}
        />
      ) : null}
      <DeathOverlay
        open={dead}
        onRespawn={(): void => {
          controllerRef.current?.respawn?.();
          setDead(false);
        }}
      />
      <Hud
        mode={hudState.mode}
        planet={hudState.planet}
        player={hudState.player}
        playerAngle={controllerRef.current?.getSnapshot().player.angle ?? 0}
        experience={hudState.experience}
        level={hudState.level}
        xpToNextLevel={hudState.xpToNextLevel}
        perkPoints={hudState.perkPoints}
        health={hudState.health}
        healthMax={hudState.healthMax}
        planets={hudState.planets}
        stars={controllerRef.current?.getSnapshot().stars ?? []}
        enemies={
          controllerRef.current?.getSnapshot().enemies?.map((enemy) => ({
            id: enemy.id,
            x: enemy.x,
            y: enemy.y,
            radius: enemy.radius,
          })) ?? []
        }
        screenW={size.width}
        screenH={size.height}
        notification={notification}
        actions={hudActions}
        paused={uiPaused}
        speedMultiplier={speed}
        playerSpeed={playerSpeed}
        inventory={controllerRef.current?.getInventory?.()}
        inventoryVisible={true}
        onOpenPerks={(): void => setPerksOpen(true)}
        onChangeSpeed={(nextSpeed: number): void => controllerRef.current?.setSpeed(nextSpeed)}
        onOpenSettings={(): void => setSettingsOpen(true)}
        onToggleInventory={(): void => setInventoryVisible((prev) => prev)}
        onItemUse={handleItemUse}
        onItemDrop={handleItemDrop}
        onGrantPerkPoints={(amount: number): void =>
          controllerRef.current?.grantPerkPoints?.(amount)
        }
        selectedAmmo={hudState.ammo}
        ammoOptions={((): ReadonlyArray<import("../../shared/types/combat").AmmoType> => {
          const base: Array<import("../../shared/types/combat").AmmoType> = ["standard"];
          const tier = hudState.perks["combat.new-ammo-and-weapons"] ?? 0;
          if (tier > 0) base.push("kinetic", "plasma", "ion");
          return base;
        })()}
        onSelectAmmo={(type): void => controllerRef.current?.setAmmo?.(type)}
      />
      {/* Toasts overlay (stack) */}
      {toasts.length > 0 ? (
        <div className="absolute left-1/2 top-20 -translate-x-1/2 z-30 space-y-2 pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="hud-text text-sm bg-hud-bg/80 rounded px-4 py-2 shadow-lg border border-hud-accent/30"
            >
              {toast.message}
            </div>
          ))}
        </div>
      ) : null}
      {paused ? (
        <PauseMenu
          onResume={(): void => {
            setPaused(false);
          }}
          onDeleteData={(): void => {
            // Keep settings/keybindings; only clear saved session via settings menu
            controllerRef.current?.respawn?.();
            setPaused(false);
          }}
        />
      ) : null}
      <SettingsModal
        open={settingsOpen}
        onClose={(): void => setSettingsOpen(false)}
        speed={speed}
        onChangeSpeed={(nextSpeed: number): void => controllerRef.current?.setSpeed(nextSpeed)}
        onGrantPerkPoints={(amount: number): void =>
          controllerRef.current?.grantPerkPoints?.(amount)
        }
      />
      <PerkModal
        open={perksOpen}
        onClose={(): void => setPerksOpen(false)}
        level={hudState.level}
        perkPoints={hudState.perkPoints}
        unlocked={controllerRef.current?.getSnapshot().player.perks ?? {}}
        onUnlock={(perkId): void => controllerRef.current?.unlockPerk?.(perkId)}
        onSell={(perkId): void => controllerRef.current?.sellPerk?.(perkId)}
      />
      {mapMakerOpen ? (
        <div className="absolute inset-0 z-50 bg-gray-900">
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={() => setMapMakerOpen(false)}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded shadow-lg"
            >
              Close Map Maker (ESC)
            </button>
          </div>
          <MapMaker />
        </div>
      ) : null}
    </div>
  );
}
import { CrosshairOverlay } from "../hud/widgets/CrosshairOverlay";
