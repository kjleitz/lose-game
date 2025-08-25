import type { ActionState } from "../../engine/input/ActionTypes";

export interface GameState {
  [key: string]: unknown;
}

export interface TransitionData {
  [key: string]: unknown;
}

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
  canTransitionTo(targetGame: string): boolean;
  prepareTransition(targetGame: string): TransitionData;
  receiveTransition(data: TransitionData): void;
}

export interface GameEngine {
  readonly input: InputManager;
  readonly renderer: any; // TODO: Will be RenderingEngine
  readonly camera: any; // TODO: Will be CameraSystem
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