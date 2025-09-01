import type { Kinematics2D, Circle2D } from "../../shared/types/geometry";
import type { Enemy } from "./enemies";
import type { Planet } from "./planets";

export interface PlayerView extends Kinematics2D {
  health: number;
  experience: number; // current XP toward next level
  level: number;
  xpToNextLevel: number;
  perkPoints: number;
  perks: Record<string, number>;
}

export type EnemyView = Enemy;
export type PlanetView = Planet;
export type ProjectileView = Circle2D;

export interface EntityCounts {
  players: number;
  enemies: number;
  planets: number;
  projectiles: number;
}
