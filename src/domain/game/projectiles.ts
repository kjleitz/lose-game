export type Projectile = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ttl: number; // seconds remaining
  radius: number;
};

export function createProjectile(
  origin: { x: number; y: number; angle: number },
  speed = 600,
): Projectile {
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

export function stepProjectile(p: Projectile, dt: number) {
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.ttl -= dt;
}
