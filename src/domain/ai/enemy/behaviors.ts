import type { Blackboard, Node } from "../bt";
import { Action, Condition } from "../bt";
import type { Enemy } from "../../game/enemies";
import type { Player } from "../../game/player";

// Helper functions
function angleTo(from: { x: number; y: number }, to: { x: number; y: number }): number {
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

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Conditions
export function isAlive(): Node {
  return Condition("isAlive", (bb: Blackboard) => {
    const enemy = bb.enemy as Enemy;
    return enemy.health > 0;
  });
}

export function playerDetected(): Node {
  return Condition("playerDetected", (bb: Blackboard) => {
    const enemy = bb.enemy as Enemy;
    const player = bb.player as Player;

    const dist = distance(enemy, player.state);
    const inVision = dist <= enemy.visionRadius;
    const exitThreshold = enemy.visionRadius + enemy.visionHysteresis;

    // Get previous detection state
    const wasDetected = bb.scratch.playerDetected || false;

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

export function arrivedAtWaypoint(): Node {
  return Condition("arrivedAtWaypoint", (bb: Blackboard) => {
    const enemy = bb.enemy as Enemy;
    const waypoint = bb.scratch.waypoint as { x: number; y: number } | undefined;

    if (!waypoint) return false;

    const tolerance = 50;
    const dist = distance(enemy, waypoint);
    return dist <= tolerance;
  });
}

// Actions
export function ensureWaypoint(): Node {
  return Action("ensureWaypoint", (bb: Blackboard) => {
    const enemy = bb.enemy as Enemy;

    if (!bb.scratch.waypoint || bb.scratch.waypointReached) {
      // Generate new waypoint in a ring around spawn position
      const spawnX = (bb.scratch.spawnX as number | undefined) ?? enemy.x;
      const spawnY = (bb.scratch.spawnY as number | undefined) ?? enemy.y;

      // Store spawn if not already stored
      if (bb.scratch.spawnX === undefined) {
        bb.scratch.spawnX = enemy.x;
        bb.scratch.spawnY = enemy.y;
      }

      const rng = bb.rng as () => number;
      const angle = rng() * 2 * Math.PI;
      const radius = 200 + rng() * 300; // Ring between 200-500 units from spawn

      bb.scratch.waypoint = {
        x: (spawnX as number) + Math.cos(angle) * radius,
        y: (spawnY as number) + Math.sin(angle) * radius,
      };
      bb.scratch.waypointReached = false;
    }

    return "Success";
  });
}

export function faceTarget(targetKey: string): Node {
  return Action(`faceTarget:${targetKey}`, (bb: Blackboard, dt: number) => {
    const enemy = bb.enemy as Enemy;
    let target: { x: number; y: number };

    if (targetKey === "player") {
      target = (bb.player as Player).state;
    } else if (targetKey === "waypoint") {
      target = bb.scratch.waypoint as { x: number; y: number };
      if (!target) return "Failure";
    } else {
      return "Failure";
    }

    const targetAngle = angleTo(enemy, target);
    const newAngle = turnTowards(enemy.angle, targetAngle, enemy.turnSpeed, dt);

    (bb.enemy as Enemy).angle = newAngle;

    // Return Success when close enough to target angle (more tolerant)
    const angleDiff = Math.abs(wrapAngle(targetAngle - newAngle));
    return angleDiff < 0.2 ? "Success" : "Running"; // Increased tolerance
  });
}

export function thrustForward(): Node {
  return Action("thrustForward", (bb: Blackboard, dt: number) => {
    const enemy = bb.enemy as Enemy;

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

export function moveToPosition(): Node {
  return Action("moveToPosition", (bb: Blackboard, dt: number) => {
    const enemy = bb.enemy as Enemy;

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

export function checkWaypointArrival(): Node {
  return Action("checkWaypointArrival", (bb: Blackboard) => {
    const enemy = bb.enemy as Enemy;
    const waypoint = bb.scratch.waypoint as { x: number; y: number } | undefined;

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

export function doNothing(): Node {
  return Action("doNothing", () => "Success");
}
