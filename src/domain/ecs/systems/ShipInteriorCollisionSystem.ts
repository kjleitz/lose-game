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
        handleWallCollision(position, wall, playerRadius);
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
  const projectionLength = Math.max(
    0,
    Math.min(wallLength, toPlayerX * wallUnitX + toPlayerY * wallUnitY),
  );

  // Closest point on wall to player
  const closestX = wx1 + projectionLength * wallUnitX;
  const closestY = wy1 + projectionLength * wallUnitY;

  // Distance from player to closest point on wall
  const distX = position.x - closestX;
  const distY = position.y - closestY;
  const distance = Math.hypot(distX, distY);

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
  // Treat door as a rectangle
  const doorLeft = door.x - door.width / 2;
  const doorRight = door.x + door.width / 2;
  const doorTop = door.y - door.height / 2;
  const doorBottom = door.y + door.height / 2;

  // Find closest point on the rectangle to the circle center
  const closestX = Math.max(doorLeft, Math.min(position.x, doorRight));
  const closestY = Math.max(doorTop, Math.min(position.y, doorBottom));

  // Distance from player center to closest point on door rectangle
  const distX = position.x - closestX;
  const distY = position.y - closestY;
  const distance = Math.hypot(distX, distY);

  // Check if collision occurs
  if (distance < playerRadius && distance > 0) {
    // Calculate push-back direction
    const pushX = distX / distance;
    const pushY = distY / distance;

    // Push player away from door
    const overlap = playerRadius - distance;
    position.x += pushX * overlap;
    position.y += pushY * overlap;
  }
}
