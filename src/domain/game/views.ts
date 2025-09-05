import type { Kinematics2D, Circle2D } from "../../shared/types/geometry";
import type { Planet } from "./planets";

export interface PlayerView extends Kinematics2D {
  health: number;
  healthMax: number;
  experience: number; // current XP toward next level
  level: number;
  xpToNextLevel: number;
  perkPoints: number;
  perks: Record<string, number>;
  hitFlash?: { progress: number };
}

export interface EnemyView {
  id: string;
  x: number;
  y: number;
  radius: number;
  health: number;
  angle: number;
  vx: number;
  vy: number;
  visionRadius: number;
  visionHysteresis: number;
  turnSpeed: number; // rad/s
  accel: number; // units/s^2
  maxSpeed: number; // units/s
  meleeSwing?: { progress: number; angle: number; reach: number; arc: number };
  hitFlash?: { progress: number };
}
export type PlanetView = Planet;
export type ProjectileView = Circle2D;

export interface EntityCounts {
  players: number;
  enemies: number;
  planets: number;
  projectiles: number;
}
