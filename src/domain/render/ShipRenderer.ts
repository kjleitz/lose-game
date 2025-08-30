import type { Action } from "../../application/input/ActionTypes";
import type { Kinematics2D } from "../../shared/types/geometry";
import { drawShipTriangle, drawThruster } from "./sprites";

export class ShipRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    player: Kinematics2D,
    actions: Set<Action>,
    size: number = 48,
  ): void {
    const thrusting = actions.has("thrust");
    if (thrusting) {
      const speed = Math.hypot(player.vx, player.vy);
      const power = Math.min(1, 0.3 + speed / 300);
      drawThruster(ctx, player.x, player.y, player.angle, size, power);
    }
    drawShipTriangle(ctx, player.x, player.y, player.angle, size);
  }
}
