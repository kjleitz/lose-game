import type { Planet } from "../../domain/game/planets";

type Minimal2DContext = Pick<
  CanvasRenderingContext2D,
  "save" | "restore" | "translate" | "beginPath" | "arc" | "fill" | "stroke" | "ellipse"
> & {
  fillStyle: CanvasRenderingContext2D["fillStyle"];
  strokeStyle: CanvasRenderingContext2D["strokeStyle"];
  lineWidth: CanvasRenderingContext2D["lineWidth"];
  globalAlpha: CanvasRenderingContext2D["globalAlpha"];
};

export interface PlanetCanvasProps {
  planet: Planet;
  ctx: Minimal2DContext;
  x: number;
  y: number;
  r: number;
}

export function drawPlanetCanvas({ planet, ctx, x, y, r }: PlanetCanvasProps): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = planet.color;
  ctx.globalAlpha = 0.85;
  ctx.fill();
  // Design overlays
  if (planet.design === "ringed") {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = r * 0.15;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.2, r * 0.6, Math.PI / 4, 0, Math.PI * 2);
    ctx.stroke();
  } else if (planet.design === "striped") {
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#fff";
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.arc(0, r * (i / 3), r * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (planet.design === "spotted") {
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = "#fff";
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const spotR = r * 0.7;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * spotR, Math.sin(angle) * spotR, r * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}
