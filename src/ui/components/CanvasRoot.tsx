import { useRef, useState, useEffect } from "react";
import { createCamera } from "../../domain/render/camera";
import { usePlayer } from "../hooks/usePlayer";
import { usePlanets } from "../hooks/usePlanets";
import { useInput } from "../hooks/useInput";
import { GameLoopProvider } from "./GameLoopProvider";
import { CanvasRenderer } from "./CanvasRenderer";
import Hud from "../hud/Hud";
import { GameSession } from "../../domain/game/GameSession";
import SettingsModal from "./SettingsModal";
import type { Enemy } from "../../domain/game/enemies";
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
  const cameraRef = useRef(createCamera(0, 0, 1));
  const { playerRef, playerPos, updatePlayer } = usePlayer();
  const { planets, maybeGenerateRegion } = usePlanets(size);
  const { actions, updateActions } = useInput();
  const [paused] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inventoryVisible, setInventoryVisible] = useState(false);
  const [projectiles, setProjectiles] = useState<Array<{ x: number; y: number; radius: number }>>(
    [],
  );
  const [enemies, setEnemies] = useState<Enemy[]>([]);

  // Create GameSession instance - only recreate when essential deps change
  const gameSessionRef = useRef<GameSession | null>(null);
  useEffect(() => {
    if (!gameSessionRef.current) {
      gameSessionRef.current = new GameSession({
        camera: cameraRef.current,
        player: playerRef.current,
        planets,
        size,
      });
    }
  }, [cameraRef, planets, playerRef, size]); // Removed planets from dependency array

  function update(dt: number) {
    const previousActions = new Set(actions);
    updateActions();
    
    // Handle inventory toggle (only on key press, not hold)
    if (actions.has("inventory") && !previousActions.has("inventory")) {
      setInventoryVisible(prev => !prev);
    }
    
    if (gameSessionRef.current) {
      gameSessionRef.current.update(actions, updatePlayer, maybeGenerateRegion, dt);
      setNotification(gameSessionRef.current.notification);
      // Trigger a light update for projectiles reference used by renderer
      setProjectiles(gameSessionRef.current.projectiles.slice());
      setEnemies(gameSessionRef.current.enemies.slice());
    }
  }

  // Update planets in GameSession when they change
  useEffect(() => {
    if (gameSessionRef.current && planets.length > 0) {
      gameSessionRef.current.updatePlanets(planets);
    }
  }, [planets]);

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
    if (playerRef.current.inventory) {
      playerRef.current.inventory.removeItem(item.id, quantity);
    }
  }
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <GameLoopProvider update={update} render={render}>
        <CanvasRenderer
          player={playerRef.current.state}
          camera={cameraRef.current}
          planets={planets}
          projectiles={projectiles}
          enemies={enemies}
          actions={actions}
          size={size}
          gameSession={gameSessionRef.current}
        />
        <Hud
          player={playerPos}
          experience={playerPos.experience}
          health={playerPos.health}
          planets={planets}
          screenW={size.width}
          screenH={size.height}
          notification={notification}
          actions={actions}
          paused={paused}
          speedMultiplier={playerRef.current.getSpeedMultiplier()}
          inventory={playerRef.current.inventory}
          inventoryVisible={inventoryVisible}
          onChangeSpeed={(n) => {
            playerRef.current.setSpeedMultiplier(n);
            try {
              window.localStorage.setItem("lose.speedMultiplier", String(n));
            } catch {
              // ignore errors
            }
          }}
          onOpenSettings={() => setSettingsOpen(true)}
          onToggleInventory={() => setInventoryVisible(prev => !prev)}
          onItemUse={handleItemUse}
          onItemDrop={handleItemDrop}
        />
        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          speed={playerRef.current.getSpeedMultiplier()}
          onChangeSpeed={(n) => {
            playerRef.current.setSpeedMultiplier(n);
            try {
              window.localStorage.setItem("lose.speedMultiplier", String(n));
            } catch {
              // ignore errors
            }
          }}
        />
      </GameLoopProvider>
    </div>
  );
}
