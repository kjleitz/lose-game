import { useEffect, useRef, useState } from "react";
import { Player } from "../../domain/game/player";
import type { PlayerState } from "../../domain/game/player";

export function usePlayer(initial: PlayerState = { x: 0, y: 0, vx: 0, vy: 0, angle: 0 }) {
  const playerRef = useRef<Player>(new Player(initial));
  const [playerPos, setPlayerPos] = useState<{ x: number; y: number }>({
    x: initial.x,
    y: initial.y,
  });
  const prevSpeedRef = useRef<number>(playerRef.current.getSpeedMultiplier());

  // Initialize speed multiplier from localStorage (if present)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("lose.speedMultiplier");
      if (raw) {
        const val = parseFloat(raw);
        if (Number.isFinite(val)) playerRef.current.setSpeedMultiplier(val);
        prevSpeedRef.current = playerRef.current.getSpeedMultiplier();
      }
    } catch {
      // ignore errors
    }
  }, []);

  function updatePlayer(dt: number, actions: Set<string>) {
    playerRef.current.update(dt, actions);
    setPlayerPos({ x: playerRef.current.state.x, y: playerRef.current.state.y });
    // Persist speed multiplier if it changed
    const current = playerRef.current.getSpeedMultiplier();
    if (current !== prevSpeedRef.current) {
      try {
        window.localStorage.setItem("lose.speedMultiplier", String(current));
      } catch {
        // ignore errors
      }
      prevSpeedRef.current = current;
    }
  }

  return { playerRef, playerPos, updatePlayer };
}
