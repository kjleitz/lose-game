import type { GameModeType, GameModeState } from "./GameMode";
import type { Player } from "../player";
import type { Planet } from "../planets";
import type { Point2D } from "../../../shared/types/geometry";

export interface ModeTransitionData {
  planetId?: string;
  returnPosition?: Point2D;
}

export interface ModeTransitionRequest {
  targetMode: GameModeType;
  data?: ModeTransitionData;
}

export interface LandingTransitionData {
  planetId: string;
}

export interface TakeoffTransitionData {
  returnPosition: Point2D;
}

export class ModeTransitionManager {
  private modeStates: Map<GameModeType, GameModeState> = new Map();
  private pendingTransition: ModeTransitionRequest | null = null;

  requestTransition(targetMode: GameModeType, data?: ModeTransitionData): void {
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

  prepareLandingTransition(_player: Player, planet: Planet): { playerPosition: Point2D } {
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
  ): { playerPosition: Point2D } {
    return {
      playerPosition: data.returnPosition,
    };
  }
}
