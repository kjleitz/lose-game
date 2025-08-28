import type { Action } from "../../../engine/input/ActionTypes";
import type { System, World } from "../../../lib/ecs";
import { defineSystem } from "../../../lib/ecs";
import { Player, Position, Rotation, Velocity, WeaponCooldown } from "../components";

export function createPlayerControlSystem(
  world: World,
  actions: Set<Action>,
  dt: number,
  mode: "space" | "planet" = "space",
): System {
  const BASE_ACCELERATION = 200;
  const BASE_MAX_SPEED = 150;
  const TURN_SPEED = 3;
  const WALK_SPEED = 200;
  const RUN_SPEED = 350;
  const FRICTION = 0.85;

  return defineSystem(world)
    .withComponents({ position: Position, velocity: Velocity, rotation: Rotation, player: Player })
    .withOptionalComponents({ weaponCooldown: WeaponCooldown })
    .execute((entities): void => {
      entities.forEach(({ components }) => {
        const { velocity, rotation, weaponCooldown } = components;

        if (mode === "planet") {
          // Top-down walking controls
          let moveX = 0;
          let moveY = 0;
          const speed = actions.has("boost") ? RUN_SPEED : WALK_SPEED;

          if (actions.has("thrust")) moveY -= 1; // up
          if (actions.has("turnLeft")) moveX -= 1; // left
          if (actions.has("turnRight")) moveX += 1; // right
          if (actions.has("moveDown")) moveY += 1; // down

          if (moveX !== 0 || moveY !== 0) {
            const len = Math.hypot(moveX, moveY);
            moveX /= len;
            moveY /= len;
            velocity.dx = moveX * speed;
            velocity.dy = moveY * speed;
            rotation.angle = Math.atan2(moveY, moveX);
          } else {
            // No input: gradually stop
            velocity.dx *= FRICTION;
            velocity.dy *= FRICTION;
          }
        } else {
          // Space (ship) controls
          if (actions.has("turnLeft")) {
            rotation.angle -= TURN_SPEED * dt;
          }
          if (actions.has("turnRight")) {
            rotation.angle += TURN_SPEED * dt;
          }

          if (actions.has("thrust")) {
            const boost = actions.has("boost") ? 1.75 : 1;
            const ACCELERATION = BASE_ACCELERATION * boost;
            const MAX_SPEED = BASE_MAX_SPEED * boost;
            const thrustX = Math.cos(rotation.angle) * ACCELERATION * dt;
            const thrustY = Math.sin(rotation.angle) * ACCELERATION * dt;

            velocity.dx += thrustX;
            velocity.dy += thrustY;

            const speed = Math.hypot(velocity.dx, velocity.dy);
            if (speed > MAX_SPEED) {
              velocity.dx = (velocity.dx / speed) * MAX_SPEED;
              velocity.dy = (velocity.dy / speed) * MAX_SPEED;
            }
          }

          // Apply drag
          const DRAG = 0.98;
          velocity.dx *= DRAG;
          velocity.dy *= DRAG;
        }

        // Update weapon cooldown
        if (weaponCooldown && weaponCooldown.remaining > 0) {
          weaponCooldown.remaining -= dt;
        }
      });
    });
}
