import type { Action } from "../../../application/input/ActionTypes";
import type { System, World } from "../../../lib/ecs";
import { defineSystem } from "../../../lib/ecs";
import {
  Player,
  PlayerModifiers,
  Position,
  Rotation,
  Velocity,
  WeaponCooldown,
} from "../components";

export function createPlayerControlSystem(
  world: World,
  actions: Set<Action>,
  dt: number,
  mode: "space" | "planet" = "space",
  options?: {
    // Multipliers applied in space mode (used for on-planet ship boost)
    spaceAccelMult?: number;
    spaceMaxSpeedMult?: number;
    spaceTurnMult?: number;
    spaceDragOverride?: number; // optional override for drag factor in space mode
  },
): System {
  const BASE_ACCELERATION = 240; // snappier acceleration
  const BASE_MAX_SPEED = 300; // doubled max speed in space
  const BASE_TURN_SPEED = 3;
  const WALK_SPEED = 200;
  const RUN_SPEED = 350;
  const FRICTION = 0.85;

  return defineSystem(world)
    .withComponents({ position: Position, velocity: Velocity, rotation: Rotation, player: Player })
    .withOptionalComponents({ weaponCooldown: WeaponCooldown, mods: PlayerModifiers })
    .execute((entities): void => {
      entities.forEach(({ components }) => {
        const { velocity, rotation, weaponCooldown, mods } = components;

        if (mode === "planet") {
          // Top-down walking controls
          let moveX = 0;
          let moveY = 0;
          const base = actions.has("boost") ? RUN_SPEED : WALK_SPEED;
          const speed = base * (mods?.walkSpeedMult ?? 1);

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
            const friction = FRICTION * (mods?.frictionMult ?? 1);
            velocity.dx *= friction;
            velocity.dy *= friction;
          }
        } else {
          // Space (ship) controls
          // Apply drag first so sustained thrust can reach MAX_SPEED (clamp happens after thrust)
          const baseDrag = 0.985; // gentler default drag in space
          const normalDrag = Math.max(0.9, Math.min(0.999, baseDrag - (mods?.dragReduction ?? 0)));
          const drag = options?.spaceDragOverride ?? normalDrag;
          velocity.dx *= drag;
          velocity.dy *= drag;

          if (actions.has("turnLeft")) {
            const turnBoost = options?.spaceTurnMult ?? 1;
            const turn = BASE_TURN_SPEED * turnBoost * (mods?.turnSpeedMult ?? 1);
            rotation.angle -= turn * dt;
          }
          if (actions.has("turnRight")) {
            const turnBoost = options?.spaceTurnMult ?? 1;
            const turn = BASE_TURN_SPEED * turnBoost * (mods?.turnSpeedMult ?? 1);
            rotation.angle += turn * dt;
          }

          if (actions.has("thrust")) {
            const boost = actions.has("boost") ? 1.75 : 1;
            const accelBoost = options?.spaceAccelMult ?? 1;
            const maxBoost = options?.spaceMaxSpeedMult ?? 1;
            const ACCELERATION = BASE_ACCELERATION * boost * accelBoost * (mods?.accelMult ?? 1);
            const MAX_SPEED = BASE_MAX_SPEED * boost * maxBoost * (mods?.maxSpeedMult ?? 1);
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

          // Drag already applied at start of space update
        }

        // Update weapon cooldown
        if (weaponCooldown && weaponCooldown.remaining > 0) {
          weaponCooldown.remaining -= dt;
        }
      });
    });
}
