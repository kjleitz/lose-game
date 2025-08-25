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
    updateActions();
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
          onChangeSpeed={(n) => {
            playerRef.current.setSpeedMultiplier(n);
            try {
              window.localStorage.setItem("lose.speedMultiplier", String(n));
            } catch {
              // ignore errors
            }
          }}
          onOpenSettings={() => setSettingsOpen(true)}
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
