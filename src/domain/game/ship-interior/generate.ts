import type { Point2D } from "../../../shared/types/geometry";
import type { ShipInterior } from "./types";
import { loadDefaultShipInterior } from "./loseMapLoader";

/**
 * Generate a ship interior layout for a corvette-class vessel.
 * Initially loads from the default .losemap asset, falling back to the legacy
 * hard-coded layout if the file is missing or invalid.
 */
export function generateCorvetteInterior(): ShipInterior {
  try {
    return loadDefaultShipInterior();
  } catch (error) {
    console.warn("Falling back to baked ship interior due to load failure", error);
    return buildFallbackInterior();
  }
}

function buildFallbackInterior(): ShipInterior {
  const rectBoundary = (bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): Point2D[] => [
    { x: bounds.x, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
    { x: bounds.x, y: bounds.y + bounds.height },
  ];

  return {
    shipId: "player_corvette",
    playerSpawnPoint: { x: 220, y: 90 },
    rooms: [
      {
        id: "bridge",
        name: "Bridge",
        bounds: { x: 280, y: 30, width: 110, height: 120 },
        type: "bridge",
        lighting: { color: "#4a9eff", intensity: 0.8 },
        boundary: rectBoundary({ x: 280, y: 30, width: 110, height: 120 }),
        floorPattern: "metal",
      },
      {
        id: "corridor",
        name: "Main Corridor",
        bounds: { x: 160, y: 60, width: 120, height: 60 },
        type: "corridor",
        lighting: { color: "#ffffff", intensity: 0.6 },
        boundary: rectBoundary({ x: 160, y: 60, width: 120, height: 60 }),
        floorPattern: "grating",
      },
      {
        id: "quarters",
        name: "Crew Quarters",
        bounds: { x: 30, y: 30, width: 120, height: 120 },
        type: "quarters",
        lighting: { color: "#ffaa44", intensity: 0.5 },
        boundary: rectBoundary({ x: 30, y: 30, width: 120, height: 120 }),
        floorPattern: "carpet",
      },
      {
        id: "cargo",
        name: "Cargo Bay",
        bounds: { x: 160, y: 120, width: 120, height: 60 },
        type: "cargo",
        lighting: { color: "#88ff88", intensity: 0.7 },
        boundary: rectBoundary({ x: 160, y: 120, width: 120, height: 60 }),
        floorPattern: "metal",
      },
      {
        id: "engine",
        name: "Engine Room",
        bounds: { x: 20, y: 160, width: 140, height: 50 },
        type: "engine",
        lighting: { color: "#ff6644", intensity: 0.9 },
        boundary: rectBoundary({ x: 20, y: 160, width: 140, height: 50 }),
        floorPattern: "tile",
      },
    ],
    walls: [
      { id: "hull_top", x1: 10, y1: 10, x2: 400, y2: 10, thickness: 8, type: "hull" },
      { id: "hull_bottom", x1: 10, y1: 220, x2: 400, y2: 220, thickness: 8, type: "hull" },
      { id: "hull_left", x1: 10, y1: 10, x2: 10, y2: 220, thickness: 8, type: "hull" },
      { id: "hull_right", x1: 400, y1: 10, x2: 400, y2: 220, thickness: 8, type: "hull" },
      { id: "bridge_left_top", x1: 280, y1: 30, x2: 280, y2: 70, thickness: 4, type: "interior" },
      {
        id: "bridge_left_bottom",
        x1: 280,
        y1: 110,
        x2: 280,
        y2: 150,
        thickness: 4,
        type: "interior",
      },
      { id: "bridge_bottom", x1: 280, y1: 150, x2: 390, y2: 150, thickness: 4, type: "interior" },
      { id: "bridge_top", x1: 280, y1: 30, x2: 390, y2: 30, thickness: 4, type: "interior" },
      {
        id: "quarters_right_top",
        x1: 150,
        y1: 30,
        x2: 150,
        y2: 70,
        thickness: 4,
        type: "interior",
      },
      {
        id: "quarters_right_bottom",
        x1: 150,
        y1: 110,
        x2: 150,
        y2: 150,
        thickness: 4,
        type: "interior",
      },
      { id: "quarters_top", x1: 30, y1: 30, x2: 150, y2: 30, thickness: 4, type: "interior" },
      { id: "quarters_bottom", x1: 30, y1: 150, x2: 150, y2: 150, thickness: 4, type: "interior" },
      { id: "corridor_top", x1: 160, y1: 60, x2: 280, y2: 60, thickness: 4, type: "interior" },
      {
        id: "corridor_bottom_left",
        x1: 160,
        y1: 120,
        x2: 200,
        y2: 120,
        thickness: 4,
        type: "interior",
      },
      {
        id: "corridor_bottom_right",
        x1: 240,
        y1: 120,
        x2: 280,
        y2: 120,
        thickness: 4,
        type: "interior",
      },
      {
        id: "engine_top_left",
        x1: 20,
        y1: 160,
        x2: 160,
        y2: 160,
        thickness: 4,
        type: "reinforced",
      },
      {
        id: "engine_top_right",
        x1: 200,
        y1: 160,
        x2: 280,
        y2: 160,
        thickness: 4,
        type: "reinforced",
      },
      { id: "engine_right", x1: 160, y1: 160, x2: 160, y2: 210, thickness: 4, type: "reinforced" },
    ],
    doors: [
      {
        id: "quarters_to_corridor",
        x: 150,
        y: 90,
        width: 48,
        height: 12,
        orientation: "vertical",
        rotation: Math.PI / 2,
        isOpen: true,
        connectsRooms: ["quarters", "corridor"],
        type: "sliding",
      },
      {
        id: "corridor_to_bridge",
        x: 280,
        y: 90,
        width: 48,
        height: 12,
        orientation: "vertical",
        rotation: Math.PI / 2,
        isOpen: true,
        connectsRooms: ["corridor", "bridge"],
        type: "sliding",
      },
      {
        id: "corridor_to_cargo",
        x: 220,
        y: 120,
        width: 48,
        height: 12,
        orientation: "horizontal",
        rotation: 0,
        isOpen: false,
        connectsRooms: ["corridor", "cargo"],
        type: "manual",
      },
      {
        id: "cargo_to_engine",
        x: 180,
        y: 160,
        width: 48,
        height: 12,
        orientation: "horizontal",
        rotation: 0,
        isOpen: false,
        connectsRooms: ["cargo", "engine"],
        type: "manual",
      },
    ],
    stations: [
      {
        id: "pilot_seat",
        x: 335,
        y: 70,
        type: "pilot_console",
        name: "Pilot Console",
        radius: 25,
        functionality: "teleport_to_cockpit",
      },
      {
        id: "navigation_console",
        x: 335,
        y: 120,
        type: "navigation",
        name: "Navigation Terminal",
        radius: 20,
        functionality: "information",
      },
      {
        id: "cargo_terminal",
        x: 220,
        y: 150,
        type: "cargo_terminal",
        name: "Cargo Management",
        radius: 20,
        functionality: "storage",
      },
      {
        id: "engine_controls",
        x: 90,
        y: 185,
        type: "engine_controls",
        name: "Engine Controls",
        radius: 20,
        functionality: "ship_systems",
      },
      {
        id: "life_support",
        x: 90,
        y: 90,
        type: "life_support",
        name: "Life Support Panel",
        radius: 18,
        functionality: "ship_systems",
      },
    ],
  };
}
