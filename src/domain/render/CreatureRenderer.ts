import type { Enemy } from "../game/enemies";

export class CreatureRenderer {
  render(ctx: CanvasRenderingContext2D, creatures: Enemy[]): void {
    const time = Date.now() * 0.002;
    for (const c of creatures) {
      const wiggle = Math.sin(time + (c.x + c.y) * 0.01) * 2;
      const r = c.radius;
      const x = c.x;
      const y = c.y + wiggle;

      // Body
      ctx.save();
      ctx.fillStyle = "#4ade80"; // green-ish creature
      ctx.strokeStyle = "#14532d";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Belly highlight
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.beginPath();
      ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.6, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      const eyeOffsetX = r * 0.35;
      const eyeOffsetY = -r * 0.2;
      const eyeR = Math.max(2, r * 0.18);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(x - eyeOffsetX, y + eyeOffsetY, eyeR, 0, Math.PI * 2);
      ctx.arc(x + eyeOffsetX, y + eyeOffsetY, eyeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#111827";
      const pupilR = Math.max(1, eyeR * 0.45);
      ctx.beginPath();
      ctx.arc(x - eyeOffsetX + pupilR * 0.3, y + eyeOffsetY, pupilR, 0, Math.PI * 2);
      ctx.arc(x + eyeOffsetX - pupilR * 0.3, y + eyeOffsetY, pupilR, 0, Math.PI * 2);
      ctx.fill();

      // Little legs
      ctx.strokeStyle = "#065f46";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const legs = 3;
      for (let i = 0; i < legs; i++) {
        const t = (i / (legs - 1)) * Math.PI - Math.PI; // spread along bottom
        const lx = x + Math.cos(t) * (r * 0.6);
        const ly = y + r * 0.8;
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx + (i - 1) * 2, ly + 6);
      }
      ctx.stroke();

      // Low health indicator
      if (c.health <= 10) {
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(x + r * 0.6, y - r * 0.6, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }
}
