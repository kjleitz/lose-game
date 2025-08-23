export interface GameState {
  time: number; // seconds since start
}

export function createInitialState(): GameState {
  return { time: 0 };
}
