import { drawShipTriangle, drawThruster } from "./sprites";

export class ShipRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    player: { x: number; y: number; vx: number; vy: number; angle: number },
    actions: Set<string>,
    size: number = 48,
  ) {
    const thrusting = actions.has("thrust");
    if (thrusting) {
      const speed = Math.hypot(player.vx, player.vy);
      const power = Math.min(1, 0.3 + speed / 300);
      drawThruster(ctx, player.x, player.y, player.angle, size, power);
    }
    drawShipTriangle(ctx, player.x, player.y, player.angle, size);
  }
}
