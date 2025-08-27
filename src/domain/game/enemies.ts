export interface Enemy {
  id: string;
  x: number;
  y: number;
  radius: number;
  health: number;
  angle: number;
  vx: number;
  vy: number;
  // AI config
  visionRadius: number;
  visionHysteresis: number;
  turnSpeed: number; // rad/s
  accel: number; // units/s^2
  maxSpeed: number; // units/s
}

export function createEnemy(id: string, x: number, y: number, radius = 14, health = 20): Enemy {
  return {
    id,
    x,
    y,
    radius,
    health,
    angle: 0,
    vx: 0,
    vy: 0,
    visionRadius: 700,
    visionHysteresis: 80,
    turnSpeed: 1.8,
    accel: 200,
    maxSpeed: 300,
  };
}
