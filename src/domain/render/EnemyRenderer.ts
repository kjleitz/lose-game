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

      // Hit flash overlay
      if (enemy.hitFlash) {
        const progress = enemy.hitFlash.progress;
        const alpha = Math.max(0, 0.8 * (1 - progress));
        if (alpha > 0.02) {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = Math.max(2, shipSize * 0.08);
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y, shipSize * 0.55, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

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
