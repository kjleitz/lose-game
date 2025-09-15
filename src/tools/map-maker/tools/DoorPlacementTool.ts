import type { Point2D } from "../../../shared/types/geometry";
import type { Wall, Door } from "../../../domain/game/ship-interior/types";
import type { ShipInteriorProject } from "../types/MapProject";
import { distanceToLineSegment } from "../utils/geom";
import { createId } from "../utils/id";

export interface DoorPlacementResult {
  door: Door;
  placedOnWall: Wall;
}

export class DoorPlacementTool {
  public placeDoorNearWalls(
    point: Point2D,
    project: ShipInteriorProject,
  ): DoorPlacementResult | null {
    const nearestWall = this.findNearestWall(point, project.walls);
    if (!nearestWall) return null;

    const doorPosition = this.calculateDoorPosition(point, nearestWall);
    const door = this.createDoor(doorPosition, nearestWall);

    return {
      door,
      placedOnWall: nearestWall,
    };
  }

  public canPlaceDoorAtPosition(point: Point2D, project: ShipInteriorProject): boolean {
    const nearestWall = this.findNearestWall(point, project.walls);
    if (!nearestWall) return false;

    // Check if there's already a door too close to this position
    const minDoorDistance = 32; // Minimum distance between doors
    for (const existingDoor of project.doors) {
      const distance = Math.sqrt(
        (point.x - existingDoor.x) * (point.x - existingDoor.x) +
          (point.y - existingDoor.y) * (point.y - existingDoor.y),
      );
      if (distance < minDoorDistance) {
        return false;
      }
    }

    return true;
  }

  private findNearestWall(point: Point2D, walls: Wall[]): Wall | null {
    let nearestWall: Wall | null = null;
    let minDistance = Infinity;
    const maxPlacementDistance = 24; // Maximum distance to place door from wall

    for (const wall of walls) {
      const distance = distanceToLineSegment(
        point,
        { x: wall.x1, y: wall.y1 },
        { x: wall.x2, y: wall.y2 },
      );

      if (distance < minDistance && distance <= maxPlacementDistance) {
        minDistance = distance;
        nearestWall = wall;
      }
    }

    return nearestWall;
  }

  private calculateDoorPosition(point: Point2D, wall: Wall): Point2D {
    // Project the point onto the wall to find the closest position
    const wallVector = { x: wall.x2 - wall.x1, y: wall.y2 - wall.y1 };
    const wallLength = Math.sqrt(wallVector.x * wallVector.x + wallVector.y * wallVector.y);

    if (wallLength === 0) {
      return { x: wall.x1, y: wall.y1 };
    }

    // Normalize wall vector
    const normalizedWall = {
      x: wallVector.x / wallLength,
      y: wallVector.y / wallLength,
    };

    // Vector from wall start to point
    const pointVector = { x: point.x - wall.x1, y: point.y - wall.y1 };

    // Project point onto wall
    const projection = pointVector.x * normalizedWall.x + pointVector.y * normalizedWall.y;

    // Clamp projection to wall bounds
    const clampedProjection = Math.max(0, Math.min(wallLength, projection));

    return {
      x: wall.x1 + normalizedWall.x * clampedProjection,
      y: wall.y1 + normalizedWall.y * clampedProjection,
    };
  }

  private createDoor(position: Point2D, wall: Wall): Door {
    const wallVector = { x: wall.x2 - wall.x1, y: wall.y2 - wall.y1 };
    const isVertical = Math.abs(wallVector.y) > Math.abs(wallVector.x);

    return {
      id: createId("door"),
      x: position.x,
      y: position.y,
      width: 32,
      height: 8,
      orientation: isVertical ? "vertical" : "horizontal",
      isOpen: false,
      connectsRooms: ["", ""], // Will be filled by room detection
      type: "sliding",
    };
  }
}
