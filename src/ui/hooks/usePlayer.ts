import { useRef, useState } from "react";
import { Player } from "../../domain/game/player";
import type { PlayerState } from "../../domain/game/player";

export function usePlayer(initial: PlayerState = { x: 0, y: 0, vx: 0, vy: 0, angle: 0 }) {
  const playerRef = useRef<Player>(new Player(initial));
  const [playerPos, setPlayerPos] = useState<{ x: number; y: number }>({
    x: initial.x,
    y: initial.y,
  });

  function updatePlayer(dt: number, actions: Set<string>) {
    playerRef.current.update(dt, actions);
    setPlayerPos({ x: playerRef.current.state.x, y: playerRef.current.state.y });
  }

  return { playerRef, playerPos, updatePlayer };
}
