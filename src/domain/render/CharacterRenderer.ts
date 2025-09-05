import type { Action } from "../../application/input/ActionTypes";
import type { Kinematics2D } from "../../shared/types/geometry";
import { drawCharacter } from "./sprites";
// Pre-resolve running frame asset URLs (hashed by Vite at build time)
// Only for the "classic" theme; other themes fall back to base sprite.
import classic1Url from "/src/assets/sprites/character/classic-1.svg?url";
import classic2Url from "/src/assets/sprites/character/classic-2.svg?url";
import classic3Url from "/src/assets/sprites/character/classic-3.svg?url";
import classic4Url from "/src/assets/sprites/character/classic-4.svg?url";

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

// Lightweight cache for character animation frames
interface FrameRecord {
  img: HTMLImageElement;
  loaded: boolean;
}
const characterFrames: Map<string, FrameRecord> = new Map();

function getCharacterFrame(variant: string): HTMLImageElement | null {
  const key = `character:${variant}`;
  const existing = characterFrames.get(key);
  if (existing) return existing.img;
  let url: string | null = null;
  if (variant === "classic-1") url = classic1Url;
  else if (variant === "classic-2") url = classic2Url;
  else if (variant === "classic-3") url = classic3Url;
  else if (variant === "classic-4") url = classic4Url;
  else url = null;
  if (!url) return null;
  const img = new window.Image();
  const record: FrameRecord = { img, loaded: false };
  img.onload = (): void => {
    record.loaded = true;
  };
  img.src = url;
  characterFrames.set(key, record);
  return img;
}

export class CharacterRenderer {
  render(ctx: CtxLike, player: Kinematics2D, actions: Set<Action>, size = 24): void {
    // Grounded shadow beneath the character (planet-side look)
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    const shadowW = size * 0.5;
    const shadowH = size * 0.18;
    const shadowX = player.x;
    const shadowY = player.y + size * 0.5;
    ctx.ellipse(shadowX, shadowY, shadowW, shadowH, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Sprite as the primary visual (drawn after shadow)
    // 4-frame running animation with speed-based cadence.
    const speed = Math.hypot(player.vx, player.vy);
    const running = speed > 0.6 || actions.has("boost");

    if (running) {
      // Speed-normalized fps (8..14), small spatial desync seed
      const timeSec = Date.now() * 0.001;
      const speedFactor = Math.max(0, Math.min(1, speed / 3));
      const fps = 8 + 6 * speedFactor + (actions.has("boost") ? 2 : 0);
      const seed = (player.x + player.y) * 0.01;
      const frameCount = 4;
      const index0 = Math.floor((timeSec + seed) * fps) % frameCount; // 0..3
      const variant = `classic-${index0 + 1}`;
      const frame = getCharacterFrame(variant);
      if (frame) {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.angle);
        ctx.drawImage(frame, -size / 2, -size / 2, size, size);
        ctx.restore();
      } else {
        drawCharacter(ctx, player.x, player.y, player.angle, size);
      }
    } else {
      drawCharacter(ctx, player.x, player.y, player.angle, size);
    }

    // Overlay simple FX (firing flash, speed lines)
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

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

    // Remove wagging leg lines; keep speed lines only when running
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

    ctx.restore();
  }
}
