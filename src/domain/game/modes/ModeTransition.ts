import type { Point2D } from "../../../shared/types/geometry";
import type { GameModeState, GameModeType } from "./GameMode";

export interface PendingTransition {
  targetMode: GameModeType;
  data?: { planetId?: string; returnPosition?: Point2D };
}

export class ModeTransitionManager {
  private pending: PendingTransition | null = null;
  private savedStates: Map<GameModeType, GameModeState> = new Map();

  requestTransition(targetMode: GameModeType, data?: PendingTransition["data"]): void {
    this.pending = { targetMode, data };
  }

  hasPendingTransition(): boolean {
    return this.pending !== null;
  }

  consumePendingTransition(): PendingTransition | null {
    const pendingTransition = this.pending;
    this.pending = null;
    return pendingTransition;
  }

  saveState(mode: GameModeType, state: GameModeState): void {
    this.savedStates.set(mode, state);
  }

  getSavedState(mode: GameModeType): GameModeState | undefined {
    return this.savedStates.get(mode);
  }
}
