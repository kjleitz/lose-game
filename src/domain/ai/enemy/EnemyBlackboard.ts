import type { Enemy } from "../../game/enemies";
import type { Player } from "../../game/player";
import type { Planet } from "../../game/planets";
import type { Point2D } from "../../../shared/types/geometry";

export interface EnemyBlackboardScratch {
  playerDetected: boolean;
  waypoint: Point2D | null;
  waypointReached: boolean;
  spawnX: number;
  spawnY: number;
}

export interface EnemyBlackboard {
  enemy: Enemy;
  player: Player;
  planets: Planet[];
  rng: () => number;
  time: number;
  scratch: EnemyBlackboardScratch;
}
