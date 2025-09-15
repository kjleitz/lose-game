import type { Point2D } from "../../../shared/types/geometry";
import type { Wall, Door } from "../../../domain/game/ship-interior/types";
import type { ShipInteriorProject } from "../types/MapProject";
import {
  boundsIntersect,
  distanceToLineSegment,
  isPointInBounds,
  isPointInCircle,
} from "../utils/geom";

export interface SelectableFeature {
  id: string;
  type: "wall" | "door" | "station";
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export class SelectionTool {
  public findFeatureAtPoint(
    point: Point2D,
    project: ShipInteriorProject,
  ): SelectableFeature | null {
    // Check stations first (they have interaction radius)
    for (const station of project.stations) {
      if (isPointInCircle(point, { x: station.x, y: station.y }, station.radius)) {
        return {
          id: station.id,
          type: "station",
          bounds: {
            x: station.x - station.radius,
            y: station.y - station.radius,
            width: station.radius * 2,
            height: station.radius * 2,
          },
        };
      }
    }

    // Check doors
    for (const door of project.doors) {
      const bounds = this.getDoorBounds(door);
      if (isPointInBounds(point, bounds)) {
        return {
          id: door.id,
          type: "door",
          bounds,
        };
      }
    }

    // Check walls
    for (const wall of project.walls) {
      if (this.isPointNearWall(point, wall)) {
        const bounds = this.getWallBounds(wall);
        return {
          id: wall.id,
          type: "wall",
          bounds,
        };
      }
    }

    return null;
  }

  public getMultipleSelection(
    startPoint: Point2D,
    endPoint: Point2D,
    project: ShipInteriorProject,
  ): SelectableFeature[] {
    const selectionBounds = this.getSelectionBounds(startPoint, endPoint);
    const selected: SelectableFeature[] = [];

    // Check all stations
    for (const station of project.stations) {
      const stationBounds = {
        x: station.x - station.radius,
        y: station.y - station.radius,
        width: station.radius * 2,
        height: station.radius * 2,
      };

      if (boundsIntersect(selectionBounds, stationBounds)) {
        selected.push({
          id: station.id,
          type: "station",
          bounds: stationBounds,
        });
      }
    }

    // Check all doors
    for (const door of project.doors) {
      const doorBounds = this.getDoorBounds(door);
      if (boundsIntersect(selectionBounds, doorBounds)) {
        selected.push({
          id: door.id,
          type: "door",
          bounds: doorBounds,
        });
      }
    }

    // Check all walls
    for (const wall of project.walls) {
      const wallBounds = this.getWallBounds(wall);
      if (boundsIntersect(selectionBounds, wallBounds)) {
        selected.push({
          id: wall.id,
          type: "wall",
          bounds: wallBounds,
        });
      }
    }

    return selected;
  }

  private isPointNearWall(point: Point2D, wall: Wall): boolean {
    const distance = distanceToLineSegment(
      point,
      { x: wall.x1, y: wall.y1 },
      { x: wall.x2, y: wall.y2 },
    );
    return distance <= wall.thickness / 2 + 2; // 2px tolerance
  }

  private getDoorBounds(door: Door): { x: number; y: number; width: number; height: number } {
    if (door.orientation === "horizontal") {
      return {
        x: door.x - door.width / 2,
        y: door.y - door.height / 2,
        width: door.width,
        height: door.height,
      };
    } else {
      return {
        x: door.x - door.height / 2,
        y: door.y - door.width / 2,
        width: door.height,
        height: door.width,
      };
    }
  }

  private getWallBounds(wall: Wall): { x: number; y: number; width: number; height: number } {
    const minX = Math.min(wall.x1, wall.x2) - wall.thickness / 2;
    const minY = Math.min(wall.y1, wall.y2) - wall.thickness / 2;
    const maxX = Math.max(wall.x1, wall.x2) + wall.thickness / 2;
    const maxY = Math.max(wall.y1, wall.y2) + wall.thickness / 2;

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  private getSelectionBounds(
    start: Point2D,
    end: Point2D,
  ): { x: number; y: number; width: number; height: number } {
    const minX = Math.min(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxX = Math.max(start.x, end.x);
    const maxY = Math.max(start.y, end.y);

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  // Geometry helpers moved to ../utils/geom
}
