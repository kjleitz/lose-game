import { useRef, useState, useEffect } from "react";
import { useInput } from "../hooks/useInput";
import { GameLoopProvider } from "./GameLoopProvider";
import { CanvasRenderer } from "./CanvasRenderer";
import Hud from "../hud/Hud";
import { GameSessionECS } from "../../domain/ecs/GameSessionECS";
import SettingsModal from "./SettingsModal";
import type { Item } from "../../domain/game/items/Item";

function useCanvasSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return size;
}

export default function CanvasRoot() {
  const size = useCanvasSize();
  const { actions, updateActions } = useInput();
  const [paused] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inventoryVisible, setInventoryVisible] = useState(false);

  // Create ECS GameSession instance
  const gameSessionRef = useRef<GameSessionECS | null>(null);
  useEffect(() => {
    if (!gameSessionRef.current) {
      gameSessionRef.current = new GameSessionECS({
        camera: { x: 0, y: 0, zoom: 1 },
        size,
      });
    }
  }, [size]);

  function update(dt: number) {
    const previousActions = new Set(actions);
    updateActions();

    // Handle inventory toggle (only on key press, not hold)
    if (actions.has("inventory") && !previousActions.has("inventory")) {
      setInventoryVisible((prev) => !prev);
    }

    if (!paused && gameSessionRef.current) {
      gameSessionRef.current.update(actions, dt);
      setNotification(gameSessionRef.current.getNotification());
    }
  }

  // No longer need to update planets - they're created in ECS constructor

  function render() {
    // CanvasRenderer handles all drawing
    // No-op here, handled by CanvasRenderer
  }

  function handleItemUse(item: Item) {
    console.log("Using item:", item.name);
    // TODO: Implement item use logic based on item type
  }

  function handleItemDrop(item: Item, quantity: number) {
    console.log("Dropping item:", item.name, "quantity:", quantity);
    // TODO: Implement item dropping logic
  }

  // Get current game state from ECS
  const player = gameSessionRef.current?.getPlayer() || {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    angle: 0,
    health: 100,
  };
  const enemies = gameSessionRef.current?.getEnemies() || [];
  const planets = gameSessionRef.current?.getPlanets() || [];
  const projectiles = gameSessionRef.current?.getProjectiles() || [];
  const camera = gameSessionRef.current?.getCamera() || { x: 0, y: 0, zoom: 1 };

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <GameLoopProvider update={update} render={render}>
        <CanvasRenderer
          player={player}
          camera={camera}
          planets={planets}
          projectiles={projectiles}
          enemies={enemies}
          actions={actions}
          size={size}
          gameSession={null}
        />
        <Hud
          player={player}
          experience={0} // TODO: Get from ECS
          health={player.health}
          planets={planets}
          screenW={size.width}
          screenH={size.height}
          notification={notification}
          actions={actions}
          paused={paused}
          speedMultiplier={1} // TODO: Implement speed multiplier in ECS
          inventory={undefined}
          inventoryVisible={inventoryVisible}
          onChangeSpeed={(_n) => {
            // TODO: Implement speed control in ECS
          }}
          onOpenSettings={() => setSettingsOpen(true)}
          onToggleInventory={() => setInventoryVisible((prev) => !prev)}
          onItemUse={handleItemUse}
          onItemDrop={handleItemDrop}
        />
        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          speed={1} // TODO: Get from ECS
          onChangeSpeed={(_n) => {
            // TODO: Implement speed control in ECS
          }}
        />
      </GameLoopProvider>
    </div>
  );
}
