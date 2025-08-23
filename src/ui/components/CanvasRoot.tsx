import { useRef, useState, useEffect } from "react";
import { createCamera } from "../../domain/render/camera";
import { usePlayer } from "../hooks/usePlayer";
import { usePlanets } from "../hooks/usePlanets";
import { useInput } from "../hooks/useInput";
import { GameLoopProvider } from "./GameLoopProvider";
import { CanvasRenderer } from "./CanvasRenderer";
import { HudPanel } from "./HudPanel";
import { GameSession } from "../../domain/game/GameSession";

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

  // Create GameSession instance
  const gameSessionRef = useRef<GameSession | null>(null);
  useEffect(() => {
    gameSessionRef.current = new GameSession({
      camera: cameraRef.current,
      player: playerRef.current,
      planets,
      size,
    });
  }, [cameraRef, playerRef, planets, size]);

  function update(dt: number) {
    updateActions();
    if (gameSessionRef.current) {
      gameSessionRef.current.update(actions, updatePlayer, maybeGenerateRegion, dt);
      setNotification(gameSessionRef.current.notification);
    }
  }

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
          actions={actions}
          size={size}
        />
        <HudPanel
          player={playerPos}
          planets={planets}
          screenW={size.width}
          screenH={size.height}
          notification={notification}
          actions={actions}
          paused={paused}
        />
      </GameLoopProvider>
    </div>
  );
}
