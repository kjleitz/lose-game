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
    this.input = new InputManager();
    // TODO: Initialize other systems
    this.renderer = null;
    this.camera = null;
  }
}

export function createGameEngine(config: GameEngineConfig = {}): GameEngine {
  return new GameEngine(config);
}