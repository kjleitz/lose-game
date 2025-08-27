export interface TimeConfig {
  readonly DROPPED_ITEM_DESPAWN_SEC: number;
  readonly CORPSE_DURATION_SEC: number;
}

export const TIME: TimeConfig = Object.freeze({
  DROPPED_ITEM_DESPAWN_SEC: 300, // 5 minutes
  CORPSE_DURATION_SEC: 30, // 30 seconds
});
