import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";

import type { GameController } from "../../application/GameAPI";
import { GameApp } from "../../application/GameApp";
import type { Item } from "../../domain/game/items/Item";
import type { Planet } from "../../domain/game/planets";
import type { Action } from "../../application/input/ActionTypes";
import type { Point2D, ViewSize } from "../../shared/types/geometry";
import { Hud } from "../hud/Hud";
import { SettingsModal } from "../overlays/dialogs/SettingsModal";
import { PerkModal } from "../overlays/dialogs/PerkModal";
import { PauseMenu } from "../overlays/menus/PauseMenu";
import { deleteAllGameData } from "../../application/persistence/deleteData";

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
  const [, /* inventoryVisible */ setInventoryVisible] = useState(true);
  const controllerRef = useRef<GameController | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hudState, setHudState] = useState<{
    player: Point2D;
    experience: number;
    level: number;
    xpToNextLevel: number;
    perkPoints: number;
    health: number;
    planets: Planet[];
  }>(() => ({
    player: { x: 0, y: 0 },
    experience: 0,
    level: 1,
    xpToNextLevel: 100,
    perkPoints: 0,
    health: 100,
    planets: [],
  }));
  // HUD actions readout and speed mirror
  const [hudActions, setHudActions] = useState<Set<Action>>(() => new Set());
  const [speed, setSpeed] = useState<number>(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let unsub: (() => void) | null = null;
    let unsubNotif: (() => void) | null = null;
    let unsubInput: (() => void) | null = null;
    let unsubSpeed: (() => void) | null = null;
    let unsubToast: (() => void) | null = null;

    void (async (): Promise<void> => {
      const ctrl = await GameApp.create(canvas, { size: { width, height } });
      if (disposed) return;
      controllerRef.current = ctrl;
      setSpeed(ctrl.getSpeed());
      unsub = ctrl.bus.subscribe("tick", (event): void => {
        const snapshot = event.snapshot;
        setHudState({
          player: { x: snapshot.player.x, y: snapshot.player.y },
          experience: snapshot.player.experience,
          level: snapshot.player.level,
          xpToNextLevel: snapshot.player.xpToNextLevel,
          perkPoints: snapshot.player.perkPoints,
          health: snapshot.player.health,
          planets: snapshot.planets,
        });
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
      ctrl.start();
    })();

    const onEsc = (event: KeyboardEvent): void => {
      if (event.code === "Escape") {
        setPaused((prev) => {
          const next = !prev;
          if (next) controllerRef.current?.pause();
          else controllerRef.current?.resume();
          return next;
        });
      }
    };
    window.addEventListener("keydown", onEsc);

    return (): void => {
      disposed = true;
      if (unsub) unsub();
      if (unsubNotif) unsubNotif();
      if (unsubInput) unsubInput();
      if (unsubSpeed) unsubSpeed();
      if (unsubToast) unsubToast();
      window.removeEventListener("keydown", onEsc);
      controllerRef.current?.dispose();
      controllerRef.current = null;
    };
  }, [width, height]);

  function handleItemUse(item: Item): void {
    console.log("Using item:", item.name);
  }

  function handleItemDrop(item: Item, quantity: number): void {
    console.log("Dropping item:", item.name, "quantity:", quantity);
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden" data-testid="game-root">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <Hud
        player={hudState.player}
        experience={hudState.experience}
        level={hudState.level}
        xpToNextLevel={hudState.xpToNextLevel}
        perkPoints={hudState.perkPoints}
        health={hudState.health}
        planets={hudState.planets}
        screenW={size.width}
        screenH={size.height}
        notification={notification}
        actions={hudActions}
        paused={paused}
        speedMultiplier={speed}
        inventory={controllerRef.current?.getInventory?.()}
        inventoryVisible={true}
        onOpenPerks={(): void => setPerksOpen(true)}
        onChangeSpeed={(nextSpeed: number): void => controllerRef.current?.setSpeed(nextSpeed)}
        onOpenSettings={(): void => setSettingsOpen(true)}
        onToggleInventory={(): void => setInventoryVisible((prev) => prev)}
        onItemUse={handleItemUse}
        onItemDrop={handleItemDrop}
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
            controllerRef.current?.resume();
          }}
          onDeleteData={(): void => {
            deleteAllGameData();
            setPaused(false);
            controllerRef.current?.resume();
          }}
        />
      ) : null}
      <SettingsModal
        open={settingsOpen}
        onClose={(): void => setSettingsOpen(false)}
        speed={speed}
        onChangeSpeed={(nextSpeed: number): void => controllerRef.current?.setSpeed(nextSpeed)}
      />
      <PerkModal
        open={perksOpen}
        onClose={(): void => setPerksOpen(false)}
        level={hudState.level}
        perkPoints={hudState.perkPoints}
        unlocked={controllerRef.current?.getSnapshot().player.perks ?? {}}
        onUnlock={(perkId): void => controllerRef.current?.unlockPerk?.(perkId)}
      />
    </div>
  );
}
