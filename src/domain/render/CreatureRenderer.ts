import type { EnemyView as Enemy } from "../game/views";
import { drawCreature } from "./sprites";

export class CreatureRenderer {
  render(ctx: CanvasRenderingContext2D, creatures: Enemy[]): void {
    const time = Date.now() * 0.002;
    for (const creature of creatures) {
      const wiggle = Math.sin(time + (creature.x + creature.y) * 0.01) * 2;
      const size = creature.radius * 2;
      drawCreature(ctx, creature.x, creature.y + wiggle, "hostile", size);

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
          ctx.moveTo(creature.x + Math.cos(start) * r0, creature.y + wiggle + Math.sin(start) * r0);
          ctx.arc(creature.x, creature.y + wiggle, r1, start, end);
          ctx.lineTo(creature.x + Math.cos(end) * r0, creature.y + wiggle + Math.sin(end) * r0);
          ctx.arc(creature.x, creature.y + wiggle, r0, end, start, true);
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
          ctx.arc(creature.x, creature.y + wiggle, size * 0.7, 0, Math.PI * 2);
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
          creature.y + wiggle - creature.radius * 0.6,
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
