import defaultShipLoseMap from "/src/assets/maps/default-ship.losemap.json?raw";
import { parseLoseMap } from "../../../shared/loseMap/guards";
import type { Point2D } from "../../../shared/types/geometry";
import type { ShipInteriorProject } from "../../../tools/map-maker/types/MapProject";
import type { ShipInterior } from "./types";

let cachedDefaultInterior: ShipInterior | null = null;

export function loadDefaultShipInterior(): ShipInterior {
  if (cachedDefaultInterior) {
    return cachedDefaultInterior;
  }

  const project = parseLoseMap(defaultShipLoseMap);
  if (project.type !== "ship" || project.ship == null) {
    throw new Error("Default losemap does not contain a ship project");
  }

  cachedDefaultInterior = convertShipProjectToInterior(project.ship);
  return cachedDefaultInterior;
}

export function loadShipInteriorFromLoseMap(raw: string): ShipInterior {
  const project = parseLoseMap(raw);
  if (project.type !== "ship" || project.ship == null) {
    throw new Error("Provided losemap is not a ship project");
  }
  return convertShipProjectToInterior(project.ship);
}

export function convertShipProjectToInterior(project: ShipInteriorProject): ShipInterior {
  const layerRoomMap = new Map(
    project.layers.rooms.rooms.map((feature) => [feature.id, feature] as const),
  );

  return {
    shipId: project.shipId,
    playerSpawnPoint: { x: project.playerSpawnPoint.x, y: project.playerSpawnPoint.y },
    rooms: project.rooms.map((room) => {
      const feature = layerRoomMap.get(room.id);
      const boundary = extractBoundary(room.boundary, feature?.properties["boundary"]);
      const floorPattern = extractFloorPattern(
        room.floorPattern,
        feature?.properties["floorPattern"],
      );
      return {
        id: room.id,
        name: room.name,
        bounds: {
          x: room.bounds.x,
          y: room.bounds.y,
          width: room.bounds.width,
          height: room.bounds.height,
        },
        type: room.type,
        lighting: {
          color: room.lighting.color,
          intensity: room.lighting.intensity,
        },
        boundary,
        floorPattern,
      };
    }),
    walls: project.walls.map((wall) => ({
      id: wall.id,
      x1: wall.x1,
      y1: wall.y1,
      x2: wall.x2,
      y2: wall.y2,
      thickness: wall.thickness,
      type: wall.type,
    })),
    doors: project.doors.map((door) => {
      const width = Math.max(door.width, 48);
      const height = Math.max(door.height, 12);
      return {
        id: door.id,
        x: door.x,
        y: door.y,
        width,
        height,
        orientation: door.orientation,
        rotation: door.rotation,
        isOpen: door.isOpen,
        connectsRooms: [door.connectsRooms[0], door.connectsRooms[1]],
        type: door.type,
      };
    }),
    stations: project.stations.map((station) => ({
      id: station.id,
      x: station.x,
      y: station.y,
      type: station.type,
      name: station.name,
      radius: station.radius,
      functionality: station.functionality,
    })),
  };
}

function extractBoundary(
  roomBoundary: ShipInterior["rooms"][number]["boundary"],
  featureBoundary: unknown,
): Point2D[] | undefined {
  if (Array.isArray(roomBoundary) && roomBoundary.length >= 3) {
    return roomBoundary;
  }
  if (Array.isArray(featureBoundary)) {
    const sanitized: Point2D[] = [];
    for (const candidate of featureBoundary) {
      if (isPoint(candidate)) {
        sanitized.push({ x: candidate.x, y: candidate.y });
      }
    }
    if (sanitized.length >= 3) return sanitized;
  }
  return undefined;
}

function extractFloorPattern(
  roomPattern: ShipInterior["rooms"][number]["floorPattern"],
  featurePattern: unknown,
): ShipInterior["rooms"][number]["floorPattern"] {
  if (roomPattern) return roomPattern;
  if (
    featurePattern === "metal" ||
    featurePattern === "grating" ||
    featurePattern === "carpet" ||
    featurePattern === "tile"
  ) {
    return featurePattern;
  }
  return undefined;
}

function isPoint(value: unknown): value is Point2D {
  if (value == null || typeof value !== "object") return false;
  const descriptorX = Object.getOwnPropertyDescriptor(value, "x");
  const descriptorY = Object.getOwnPropertyDescriptor(value, "y");
  const x: unknown = descriptorX?.value;
  const y: unknown = descriptorY?.value;
  return typeof x === "number" && typeof y === "number";
}
