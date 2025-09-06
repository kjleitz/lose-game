import type { Action } from "../../application/input/ActionTypes";
import type { Kinematics2D } from "../../shared/types/geometry";
import { drawShipTriangle, drawThruster, drawAuxThruster } from "./sprites";

export class ShipRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    player: Kinematics2D,
    actions: Set<Action>,
    size: number = 48,
    perks?: Record<string, number>,
  ): void {
    const thrusting = actions.has("thrust");
    if (thrusting) {
      const boostingMain = actions.has("boost");
      const speed = Math.hypot(player.vx, player.vy);
      const power = Math.min(1, 0.3 + speed / 300);
      // When boosting, make the main thruster flame appear larger for feedback
      const flameMult = boostingMain ? 2 : 1;
      // Pass ship size for alignment; scale handled via flameMult
      drawThruster(ctx, player.x, player.y, player.angle, size, power, flameMult);
    }

    // Draw the ship above the main rear thruster
    drawShipTriangle(ctx, player.x, player.y, player.angle, size);

    // Aux thrusters (blue) for strafing + reverse perks — draw on top of ship
    const hasStrafe = (perks?.["thrusters.strafing-thrusters"] ?? 0) > 0;
    const hasReverse = (perks?.["thrusters.reverse-thrusters"] ?? 0) > 0;
    const powerAux = 1;

    if (hasStrafe && actions.has("boost") && actions.has("turnLeft") && !actions.has("turnRight")) {
      // Strafe left => fire right-side thruster outward (angle + 90deg)
      drawAuxThruster(
        ctx,
        player.x,
        player.y,
        player.angle + Math.PI / 2,
        size,
        powerAux,
        "#69aaff",
        "right",
      );
    }
    if (hasStrafe && actions.has("boost") && actions.has("turnRight") && !actions.has("turnLeft")) {
      // Strafe right => fire left-side thruster outward (angle - 90deg)
      drawAuxThruster(
        ctx,
        player.x,
        player.y,
        player.angle - Math.PI / 2,
        size,
        powerAux,
        "#69aaff",
        "left",
      );
    }
    if (hasReverse && actions.has("moveDown")) {
      // Reverse => fire front thruster forward
      drawAuxThruster(ctx, player.x, player.y, player.angle, size, powerAux, "#69aaff", "front");
    }
  }
}
