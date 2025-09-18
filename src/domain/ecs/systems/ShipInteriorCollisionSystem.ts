import type { System, World } from "../../../lib/ecs";
import { defineSystem } from "../../../lib/ecs";
import { Collider, Player, Position } from "../components";
import type { ShipInterior, Wall, Door } from "../../game/ship-interior/types";

/**
 * Collision system for ship interior walls and boundaries
 */
export function createShipInteriorCollisionSystem(
  world: World,
  getShipInterior: () => ShipInterior | undefined,
  playerRadiusOverride?: number,
): System {
  return defineSystem(world)
    .withComponents({ position: Position, collider: Collider, player: Player })
    .execute((players): void => {
      const shipInterior = getShipInterior();
      if (!shipInterior) return;
      if (players.length === 0) return;

      const player = players[0];
      const { position, collider } = player.components;
      const playerRadius = playerRadiusOverride ?? collider.radius ?? 16;

      // Check collision with walls
      for (const wall of shipInterior.walls) {
        handleWallCollision(position, wall, playerRadius, shipInterior.doors);
      }

      // Check collision with closed doors
      for (const door of shipInterior.doors) {
        if (!door.isOpen) {
          handleDoorCollision(position, door, playerRadius);
        }
      }
    });
}

/**
 * Handle collision between a circular player and a wall (line segment)
 */
function handleWallCollision(
  position: { x: number; y: number },
  wall: Wall,
  playerRadius: number,
  doors: Door[],
): void {
  // Get wall as line segment
  const wx1 = wall.x1;
  const wy1 = wall.y1;
  const wx2 = wall.x2;
  const wy2 = wall.y2;

  // Calculate line direction and length
  const wallDx = wx2 - wx1;
  const wallDy = wy2 - wy1;
  const wallLength = Math.hypot(wallDx, wallDy);

  if (wallLength === 0) return; // Degenerate wall

  // Normalize wall direction
  const wallUnitX = wallDx / wallLength;
  const wallUnitY = wallDy / wallLength;

  // Vector from wall start to player
  const toPlayerX = position.x - wx1;
  const toPlayerY = position.y - wy1;

  // Project player position onto wall line
  const rawProjection = toPlayerX * wallUnitX + toPlayerY * wallUnitY;
  const projectionLength = Math.max(0, Math.min(wallLength, rawProjection));

  // Closest point on wall to player
  const closestX = wx1 + projectionLength * wallUnitX;
  const closestY = wy1 + projectionLength * wallUnitY;

  // Distance from player to closest point on wall
  const distX = position.x - closestX;
  const distY = position.y - closestY;
  const distance = Math.hypot(distX, distY);

  // Skip collision if door opening overlaps this section of wall
  if (
    doors.some((door) =>
      intersectsDoorOpening(door, wall, {
        wallLength,
        wallUnitX,
        wallUnitY,
        playerProjection: projectionLength,
        playerRadius,
        doorOpen: door.isOpen,
      }),
    )
  ) {
    return;
  }

  // Check if collision occurs (considering wall thickness)
  const wallRadius = wall.thickness / 2;
  const totalRadius = playerRadius + wallRadius;

  if (distance < totalRadius && distance > 0) {
    // Calculate push-back direction
    const pushX = distX / distance;
    const pushY = distY / distance;

    // Push player away from wall
    const overlap = totalRadius - distance;
    position.x += pushX * overlap;
    position.y += pushY * overlap;
  }
}

/**
 * Handle collision between a circular player and a closed door (rectangle)
 */
function handleDoorCollision(
  position: { x: number; y: number },
  door: Door,
  playerRadius: number,
): void {
  const cos = Math.cos(door.rotation);
  const sin = Math.sin(door.rotation);
  const dx = position.x - door.x;
  const dy = position.y - door.y;

  // Transform player position into door local coordinates
  const localX = dx * cos + dy * sin;
  const localY = -dx * sin + dy * cos;

  const halfWidth = door.width / 2;
  const halfHeight = door.height / 2;

  // Clamp to door rectangle in local space
  const clampedX = Math.max(-halfWidth, Math.min(localX, halfWidth));
  const clampedY = Math.max(-halfHeight, Math.min(localY, halfHeight));

  const distX = localX - clampedX;
  const distY = localY - clampedY;
  const distance = Math.hypot(distX, distY);

  // Check if collision occurs
  if (distance < playerRadius && distance > 0) {
    // Calculate push-back direction
    const pushX = (distX * cos - distY * sin) / distance;
    const pushY = (distX * sin + distY * cos) / distance;

    // Push player away from door
    const overlap = playerRadius - distance;
    position.x += pushX * overlap;
    position.y += pushY * overlap;
  }
}

function intersectsDoorOpening(
  door: Door,
  wall: Wall,
  context: {
    wallLength: number;
    wallUnitX: number;
    wallUnitY: number;
    playerProjection: number;
    playerRadius: number;
    doorOpen: boolean;
  },
): boolean {
  const { wallLength, wallUnitX, wallUnitY, playerProjection, playerRadius, doorOpen } = context;

  const doorCos = Math.cos(door.rotation);
  const doorSin = Math.sin(door.rotation);
  const doorAlongX = doorCos;
  const doorAlongY = doorSin;
  const doorPerpX = -doorSin;
  const doorPerpY = doorCos;

  const wx1 = wall.x1;
  const wy1 = wall.y1;

  const doorDx = door.x - wx1;
  const doorDy = door.y - wy1;

  const halfAlong =
    Math.abs(doorAlongX * wallUnitX + doorAlongY * wallUnitY) * (door.width / 2) +
    Math.abs(doorPerpX * wallUnitX + doorPerpY * wallUnitY) * (door.height / 2);
  const halfPerp =
    Math.abs(doorAlongX * -wallUnitY + doorAlongY * wallUnitX) * (door.width / 2) +
    Math.abs(doorPerpX * -wallUnitY + doorPerpY * wallUnitX) * (door.height / 2);

  const doorProj = doorDx * wallUnitX + doorDy * wallUnitY;
  if (doorProj < -halfAlong || doorProj > wallLength + halfAlong) {
    return false;
  }

  const doorPerpDistance = Math.abs(-wallUnitY * doorDx + wallUnitX * doorDy);

  if (doorPerpDistance > halfPerp + 1) {
    return false;
  }

  if (!doorOpen) {
    return false;
  }

  const projectionDelta = Math.abs(playerProjection - doorProj);
  return projectionDelta <= halfAlong + playerRadius;
}
