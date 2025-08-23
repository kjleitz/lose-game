import { generatePlanets } from "./planets";
import type { Planet } from "./planets";

export interface GameState {
  time: number; // seconds since start
  planets: Planet[];
}

export function createInitialState(screenW = 1280, screenH = 720): GameState {
  return {
    time: 0,
    planets: generatePlanets({
      count: 16,
      screenW,
      screenH,
      center: { x: 0, y: 0 },
    }),
  };
}
