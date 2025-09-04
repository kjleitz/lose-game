import type { EnemyView as Enemy } from "../game/views";
import { drawCreature } from "./sprites";

export class CreatureRenderer {
  render(ctx: CanvasRenderingContext2D, creatures: Enemy[]): void {
    const timeSec = Date.now() * 0.001;
    for (const creature of creatures) {
      // Bounce amount and frequency scale with movement speed
      const size = Math.max(8, creature.radius * 2);
      const speed = Math.hypot(creature.vx, creature.vy);
      const maxSpeed = Math.max(0.0001, creature.maxSpeed);
      const speedNorm = Math.max(0, Math.min(1, speed / maxSpeed));
      const amplitude = size * (0.06 + 0.12 * speedNorm); // ~2px idle to ~6px running (for size≈32)
      const freqHz = 1.6 + 3.4 * speedNorm; // faster cadence when moving
      const phase = (creature.x + creature.y) * 0.02; // desync neighbors
      const bounce = Math.sin(timeSec * Math.PI * 2 * freqHz + phase) * amplitude;

      // Grounded shadow (does not move with the bounce)
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "#000";
      ctx.beginPath();
      // Make shadow slightly smaller when the creature is at peak height
      const heightNorm = (bounce / amplitude + 1) * 0.5; // 0..1
      const heightFactor = Math.max(0.65, 0.95 - 0.3 * heightNorm);
      const shadowW = size * 0.5 * heightFactor;
      const shadowH = size * 0.18 * heightFactor;
      const shadowX = creature.x;
      const shadowY = creature.y + size * 0.5; // southward offset, like ship shadow
      ctx.ellipse(shadowX, shadowY, shadowW, shadowH, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Draw the creature at its bounced position
      drawCreature(ctx, creature.x, creature.y + bounce, "hostile", size);

      // Melee swipe animation overlay
      if (creature.meleeSwing) {
        const { progress, angle, reach, arc } = creature.meleeSwing;
        const alpha = 0.9 * (1 - progress);
        if (alpha > 0.02) {
          const start = angle - arc * 0.6 + arc * progress;
          const end = start + arc * 0.35;
          const r0 = Math.max(8, size * 0.6);
          const r1 = reach;
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = "#ff6666";
          ctx.beginPath();
          ctx.moveTo(creature.x + Math.cos(start) * r0, creature.y + bounce + Math.sin(start) * r0);
          ctx.arc(creature.x, creature.y + bounce, r1, start, end);
          ctx.lineTo(creature.x + Math.cos(end) * r0, creature.y + bounce + Math.sin(end) * r0);
          ctx.arc(creature.x, creature.y + bounce, r0, end, start, true);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }

      // Hit flash overlay for creatures
      if (creature.hitFlash) {
        const progress = creature.hitFlash.progress;
        const alpha = Math.max(0, 0.85 * (1 - progress));
        if (alpha > 0.02) {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = Math.max(2, size * 0.12);
          ctx.beginPath();
          ctx.arc(creature.x, creature.y + bounce, size * 0.7, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Low health indicator
      if (creature.health <= 10) {
        ctx.save();
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(
          creature.x + creature.radius * 0.6,
          creature.y + bounce - creature.radius * 0.6,
          3,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.restore();
      }
    }
  }
}
