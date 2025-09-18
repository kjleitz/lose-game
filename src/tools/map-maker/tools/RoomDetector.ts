import type { Point2D } from "../../../shared/types/geometry";
import type { Wall, Room } from "../../../domain/game/ship-interior/types";

export interface DetectedRoom {
  id: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  enclosingWalls: string[]; // Wall IDs that form this room
  floorArea: Point2D[]; // Points that define the room's floor area
  boundary: Point2D[]; // Ordered polygon outlining the room in world coords
}

export interface RoomDetectionGrid {
  width: number;
  height: number;
  cellSize: number;
  grid: boolean[][]; // true = wall, false = empty space
}

export class RoomDetector {
  private gridCellSize = 4; // Size of each grid cell for flood fill

  public detectRooms(
    walls: Wall[],
    bounds: { x: number; y: number; width: number; height: number },
  ): DetectedRoom[] {
    // Create a collision grid from walls
    const grid = this.createWallGrid(walls, bounds);

    // Find all enclosed areas using flood fill
    const enclosedAreas = this.findEnclosedAreas(grid);

    // Convert areas to room objects
    const rooms = enclosedAreas.map((area, index) => this.areaToRoom(area, index, walls, bounds));

    // Filter out rooms that are too small
    return rooms.filter((room) => this.isValidRoom(room));
  }

  public updateRoomConnections(
    rooms: DetectedRoom[],
    doors: { x: number; y: number; connectsRooms: [string, string] }[],
  ): DetectedRoom[] {
    // Update door connections based on room detection
    for (const door of doors) {
      const roomsAtDoor = rooms.filter((room) => this.isPointInRoom(door, room));

      if (roomsAtDoor.length === 2) {
        door.connectsRooms = [roomsAtDoor[0].id, roomsAtDoor[1].id];
      }
    }

    return rooms;
  }

  private createWallGrid(
    walls: Wall[],
    bounds: { x: number; y: number; width: number; height: number },
  ): RoomDetectionGrid {
    const gridWidth = Math.ceil(bounds.width / this.gridCellSize);
    const gridHeight = Math.ceil(bounds.height / this.gridCellSize);

    const grid: boolean[][] = [];
    for (let y = 0; y < gridHeight; y++) {
      const row: boolean[] = [];
      for (let x = 0; x < gridWidth; x++) {
        row.push(false);
      }
      grid[y] = row;
    }

    // Mark wall cells as blocked
    for (const wall of walls) {
      this.rasterizeWall(wall, grid, bounds);
    }

    return {
      width: gridWidth,
      height: gridHeight,
      cellSize: this.gridCellSize,
      grid,
    };
  }

  private rasterizeWall(
    wall: Wall,
    grid: boolean[][],
    bounds: { x: number; y: number; width: number; height: number },
  ): void {
    // Use Bresenham's line algorithm to mark wall cells
    const startX = Math.floor((wall.x1 - bounds.x) / this.gridCellSize);
    const startY = Math.floor((wall.y1 - bounds.y) / this.gridCellSize);
    const endX = Math.floor((wall.x2 - bounds.x) / this.gridCellSize);
    const endY = Math.floor((wall.y2 - bounds.y) / this.gridCellSize);

    const points = this.bresenhamLine(startX, startY, endX, endY);

    for (const point of points) {
      if (point.x >= 0 && point.x < grid[0].length && point.y >= 0 && point.y < grid.length) {
        grid[point.y][point.x] = true;

        // Also mark adjacent cells for wall thickness
        const thickness = Math.ceil(wall.thickness / this.gridCellSize / 2);
        for (let dy = -thickness; dy <= thickness; dy++) {
          for (let dx = -thickness; dx <= thickness; dx++) {
            const newX = point.x + dx;
            const newY = point.y + dy;
            if (newX >= 0 && newX < grid[0].length && newY >= 0 && newY < grid.length) {
              grid[newY][newX] = true;
            }
          }
        }
      }
    }
  }

  private bresenhamLine(startX: number, startY: number, endX: number, endY: number): Point2D[] {
    const points: Point2D[] = [];
    let x0 = startX;
    let y0 = startY;
    const x1 = endX;
    const y1 = endY;

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      points.push({ x: x0, y: y0 });

      if (x0 === x1 && y0 === y1) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }

    return points;
  }

  private findEnclosedAreas(gridData: RoomDetectionGrid): Point2D[][] {
    const { grid, width, height } = gridData;
    const visited: boolean[][] = [];
    for (let y = 0; y < height; y++) {
      const row: boolean[] = [];
      for (let x = 0; x < width; x++) {
        row.push(false);
      }
      visited[y] = row;
    }

    const enclosedAreas: Point2D[][] = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!grid[y][x] && !visited[y][x]) {
          const area = this.floodFill(x, y, grid, visited);
          if (this.isAreaEnclosed(area, grid)) {
            enclosedAreas.push(area);
          }
        }
      }
    }

    return enclosedAreas;
  }

  private floodFill(
    startX: number,
    startY: number,
    grid: boolean[][],
    visited: boolean[][],
  ): Point2D[] {
    const area: Point2D[] = [];
    const stack: Point2D[] = [{ x: startX, y: startY }];
    const width = grid[0].length;
    const height = grid.length;

    while (stack.length > 0) {
      const current = stack.pop()!;
      const { x, y } = current;

      if (x < 0 || x >= width || y < 0 || y >= height || visited[y][x] || grid[y][x]) {
        continue;
      }

      visited[y][x] = true;
      area.push({ x, y });

      // Add neighbors
      stack.push({ x: x + 1, y });
      stack.push({ x: x - 1, y });
      stack.push({ x, y: y + 1 });
      stack.push({ x, y: y - 1 });
    }

    return area;
  }

  private isAreaEnclosed(area: Point2D[], grid: boolean[][]): boolean {
    // Check if area touches the boundary - if it does, it's not enclosed
    const width = grid[0].length;
    const height = grid.length;

    for (const point of area) {
      if (point.x === 0 || point.x === width - 1 || point.y === 0 || point.y === height - 1) {
        return false;
      }
    }

    return area.length > 4; // Minimum size for a room
  }

  private areaToRoom(
    area: Point2D[],
    index: number,
    walls: Wall[],
    bounds: { x: number; y: number; width: number; height: number },
  ): DetectedRoom {
    // Calculate bounding box
    const minX = Math.min(...area.map((point) => point.x));
    const maxX = Math.max(...area.map((point) => point.x));
    const minY = Math.min(...area.map((point) => point.y));
    const maxY = Math.max(...area.map((point) => point.y));

    // Convert grid coordinates back to world coordinates, including the bounds offset
    const worldBounds = {
      x: bounds.x + minX * this.gridCellSize,
      y: bounds.y + minY * this.gridCellSize,
      width: (maxX - minX + 1) * this.gridCellSize,
      height: (maxY - minY + 1) * this.gridCellSize,
    };

    // Find walls that contribute to this room
    const enclosingWalls = this.findEnclosingWalls(walls);

    // Build a boundary path (ordered polygon) around the filled area
    const boundary = this.buildBoundaryFromArea(area, bounds);

    return {
      id: `room-${index + 1}`,
      bounds: worldBounds,
      enclosingWalls,
      floorArea: area.map((point) => ({
        x: bounds.x + point.x * this.gridCellSize,
        y: bounds.y + point.y * this.gridCellSize,
      })),
      boundary,
    };
  }

  private findEnclosingWalls(walls: Wall[]): string[] {
    // Simplified: return all walls. In practice you'd want more sophisticated
    // wall-to-room association logic based on spatial relationships
    return walls.map((wall) => wall.id);
  }

  // Build an ordered boundary polygon around the filled grid area by extracting
  // outer cell edges and tracing them into a single loop. Points are converted
  // to world coordinates using the bounds offset and grid cell size.
  private buildBoundaryFromArea(
    area: Point2D[],
    bounds: { x: number; y: number; width: number; height: number },
  ): Point2D[] {
    // Collect unique edges around each filled cell; shared edges cancel out
    interface Vertex {
      x: number;
      y: number;
    }
    interface Segment {
      a: Vertex;
      b: Vertex;
    }
    const segmentKey = (segment: Segment): string => {
      const ax = Math.min(segment.a.x, segment.b.x);
      const ay = Math.min(segment.a.y, segment.b.y);
      const bx = Math.max(segment.a.x, segment.b.x);
      const by = Math.max(segment.a.y, segment.b.y);
      return `${ax},${ay}-${bx},${by}`;
    };

    const edgeCount = new Map<string, { segment: Segment; count: number }>();

    for (const cell of area) {
      const x = cell.x;
      const y = cell.y;
      // Define the 4 edges of the cell in grid-vertex coordinates
      const top: Segment = { a: { x, y }, b: { x: x + 1, y } };
      const right: Segment = { a: { x: x + 1, y }, b: { x: x + 1, y: y + 1 } };
      const bottom: Segment = { a: { x, y: y + 1 }, b: { x: x + 1, y: y + 1 } };
      const left: Segment = { a: { x, y }, b: { x, y: y + 1 } };
      const edges = [top, right, bottom, left];
      for (const edge of edges) {
        const key = segmentKey(edge);
        const entry = edgeCount.get(key);
        if (entry) {
          entry.count += 1;
        } else {
          edgeCount.set(key, { segment: edge, count: 1 });
        }
      }
    }

    // Keep edges that are not shared (count === 1)
    const boundaryEdges: Segment[] = [];
    edgeCount.forEach((value) => {
      if (value.count === 1) boundaryEdges.push(value.segment);
    });

    if (boundaryEdges.length === 0) return [];

    // Build adjacency map of vertices to connected vertices
    const vertexKey = (vertex: Vertex): string => `${vertex.x},${vertex.y}`;
    const neighbors = new Map<string, Vertex[]>();
    const uniqueVertex = new Map<string, Vertex>();
    for (const seg of boundaryEdges) {
      const aKey = vertexKey(seg.a);
      const bKey = vertexKey(seg.b);
      if (!neighbors.has(aKey)) neighbors.set(aKey, []);
      if (!neighbors.has(bKey)) neighbors.set(bKey, []);
      neighbors.get(aKey)!.push(seg.b);
      neighbors.get(bKey)!.push(seg.a);
      if (!uniqueVertex.has(aKey)) uniqueVertex.set(aKey, seg.a);
      if (!uniqueVertex.has(bKey)) uniqueVertex.set(bKey, seg.b);
    }

    // Find starting vertex: minimal y, then minimal x
    const allVertices = Array.from(uniqueVertex.values());
    allVertices.sort((left, right) => (left.y === right.y ? left.x - right.x : left.y - right.y));
    const start = allVertices[0];

    // Trace the loop by always choosing the next neighbor that isn't the previous
    const ordered: Vertex[] = [start];
    let current = start;
    let previous: Vertex | null = null;
    const safeLimit = boundaryEdges.length * 4 + 10; // guard against infinite loops

    for (let i = 0; i < safeLimit; i++) {
      const key = vertexKey(current);
      const adj = neighbors.get(key) ?? [];
      let next: Vertex | null = null;
      for (const candidate of adj) {
        if (previous && candidate.x === previous.x && candidate.y === previous.y) {
          continue;
        }
        next = candidate;
        break;
      }
      if (!next) {
        // Dead end; try going back if only one neighbor exists
        if (adj.length > 0) next = adj[0];
      }
      if (!next) break;
      if (next.x === start.x && next.y === start.y) {
        // Closed loop
        break;
      }
      ordered.push(next);
      previous = current;
      current = next;
    }

    // Convert grid vertices to world coordinates
    const boundaryWorld: Point2D[] = ordered.map((vertex) => ({
      x: bounds.x + vertex.x * this.gridCellSize,
      y: bounds.y + vertex.y * this.gridCellSize,
    }));
    return boundaryWorld;
  }

  private isValidRoom(room: DetectedRoom): boolean {
    const minRoomSize = 64; // Minimum room size in pixels
    return room.bounds.width >= minRoomSize && room.bounds.height >= minRoomSize;
  }

  private isPointInRoom(point: { x: number; y: number }, room: DetectedRoom): boolean {
    const { bounds } = room;
    return (
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.width &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.height
    );
  }

  public convertDetectedRoomsToShipRooms(detectedRooms: DetectedRoom[]): Room[] {
    return detectedRooms.map((detectedRoom, index) => ({
      id: detectedRoom.id,
      name: `Room ${index + 1}`,
      bounds: detectedRoom.bounds,
      type: this.inferRoomType(detectedRoom),
      lighting: {
        color: "#ffffff",
        intensity: 0.8,
      },
      boundary: detectedRoom.boundary,
    }));
  }

  private inferRoomType(
    room: DetectedRoom,
  ): "bridge" | "quarters" | "cargo" | "engine" | "corridor" {
    // Simple heuristic based on room size
    const area = room.bounds.width * room.bounds.height;

    if (area < 1000) return "corridor";
    if (area < 5000) return "quarters";
    if (area < 10000) return "bridge";
    if (area < 20000) return "engine";
    return "cargo";
  }
}
