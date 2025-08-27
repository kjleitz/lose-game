import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";

import type { GameController } from "../../application/GameAPI";
import { GameApp } from "../../application/GameApp";
import type { Item } from "../../domain/game/items/Item";
import type { Planet } from "../../domain/game/planets";
import type { Action } from "../../engine/input/ActionTypes";
import type { Point2D, ViewSize } from "../../shared/types/geometry";
import { Hud } from "../hud/Hud";
import { SettingsModal } from "./SettingsModal";

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
  const [paused] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inventoryVisible, setInventoryVisible] = useState(false);
  const controllerRef = useRef<GameController | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hudState, setHudState] = useState<{
    player: Point2D;
    experience: number;
    health: number;
    planets: Planet[];
  }>(() => ({
    player: { x: 0, y: 0 },
    experience: 0,
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

    void (async (): Promise<void> => {
      const ctrl = await GameApp.create(canvas, { size: { width, height } });
      if (disposed) return;
      controllerRef.current = ctrl;
      setSpeed(ctrl.getSpeed());
      unsub = ctrl.bus.subscribe("tick", (e): void => {
        const s = e.snapshot;
        setHudState({
          player: { x: s.player.x, y: s.player.y },
          experience: s.player.experience,
          health: s.player.health,
          planets: s.planets,
        });
      });
      unsubNotif = ctrl.bus.subscribe("notification", (e): void => {
        setNotification(e.message);
      });
      unsubInput = ctrl.bus.subscribe("inputChanged", (e): void => {
        setHudActions(new Set(e.actions));
      });
      unsubSpeed = ctrl.bus.subscribe("speedChanged", (e): void => {
        setSpeed(e.value);
      });
      ctrl.start();
    })();

    return (): void => {
      disposed = true;
      if (unsub) unsub();
      if (unsubNotif) unsubNotif();
      if (unsubInput) unsubInput();
      if (unsubSpeed) unsubSpeed();
      controllerRef.current?.dispose();
      controllerRef.current = null;
    };
  }, [width, height]);

  function handleItemUse(item: Item): void {
    console.log("Using item:", item.name);
    // TODO: Implement item use logic based on item type
  }

  function handleItemDrop(item: Item, quantity: number): void {
    console.log("Dropping item:", item.name, "quantity:", quantity);
    // TODO: Implement item dropping logic
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden" data-testid="game-root">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <Hud
        player={hudState.player}
        experience={hudState.experience}
        health={hudState.health}
        planets={hudState.planets}
        screenW={size.width}
        screenH={size.height}
        notification={notification}
        actions={hudActions}
        paused={paused}
        speedMultiplier={speed}
        inventory={undefined}
        inventoryVisible={inventoryVisible}
        onChangeSpeed={(n: number): void => controllerRef.current?.setSpeed(n)}
        onOpenSettings={(): void => setSettingsOpen(true)}
        onToggleInventory={(): void => setInventoryVisible((prev) => !prev)}
        onItemUse={handleItemUse}
        onItemDrop={handleItemDrop}
      />
      <SettingsModal
        open={settingsOpen}
        onClose={(): void => setSettingsOpen(false)}
        speed={speed}
        onChangeSpeed={(n: number): void => controllerRef.current?.setSpeed(n)}
      />
    </div>
  );
}
