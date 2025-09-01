import type { EnemyView as Enemy } from "../game/views";
import { drawEnemyShip, drawEnemyThruster } from "./sprites";

export class EnemyRenderer {
  render(ctx: CanvasRenderingContext2D, enemies: Enemy[]): void {
    for (const enemy of enemies) {
      // Calculate ship size based on enemy radius (scale up from circle)
      const shipSize = enemy.radius * 2.5;

      // Calculate movement/thrust power based on velocity
      const speed = Math.hypot(enemy.vx, enemy.vy);
      const thrustPower = Math.min(1, speed / enemy.maxSpeed);

      // Draw thruster effect if enemy is moving
      if (thrustPower > 0.1) {
        drawEnemyThruster(
          ctx,
          enemy.x,
          enemy.y,
          enemy.angle,
          shipSize * 0.8,
          thrustPower,
          `enemy-${enemy.x}-${enemy.y}`, // Unique ID for trail tracking
        );
      }

      // Draw the enemy ship
      drawEnemyShip(ctx, enemy.x, enemy.y, enemy.angle, shipSize);

      // Optional: Health indicator for damaged enemies
      if (enemy.health <= 10) {
        ctx.save();
        ctx.fillStyle = "#ff3c3c";
        ctx.beginPath();
        ctx.arc(enemy.x + shipSize / 3, enemy.y - shipSize / 3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }
}
