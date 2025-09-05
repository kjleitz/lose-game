export interface StarView {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
}

export class StarRenderer {
  render(ctx: CanvasRenderingContext2D, stars: StarView[]): void {
    for (const star of stars) {
      this.drawStar(ctx, star);
    }
  }

  private drawStar(ctx: CanvasRenderingContext2D, star: StarView): void {
    const radius = star.radius;
    // Radial glow
    const grad = ctx.createRadialGradient(
      star.x,
      star.y,
      radius * 0.1,
      star.x,
      star.y,
      radius * 1.6,
    );
    grad.addColorStop(0, this.withAlpha(star.color, 1.0));
    grad.addColorStop(0.4, this.withAlpha(star.color, 0.6));
    grad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(star.x, star.y, radius * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.fillStyle = this.withAlpha("#ffffff", 0.95);
    ctx.beginPath();
    ctx.arc(star.x, star.y, radius * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  private withAlpha(hexOrCss: string, alpha: number): string {
    // Assume already rgba or css color → just return blended alpha via rgba fallback
    if (hexOrCss.startsWith("rgba") || hexOrCss.startsWith("hsla")) return hexOrCss;
    if (hexOrCss.startsWith("hsl")) {
      return hexOrCss.replace(
        /^hsl\(([^)]+)\)$/,
        (_m, inner) => `hsla(${String(inner)}, ${String(alpha)})`,
      );
    }
    // crude hex blending: fallback to white tint with requested alpha if not hex
    return `rgba(255, 255, 255, ${alpha})`;
  }
}
