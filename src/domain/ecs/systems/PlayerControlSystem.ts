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
  Perks,
  CursorTarget,
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
  const BASE_TURN_SPEED = 3;
  const WALK_SPEED = 200;
  const RUN_SPEED = 350;
  const FRICTION = 0.85;

  return defineSystem(world)
    .withComponents({ position: Position, velocity: Velocity, rotation: Rotation, player: Player })
    .withOptionalComponents({
      weaponCooldown: WeaponCooldown,
      mods: PlayerModifiers,
      perks: Perks,
      cursor: CursorTarget,
    })
    .execute((entities): void => {
      entities.forEach(({ components }) => {
        const { position, velocity, rotation, weaponCooldown, mods } = components;

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
            // If separate-aim perk is NOT enabled, face movement direction.
            const cursorAimEnabled =
              (components.perks?.unlocked["combat.cursor-aim-planet"] ?? 0) > 0;
            if (!cursorAimEnabled) {
              rotation.angle = Math.atan2(moveY, moveX);
            }
          } else {
            // No input: gradually stop
            const friction = FRICTION * (mods?.frictionMult ?? 1);
            velocity.dx *= friction;
            velocity.dy *= friction;
          }

          // If separate-aim perk is enabled, aim at cursor when available
          const cursorAimEnabled =
            (components.perks?.unlocked["combat.cursor-aim-planet"] ?? 0) > 0;
          const target = components.cursor;
          if (cursorAimEnabled && target) {
            const aimDx = target.x - position.x;
            const aimDy = target.y - position.y;
            if (Number.isFinite(aimDx) && Number.isFinite(aimDy)) {
              rotation.angle = Math.atan2(aimDy, aimDx);
            }
          }
        } else {
          // Space (ship) controls
          // Apply drag first for smoother damping and momentum preservation
          const baseDrag = 0.985; // gentler default drag in space
          const normalDrag = Math.max(0.9, Math.min(0.999, baseDrag - (mods?.dragReduction ?? 0)));
          const drag = options?.spaceDragOverride ?? normalDrag;
          velocity.dx *= drag;
          velocity.dy *= drag;

          // Perk gates
          const hasStrafe = (components.perks?.unlocked["thrusters.strafing-thrusters"] ?? 0) > 0;
          const hasReverse = (components.perks?.unlocked["thrusters.reverse-thrusters"] ?? 0) > 0;

          // Compute accelerations
          // - Forward thrust is affected by boost
          // - Aux thrusters (reverse + strafe) should NOT be boosted
          const boostMult = actions.has("boost") ? 2 : 1; // boost doubles forward accel
          const accelBoost = options?.spaceAccelMult ?? 1;
          const baseAccel = BASE_ACCELERATION * accelBoost * (mods?.accelMult ?? 1);
          const ACCEL_FORWARD = baseAccel * boostMult;
          const ACCEL_AUX = baseAccel;

          // Turning vs strafing logic
          const strafingLeft = hasStrafe && actions.has("boost") && actions.has("turnLeft");
          const strafingRight = hasStrafe && actions.has("boost") && actions.has("turnRight");

          if (!strafingLeft && actions.has("turnLeft")) {
            const turnBoost = options?.spaceTurnMult ?? 1;
            const turn = BASE_TURN_SPEED * turnBoost * (mods?.turnSpeedMult ?? 1);
            rotation.angle -= turn * dt;
          }
          if (!strafingRight && actions.has("turnRight")) {
            const turnBoost = options?.spaceTurnMult ?? 1;
            const turn = BASE_TURN_SPEED * turnBoost * (mods?.turnSpeedMult ?? 1);
            rotation.angle += turn * dt;
          }

          // Forward thrust
          if (actions.has("thrust")) {
            const thrustX = Math.cos(rotation.angle) * ACCEL_FORWARD * dt;
            const thrustY = Math.sin(rotation.angle) * ACCEL_FORWARD * dt;
            velocity.dx += thrustX;
            velocity.dy += thrustY;
          }

          // Reverse thrusters mapped to moveDown when unlocked
          if (hasReverse && actions.has("moveDown")) {
            const thrustX = -Math.cos(rotation.angle) * ACCEL_AUX * dt;
            const thrustY = -Math.sin(rotation.angle) * ACCEL_AUX * dt;
            velocity.dx += thrustX;
            velocity.dy += thrustY;
          }

          // Strafing applies lateral acceleration while not rotating
          if (strafingLeft) {
            // left-of-ship vector when Y grows downward: (sin(a), -cos(a))
            const sx = Math.sin(rotation.angle) * ACCEL_AUX * dt;
            const sy = -Math.cos(rotation.angle) * ACCEL_AUX * dt;
            velocity.dx += sx;
            velocity.dy += sy;
          }
          if (strafingRight) {
            // right-of-ship vector when Y grows downward: (-sin(a), cos(a))
            const sx = -Math.sin(rotation.angle) * ACCEL_AUX * dt;
            const sy = Math.cos(rotation.angle) * ACCEL_AUX * dt;
            velocity.dx += sx;
            velocity.dy += sy;
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
