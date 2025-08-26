import { defineSystem } from "../../../lib/ecs/dist";
import type { World } from "../../../lib/ecs/dist";
import { Position, Velocity, Rotation, Player, WeaponCooldown } from "../components";

export function createPlayerControlSystem(world: World, actions: Set<string>, dt: number) {
  const ACCELERATION = 200;
  const MAX_SPEED = 150;
  const TURN_SPEED = 3;

  return defineSystem(world)
    .withComponents({ position: Position, velocity: Velocity, rotation: Rotation, player: Player })
    .withOptionalComponents({ weaponCooldown: WeaponCooldown })
    .execute((entities) => {
      entities.forEach(({ components }) => {
        const { velocity, rotation, weaponCooldown } = components;

        // Handle rotation
        if (actions.has("ArrowLeft") || actions.has("KeyA")) {
          rotation.angle -= TURN_SPEED * dt;
        }
        if (actions.has("ArrowRight") || actions.has("KeyD")) {
          rotation.angle += TURN_SPEED * dt;
        }

        // Handle thrust
        if (actions.has("ArrowUp") || actions.has("KeyW")) {
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
