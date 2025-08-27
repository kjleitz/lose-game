import type { Node } from "../bt";
import { Action, Condition } from "../bt";
// Types are provided via Blackboard; no direct imports needed here.
import type { Point2D } from "../../../shared/types/geometry";
import type { EnemyBlackboard } from "./EnemyBlackboard";

// Helper functions
function angleTo(from: Point2D, to: Point2D): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

function wrapAngle(angle: number): number {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

function turnTowards(
  currentAngle: number,
  targetAngle: number,
  turnSpeed: number,
  dt: number,
): number {
  const diff = wrapAngle(targetAngle - currentAngle);
  const maxTurn = turnSpeed * dt;

  if (Math.abs(diff) <= maxTurn) {
    return targetAngle;
  }

  return currentAngle + Math.sign(diff) * maxTurn;
}

function distance(a: Point2D, b: Point2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Conditions
export function isAlive(): Node<EnemyBlackboard> {
  return Condition<EnemyBlackboard>("isAlive", (bb) => {
    const enemy = bb.enemy;
    return !!enemy && enemy.health > 0;
  });
}

export function playerDetected(): Node<EnemyBlackboard> {
  return Condition<EnemyBlackboard>("playerDetected", (bb) => {
    const enemy = bb.enemy;
    const player = bb.player;
    if (!enemy || !player) return false;

    const dist = distance(enemy, player.state);
    const inVision = dist <= enemy.visionRadius;
    const exitThreshold = enemy.visionRadius + enemy.visionHysteresis;

    // Get previous detection state
    const wasDetected = bb.scratch.playerDetected === true;

    let detected: boolean;
    if (wasDetected) {
      // Use hysteresis: only exit when beyond vision + hysteresis
      detected = dist <= exitThreshold;
    } else {
      // Enter detection when within vision radius
      detected = inVision;
    }

    // Store state for next frame
    bb.scratch.playerDetected = detected;

    return detected;
  });
}

export function arrivedAtWaypoint(): Node<EnemyBlackboard> {
  return Condition<EnemyBlackboard>("arrivedAtWaypoint", (bb) => {
    const enemy = bb.enemy;
    const waypoint = bb.scratch.waypoint;
    if (!enemy || !waypoint) return false;

    const tolerance = 50;
    const dist = distance(enemy, waypoint);
    return dist <= tolerance;
  });
}

// Actions
export function ensureWaypoint(): Node<EnemyBlackboard> {
  return Action<EnemyBlackboard>("ensureWaypoint", (bb) => {
    const enemy = bb.enemy;
    if (!enemy) return "Failure";

    if (!bb.scratch.waypoint || bb.scratch.waypointReached) {
      // Generate new waypoint in a ring around spawn position
      const spawnX = bb.scratch.spawnX ?? enemy.x;
      const spawnY = bb.scratch.spawnY ?? enemy.y;

      // Store spawn if not already stored
      if (Number.isNaN(bb.scratch.spawnX) || Number.isNaN(bb.scratch.spawnY)) {
        bb.scratch.spawnX = enemy.x;
        bb.scratch.spawnY = enemy.y;
      }

      const rng = typeof bb.rng === "function" ? bb.rng : Math.random;
      const angle = rng() * 2 * Math.PI;
      const radius = 200 + rng() * 300; // Ring between 200-500 units from spawn

      bb.scratch.waypoint = {
        x: spawnX + Math.cos(angle) * radius,
        y: spawnY + Math.sin(angle) * radius,
      };
      bb.scratch.waypointReached = false;
    }

    return "Success";
  });
}

export function faceTarget(targetKey: string): Node<EnemyBlackboard> {
  return Action<EnemyBlackboard>(`faceTarget:${targetKey}`, (bb, dt) => {
    const enemy = bb.enemy;
    if (!enemy) return "Failure";
    let target: Point2D | null = null;

    if (targetKey === "player") {
      if (!bb.player) return "Failure";
      target = bb.player.state;
    } else if (targetKey === "waypoint") {
      target = bb.scratch.waypoint ?? null;
      if (!target) return "Failure";
    } else {
      return "Failure";
    }

    const targetAngle = angleTo(enemy, target);
    const newAngle = turnTowards(enemy.angle, targetAngle, enemy.turnSpeed, dt);

    enemy.angle = newAngle;

    // Return Success when close enough to target angle (more tolerant)
    const angleDiff = Math.abs(wrapAngle(targetAngle - newAngle));
    return angleDiff < 0.2 ? "Success" : "Running"; // Increased tolerance
  });
}

export function thrustForward(): Node<EnemyBlackboard> {
  return Action<EnemyBlackboard>("thrustForward", (bb, dt) => {
    const enemy = bb.enemy;
    if (!enemy) return "Failure";

    // Apply thrust in current facing direction
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

    return "Success";
  });
}

export function moveToPosition(): Node<EnemyBlackboard> {
  return Action<EnemyBlackboard>("moveToPosition", (bb, dt) => {
    const enemy = bb.enemy;
    if (!enemy) return "Failure";

    // Apply velocity to position
    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;

    // Apply drag
    const DRAG = 0.98;
    enemy.vx *= Math.pow(DRAG, dt * 60); // Frame-rate independent drag
    enemy.vy *= Math.pow(DRAG, dt * 60);

    return "Success";
  });
}

export function checkWaypointArrival(): Node<EnemyBlackboard> {
  return Action<EnemyBlackboard>("checkWaypointArrival", (bb) => {
    const enemy = bb.enemy;
    const waypoint = bb.scratch.waypoint;
    if (!enemy) return "Failure";

    if (!waypoint) return "Failure";

    const tolerance = 50;
    const dist = distance(enemy, waypoint);

    if (dist <= tolerance) {
      bb.scratch.waypointReached = true;
      return "Success";
    }

    return "Failure";
  });
}

export function doNothing(): Node<EnemyBlackboard> {
  return Action<EnemyBlackboard>("doNothing", () => "Success");
}
