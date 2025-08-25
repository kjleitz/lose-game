import type { GameModeType, GameModeState } from "./GameMode";
import type { Player } from "../player";
import type { Planet } from "../planets";

export interface ModeTransitionRequest {
  targetMode: GameModeType;
  data?: unknown;
}

export interface LandingTransitionData {
  planetId: string;
}

export interface TakeoffTransitionData {
  returnPosition: { x: number; y: number };
}

export class ModeTransitionManager {
  private modeStates: Map<GameModeType, GameModeState> = new Map();
  private pendingTransition: ModeTransitionRequest | null = null;

  requestTransition(targetMode: GameModeType, data?: unknown): void {
    this.pendingTransition = { targetMode, data };
  }

  hasPendingTransition(): boolean {
    return this.pendingTransition !== null;
  }

  consumePendingTransition(): ModeTransitionRequest | null {
    const request = this.pendingTransition;
    this.pendingTransition = null;
    return request;
  }

  saveState(mode: GameModeType, state: GameModeState): void {
    this.modeStates.set(mode, state);
  }

  getState(mode: GameModeType): GameModeState | undefined {
    return this.modeStates.get(mode);
  }

  prepareLandingTransition(
    _player: Player,
    planet: Planet,
  ): { playerPosition: { x: number; y: number } } {
    // Calculate landing position on planet surface
    const landingX = planet.x + Math.random() * 40 - 20; // Small random offset
    const landingY = planet.y + Math.random() * 40 - 20;

    return {
      playerPosition: { x: landingX, y: landingY },
    };
  }

  prepareTakeoffTransition(
    _player: Player,
    data: TakeoffTransitionData,
  ): { playerPosition: { x: number; y: number } } {
    return {
      playerPosition: data.returnPosition,
    };
  }
}
