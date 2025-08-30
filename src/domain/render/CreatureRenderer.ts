import type { Enemy } from "../game/enemies";
import { drawCreature } from "./sprites";

export class CreatureRenderer {
  render(ctx: CanvasRenderingContext2D, creatures: Enemy[]): void {
    const time = Date.now() * 0.002;
    for (const creature of creatures) {
      const wiggle = Math.sin(time + (creature.x + creature.y) * 0.01) * 2;
      const size = creature.radius * 2;
      drawCreature(ctx, creature.x, creature.y + wiggle, "hostile", size);

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
