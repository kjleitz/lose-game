import type { Point2D } from "../../../shared/types/geometry";

export type RoomFloorPattern = "metal" | "grating" | "carpet" | "tile";

export interface ShipInterior {
  shipId: string;
  playerSpawnPoint: Point2D;
  rooms: Room[];
  walls: Wall[];
  doors: Door[];
  stations: InteractiveStation[];
}

export interface Room {
  id: string;
  name: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  type: "bridge" | "quarters" | "cargo" | "engine" | "corridor";
  lighting: {
    color: string;
    intensity: number;
  };
  boundary?: Point2D[];
  floorPattern?: RoomFloorPattern;
}

export interface Wall {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number;
  type: "hull" | "interior" | "reinforced";
}

export interface Door {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  orientation: "horizontal" | "vertical";
  rotation: number;
  isOpen: boolean;
  connectsRooms: [string, string]; // room IDs
  type: "sliding" | "manual" | "airlock";
}

export interface InteractiveStation {
  id: string;
  x: number;
  y: number;
  type: "pilot_console" | "cargo_terminal" | "engine_controls" | "navigation" | "life_support";
  name: string;
  radius: number; // interaction radius
  functionality: "teleport_to_cockpit" | "ship_systems" | "storage" | "information";
}
