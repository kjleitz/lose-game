import type { Action } from "../../../application/input/ActionTypes";
import type { Point2D } from "../../../shared/types/geometry";
import type { GameSession } from "../GameSession";
import type { Player } from "../player";

export type GameModeType = "space" | "planet";

export interface GameModeState {
  readonly type: GameModeType;
}

export interface SpaceModeState extends GameModeState {
  readonly type: "space";
  playerPosition: Point2D;
  visitedPlanets: Set<string>;
}

export interface PlanetModeState extends GameModeState {
  readonly type: "planet";
  planetId: string;
  playerPosition: Point2D;
  exploredAreas: Set<string>;
}

export abstract class GameMode {
  abstract readonly type: GameModeType;

  abstract update(dt: number, actions: Set<Action>, player: Player, session: GameSession): void;

  abstract canTransitionTo(mode: GameModeType): boolean;

  abstract saveState(): GameModeState;

  abstract loadState(state: GameModeState): void;

  abstract getRequiredHudComponents(): string[];
}
