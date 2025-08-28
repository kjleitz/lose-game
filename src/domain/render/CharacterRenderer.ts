type CtxLike = Pick<
  CanvasRenderingContext2D,
  | "save"
  | "restore"
  | "translate"
  | "rotate"
  | "drawImage"
  | "fillRect"
  | "strokeRect"
  | "beginPath"
  | "ellipse"
  | "fill"
  | "stroke"
  | "arc"
  | "moveTo"
  | "lineTo"
  | "closePath"
  | "globalAlpha"
  | "lineWidth"
  | "strokeStyle"
  | "fillStyle"
  | "shadowBlur"
  | "shadowColor"
> & { canvas: HTMLCanvasElement };

export class CharacterRenderer {
  render(ctx: CtxLike, player: Kinematics2D, actions: Set<Action>, size = 24): void {
    // Sprite as the primary visual
    drawCharacter(ctx, player.x, player.y, player.angle, size);

    // Overlay simple FX (firing flash, speed lines)
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    const isMoving = Math.abs(player.vx) > 1 || Math.abs(player.vy) > 1;
    const isRunning = actions.has("boost");

    if (actions.has("fire")) {
      ctx.fillStyle = "#00ff88";
      ctx.shadowBlur = 6;
      ctx.shadowColor = "#00ff88";
      ctx.beginPath();
      ctx.arc(size * 0.7, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    if (isMoving) {
      const time = Date.now() * 0.01;
      const legOffset = Math.sin(time) * 3;
      ctx.strokeStyle = isRunning ? "#FF6B6B" : "#4ECDC4";
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(-size * 0.2, size * 0.3);
      ctx.lineTo(-size * 0.2 + legOffset, size * 0.5);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-size * 0.2, -size * 0.3);
      ctx.lineTo(-size * 0.2 - legOffset, -size * 0.5);
      ctx.stroke();

      if (isRunning) {
        ctx.strokeStyle = "#FFD93D";
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.7;
        for (let i = 0; i < 3; i++) {
          const offset = (i + 1) * 6;
          ctx.beginPath();
          ctx.moveTo(-size * 0.6 - offset, -2 + i * 1);
          ctx.lineTo(-size * 0.6 - offset + 4, -2 + i * 1);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    }

    ctx.restore();
  }
}
import type { Kinematics2D } from "../../shared/types/geometry";
import type { Action } from "../../engine/input/ActionTypes";
import { drawCharacter } from "./sprites";
