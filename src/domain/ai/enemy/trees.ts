import { Selector, Sequence, Action } from "../../../lib/behavior-tree";
import type { Node } from "../../../lib/behavior-tree";
import type { EnemyBlackboard } from "./EnemyBlackboard";
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

export function buildPatrolSeekTree(): Node<EnemyBlackboard> {
  // Root: Selector tries seek first, then patrol, then do nothing
  return Selector<EnemyBlackboard>("root", [
    // Seek behavior: chase player when detected
    Sequence<EnemyBlackboard>("seek", [
      isAlive(),
      playerDetected(),
      Action<EnemyBlackboard>("seekMovement", (bb, dt) => {
        // Combined face and move action for seek behavior
        const enemy = bb.enemy;
        const player = bb.player;
        if (!enemy || !player) return "Failure";

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
    Sequence<EnemyBlackboard>("patrol", [
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
