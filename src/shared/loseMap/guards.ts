import type { MapProject } from "../../tools/map-maker/types/MapProject";
import type { Room, Wall, Door, InteractiveStation } from "../../domain/game/ship-interior/types";
import type { PlanetSurfaceProject } from "../../tools/map-maker/types/MapProject";

export function parseLoseMap(json: string): MapProject {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error("Failed to parse map JSON");
  }

  if (!isLoseMapProject(data)) {
    throw new Error("Provided JSON is not a valid .losemap project");
  }

  return data;
}

export function isLoseMapProject(value: unknown): value is MapProject {
  if (!isRecord(value)) return false;
  if (typeof value.version !== "string") return false;
  if (value.type !== "ship" && value.type !== "planet") return false;
  if (!isMetadata(value.metadata)) return false;

  if (value.type === "ship") {
    return isShipInteriorProject(value.ship);
  }

  return isPlanetProject(value.planet);
}

function isShipInteriorProject(value: unknown): value is MapProject["ship"] {
  if (!isRecord(value)) return false;
  if (typeof value.shipId !== "string") return false;
  if (!isPoint(value.playerSpawnPoint)) return false;
  if (!Array.isArray(value.rooms) || !value.rooms.every(isRoom)) return false;
  if (!Array.isArray(value.walls) || !value.walls.every(isWall)) return false;
  if (!Array.isArray(value.doors) || !value.doors.every(isDoor)) return false;
  if (!Array.isArray(value.stations) || !value.stations.every(isStation)) return false;
  return true;
}

function isPlanetProject(value: unknown): value is PlanetSurfaceProject {
  if (!isRecord(value)) return false;
  return true; // Planet validation deferred; ship editor currently focuses on ship projects
}

function isRoom(value: unknown): value is Room {
  if (!isRecord(value)) return false;
  if (typeof value.id !== "string") return false;
  if (typeof value.name !== "string") return false;
  if (!isBounds(value.bounds)) return false;
  if (!isRoomType(value.type)) return false;
  if (!isRecord(value.lighting)) return false;
  if (typeof value.lighting.color !== "string") return false;
  if (typeof value.lighting.intensity !== "number") return false;
  return true;
}

function isWall(value: unknown): value is Wall {
  if (!isRecord(value)) return false;
  if (typeof value.id !== "string") return false;
  if (typeof value.x1 !== "number" || typeof value.y1 !== "number") return false;
  if (typeof value.x2 !== "number" || typeof value.y2 !== "number") return false;
  if (typeof value.thickness !== "number") return false;
  if (!isWallType(value.type)) return false;
  return true;
}

function isDoor(value: unknown): value is Door {
  if (!isRecord(value)) return false;
  if (typeof value.id !== "string") return false;
  if (typeof value.x !== "number" || typeof value.y !== "number") return false;
  if (typeof value.width !== "number" || typeof value.height !== "number") return false;
  if (!isDoorOrientation(value.orientation)) return false;
  if (typeof value.rotation !== "number") return false;
  if (typeof value.isOpen !== "boolean") return false;
  if (!Array.isArray(value.connectsRooms) || value.connectsRooms.length !== 2) return false;
  if (!value.connectsRooms.every((entry) => typeof entry === "string")) return false;
  if (!isDoorType(value.type)) return false;
  return true;
}

function isStation(value: unknown): value is InteractiveStation {
  if (!isRecord(value)) return false;
  if (typeof value.id !== "string") return false;
  if (typeof value.x !== "number" || typeof value.y !== "number") return false;
  if (!isStationType(value.type)) return false;
  if (typeof value.name !== "string") return false;
  if (typeof value.radius !== "number") return false;
  if (!isStationFunction(value.functionality)) return false;
  return true;
}

function isMetadata(value: unknown): value is MapProject["metadata"] {
  if (!isRecord(value)) return false;
  if (typeof value.name !== "string") return false;
  if (typeof value.author !== "string") return false;
  if (typeof value.created !== "string") return false;
  if (typeof value.modified !== "string") return false;
  return true;
}

function isBounds(value: unknown): value is Room["bounds"] {
  if (!isRecord(value)) return false;
  if (typeof value.x !== "number" || typeof value.y !== "number") return false;
  if (typeof value.width !== "number" || typeof value.height !== "number") return false;
  return true;
}

function isRoomType(value: unknown): value is Room["type"] {
  return (
    value === "bridge" ||
    value === "quarters" ||
    value === "cargo" ||
    value === "engine" ||
    value === "corridor"
  );
}

function isWallType(value: unknown): value is Wall["type"] {
  return value === "hull" || value === "interior" || value === "reinforced";
}

function isDoorOrientation(value: unknown): value is Door["orientation"] {
  return value === "horizontal" || value === "vertical";
}

function isDoorType(value: unknown): value is Door["type"] {
  return value === "sliding" || value === "manual" || value === "airlock";
}

function isStationType(value: unknown): value is InteractiveStation["type"] {
  return (
    value === "pilot_console" ||
    value === "cargo_terminal" ||
    value === "engine_controls" ||
    value === "navigation" ||
    value === "life_support"
  );
}

function isStationFunction(value: unknown): value is InteractiveStation["functionality"] {
  return (
    value === "teleport_to_cockpit" ||
    value === "ship_systems" ||
    value === "storage" ||
    value === "information"
  );
}

function isPoint(value: unknown): value is { x: number; y: number } {
  return isRecord(value) && typeof value.x === "number" && typeof value.y === "number";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object";
}
