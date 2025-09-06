import { useEffect, useRef, useState } from "react";

import type { Action } from "../../application/input/ActionTypes";
import type { PlayerState } from "../../domain/game/player";
import { Player } from "../../domain/game/player";

export interface UsePlayerResult {
  playerRef: React.MutableRefObject<Player>;
  playerPos: { x: number; y: number; experience: number; health: number };
  updatePlayer: (dt: number, actions: Set<Action>, visitedPlanet?: boolean) => void;
}

export function usePlayer(
  initial: PlayerState = { x: 0, y: 0, vx: 0, vy: 0, angle: 0, experience: 0, health: 100 },
): UsePlayerResult {
  const playerRef = useRef<Player>(new Player(initial));
  const [playerPos, setPlayerPos] = useState<{
    x: number;
    y: number;
    experience: number;
    health: number;
  }>({
    x: initial.x,
    y: initial.y,
    experience: initial.experience ?? 0,
    health: initial.health ?? 100,
  });
  const prevSpeedRef = useRef<number>(playerRef.current.getSpeedMultiplier());

  // Initialize speed multiplier from localStorage (if present)
  useEffect((): void => {
    try {
      const raw = window.localStorage.getItem("lose.speedMultiplier");
      if (raw != null && raw !== "") {
        const val = parseFloat(raw);
        if (Number.isFinite(val)) playerRef.current.setSpeedMultiplier(val);
        prevSpeedRef.current = playerRef.current.getSpeedMultiplier();
      }
    } catch {
      // ignore errors
    }
  }, []);

  function updatePlayer(dt: number, actions: Set<Action>, visitedPlanet?: boolean): void {
    playerRef.current.update(dt, actions, visitedPlanet);
    setPlayerPos({
      x: playerRef.current.state.x,
      y: playerRef.current.state.y,
      experience: playerRef.current.state.experience ?? 0,
      health: playerRef.current.state.health ?? 100,
    });
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
