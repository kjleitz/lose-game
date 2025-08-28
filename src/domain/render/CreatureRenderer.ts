import type { Enemy } from "../game/enemies";
import { drawCreature } from "./sprites";

export class CreatureRenderer {
  render(ctx: CanvasRenderingContext2D, creatures: Enemy[]): void {
    const time = Date.now() * 0.002;
    for (const c of creatures) {
      const wiggle = Math.sin(time + (c.x + c.y) * 0.01) * 2;
      const size = c.radius * 2;
      drawCreature(ctx, c.x, c.y + wiggle, "hostile", size);

      // Low health indicator
      if (c.health <= 10) {
        ctx.save();
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(c.x + c.radius * 0.6, c.y + wiggle - c.radius * 0.6, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }
}
