import type { Enemy } from "../../domain/game/enemies";
import type { GameModeType } from "../../domain/game/modes/GameMode";
import type { Planet } from "../../domain/game/planets";
import type { Projectile } from "../../domain/game/projectiles";
import type { ActionState } from "../../engine/input/ActionTypes";
import type { PlanetSurface as PlanetSurfaceT } from "../../games/planet/PlanetGame";
import type { Point2D } from "./geometry";

// Concrete state shapes are provided by each game mode;
// use a narrow union for known games to avoid loose index signatures.
export interface SpaceGameState {
  playerPosition: Point2D;
  visitedPlanets: Set<string>;
  enemies: Enemy[];
  projectiles: Projectile[];
}

export interface PlanetGameStateShared {
  planetId: string;
  playerPosition: Point2D;
  exploredAreas: Set<string>;
}

export interface PlanetGameState extends PlanetGameStateShared {
  surface?: PlanetSurfaceT;
}

export type GameState = SpaceGameState | PlanetGameState;

// Explicit transition data between modes
export interface SpaceToPlanetTransition {
  planetId: string;
}

export interface PlanetToSpaceTransition {
  returnPosition: Point2D;
}

export interface PlanetLandingTransition {
  planet: Planet;
}

export type TransitionData =
  | SpaceToPlanetTransition
  | PlanetToSpaceTransition
  | PlanetLandingTransition;

export interface Game {
  readonly name: string;
  readonly version: string;

  // Lifecycle
  initialize(engine: GameEngine): void;
  update(dt: number): void;
  render(): void;
  cleanup(): void;

  // State management
  saveState(): GameState;
  loadState(state: GameState): void;

  // Mode transitions
  canTransitionTo(targetGame: GameModeType): boolean;
  prepareTransition(targetGame: GameModeType): TransitionData | null;
  receiveTransition(data: TransitionData): void;
}

export interface GameEngine {
  readonly input: InputManager;
  readonly renderer: RenderingEngine | null; // placeholder until system extraction completes
  readonly camera: CameraSystem | null; // placeholder until system extraction completes
}

// These will be implemented as we extract the systems
export interface InputManager {
  actions: ActionState;
}

export interface RenderingEngine {
  // Will wrap our existing rendering system
  render?: () => void;
}

export interface CameraSystem {
  // Will wrap our existing camera system
  x?: number;
  y?: number;
  zoom?: number;
}
