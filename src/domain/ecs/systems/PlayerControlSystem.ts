import type { Action } from "../../../engine/input/ActionTypes";
import type { System, World } from "../../../lib/ecs";
import { defineSystem } from "../../../lib/ecs";
import { Player, Position, Rotation, Velocity, WeaponCooldown } from "../components";

export function createPlayerControlSystem(world: World, actions: Set<Action>, dt: number): System {
  const ACCELERATION = 200;
  const MAX_SPEED = 150;
  const TURN_SPEED = 3;

  return defineSystem(world)
    .withComponents({ position: Position, velocity: Velocity, rotation: Rotation, player: Player })
    .withOptionalComponents({ weaponCooldown: WeaponCooldown })
    .execute((entities): void => {
      entities.forEach(({ components }) => {
        const { velocity, rotation, weaponCooldown } = components;

        // Handle rotation (use action names, not key codes)
        if (actions.has("turnLeft")) {
          rotation.angle -= TURN_SPEED * dt;
        }
        if (actions.has("turnRight")) {
          rotation.angle += TURN_SPEED * dt;
        }

        // Handle thrust
        if (actions.has("thrust")) {
          const thrustX = Math.cos(rotation.angle) * ACCELERATION * dt;
          const thrustY = Math.sin(rotation.angle) * ACCELERATION * dt;

          velocity.dx += thrustX;
          velocity.dy += thrustY;

          // Limit max speed
          const speed = Math.sqrt(velocity.dx * velocity.dx + velocity.dy * velocity.dy);
          if (speed > MAX_SPEED) {
            velocity.dx = (velocity.dx / speed) * MAX_SPEED;
            velocity.dy = (velocity.dy / speed) * MAX_SPEED;
          }
        }

        // Apply drag
        const DRAG = 0.98;
        velocity.dx *= DRAG;
        velocity.dy *= DRAG;

        // Update weapon cooldown
        if (weaponCooldown && weaponCooldown.remaining > 0) {
          weaponCooldown.remaining -= dt;
        }
      });
    });
}
