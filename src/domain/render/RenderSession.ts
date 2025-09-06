import type { Circle2D } from "../../shared/types/geometry";
import type { DroppedItem } from "../game/items/DroppedItemSystem";
import type { PlanetSurface } from "../game/planet-surface/types";
import type { EnemyView as Enemy, PlayerView } from "../game/views";
import type { StarView } from "./StarRenderer";

// Canonical session interface for renderers. Some methods are optional because
// different render paths only use a subset, and tests provide lightweight mocks.
export interface RenderSession {
  // Mode/state
  getCurrentModeType: () => "space" | "planet";

  // World queries used by renderers
  getPlayer: () => PlayerView | null;
  getEnemies: () => Enemy[];
  getProjectiles: () => Array<Circle2D>;
  getDroppedItems?: () => DroppedItem[];
  getPlanetSurface?: () => PlanetSurface | undefined;

  // Space rendering extras
  // Stars are required for consistent space rendering and overlays
  getStars: () => StarView[];
  // Player heat overlay — renamed for clarity
  getPlayerStarHeatOverlay?: () => { angle: number; intensity: number } | null;
  // Enemy overlays (required for parity with player)
  getEnemyStarHeatOverlays: () => Array<{ id: string; angle: number; intensity: number }>;
  getProjectilesDetailed?: () => Array<{
    id: number;
    x: number;
    y: number;
    radius: number;
    vx: number;
    vy: number;
    faction?: "player" | "enemy" | "neutral";
    ammo?: import("../../shared/types/combat").AmmoType;
  }>;

  // FX events
  getAndClearRenderFxEvents?: () => Array<{ type: "burn"; x: number; y: number }>;

  // Planet mode helpers
  isInPlanetShip?: () => boolean;
  getInPlanetShipProgress?: () => number;
}
