import { InputManager } from "../input";
import type {
  GameEngine as IGameEngine,
  RenderingEngine,
  CameraSystem,
} from "../../shared/types/Game";
import type { ActionState } from "../input/ActionTypes";

export interface GameEngineConfig {
  // Configuration options will be added as we extract more systems
  canvas?: HTMLCanvasElement;
}

// Simple initial implementation - will expand as we extract more systems
export class GameEngine implements IGameEngine {
  readonly input: InputManager;
  readonly renderer: RenderingEngine | null;
  readonly camera: CameraSystem | null;

  constructor(config: GameEngineConfig = {}) {
    // TODO: Use config when implementing other systems
    void config;
    this.input = new InputManager();
    // TODO: Initialize other systems
    this.renderer = null;
    this.camera = null;
  }

  // Method to sync actions from external input system (temporary during transition)
  updateInputActions(actions: ActionState): void {
    // Clear current actions and set new ones
    this.input.actions = actions;
  }
}

export function createGameEngine(config: GameEngineConfig = {}): GameEngine {
  return new GameEngine(config);
}
