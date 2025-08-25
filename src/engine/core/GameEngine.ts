import { InputManager } from "../input";
import type { GameEngine as IGameEngine } from "../../shared/types/Game";

export interface GameEngineConfig {
  // Configuration options will be added as we extract more systems
  canvas?: HTMLCanvasElement;
}

// Simple initial implementation - will expand as we extract more systems
export class GameEngine implements IGameEngine {
  readonly input: InputManager;
  readonly renderer: any; // TODO: Will be RenderingEngine  
  readonly camera: any; // TODO: Will be CameraSystem

  constructor(config: GameEngineConfig = {}) {
    // TODO: Use config when implementing other systems
    void config;
    this.input = new InputManager();
    // TODO: Initialize other systems
    this.renderer = null;
    this.camera = null;
  }

  // Method to sync actions from external input system (temporary during transition)
  updateInputActions(actions: Set<string>): void {
    // Clear current actions and set new ones
    // TODO: Fix type conversion when Action type is properly imported
    this.input.actions = actions as any;
  }
}

export function createGameEngine(config: GameEngineConfig = {}): GameEngine {
  return new GameEngine(config);
}