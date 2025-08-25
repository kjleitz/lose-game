import type { Player } from "../player";
import type { GameSession } from "../GameSession";

export type GameModeType = "space" | "planet";

export interface GameModeState {
  readonly type: GameModeType;
}

export interface SpaceModeState extends GameModeState {
  readonly type: "space";
  playerPosition: { x: number; y: number };
  visitedPlanets: Set<string>;
}

export interface PlanetModeState extends GameModeState {
  readonly type: "planet";
  planetId: string;
  playerPosition: { x: number; y: number };
  exploredAreas: Set<string>;
}

export abstract class GameMode {
  abstract readonly type: GameModeType;

  abstract update(dt: number, actions: Set<string>, player: Player, session: GameSession): void;

  abstract canTransitionTo(mode: GameModeType): boolean;

  abstract saveState(): GameModeState;

  abstract loadState(state: GameModeState): void;

  abstract getRequiredHudComponents(): string[];
}
