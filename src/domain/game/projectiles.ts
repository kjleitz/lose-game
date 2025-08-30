export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ttl: number; // seconds remaining
  radius: number;
}

import type { Pose2D } from "../../shared/types/geometry";

export function createProjectile(origin: Pose2D, speed = 600): Projectile {
  const dirX = Math.cos(origin.angle);
  const dirY = Math.sin(origin.angle);
  return {
    x: origin.x + dirX * 28, // spawn slightly ahead of ship
    y: origin.y + dirY * 28,
    vx: dirX * speed,
    vy: dirY * speed,
    ttl: 1.5, // seconds
    radius: 2,
  };
}

export function stepProjectile(projectile: Projectile, dt: number): void {
  projectile.x += projectile.vx * dt;
  projectile.y += projectile.vy * dt;
  projectile.ttl -= dt;
}
