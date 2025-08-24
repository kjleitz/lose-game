import { Selector, Sequence, Action } from "../bt";
import type { Node } from "../bt";
import type { Enemy } from "../../game/enemies";
import type { Player } from "../../game/player";
import {
  isAlive,
  playerDetected,
  ensureWaypoint,
  faceTarget,
  thrustForward,
  moveToPosition,
  checkWaypointArrival,
  doNothing,
} from "./behaviors";

export interface EnemyAIConfig {
  // Future: could add per-enemy behavior customization
  [key: string]: unknown;
}

export function buildPatrolSeekTree(): Node {
  // Root: Selector tries seek first, then patrol, then do nothing
  return Selector("root", [
    // Seek behavior: chase player when detected
    Sequence("seek", [
      isAlive(),
      playerDetected(),
      Action("seekMovement", (bb, dt) => {
        // Combined face and move action for seek behavior
        const enemy = bb.enemy as Enemy;
        const player = bb.player as Player;

        // Face the player
        const targetAngle = Math.atan2(player.state.y - enemy.y, player.state.x - enemy.x);
        enemy.angle =
          enemy.angle +
          Math.sign(targetAngle - enemy.angle) *
            Math.min(Math.abs(targetAngle - enemy.angle), enemy.turnSpeed * dt);

        // Thrust forward
        const thrustX = Math.cos(enemy.angle) * enemy.accel * dt;
        const thrustY = Math.sin(enemy.angle) * enemy.accel * dt;
        enemy.vx += thrustX;
        enemy.vy += thrustY;

        // Clamp to max speed
        const speed = Math.hypot(enemy.vx, enemy.vy);
        if (speed > enemy.maxSpeed) {
          const factor = enemy.maxSpeed / speed;
          enemy.vx *= factor;
          enemy.vy *= factor;
        }

        // Apply velocity to position
        enemy.x += enemy.vx * dt;
        enemy.y += enemy.vy * dt;

        // Apply drag
        const DRAG = 0.98;
        enemy.vx *= Math.pow(DRAG, dt * 60);
        enemy.vy *= Math.pow(DRAG, dt * 60);

        return "Success";
      }),
    ]),

    // Patrol behavior: wander via waypoints
    Sequence("patrol", [
      isAlive(),
      ensureWaypoint(),
      faceTarget("waypoint"),
      thrustForward(),
      moveToPosition(),
      checkWaypointArrival(),
    ]),

    // Fallback: do nothing (dead or other state)
    doNothing(),
  ]);
}
