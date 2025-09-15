import type { PlanetSurface } from "../../../domain/game/planet-surface/types";
import type { ShipInterior } from "../../../domain/game/ship-interior/types";
import type { Biome } from "../../../shared/types/Biome";
import type { Point2D } from "../../../shared/types/geometry";

export interface MapProject {
  version: string;
  type: "planet" | "ship";
  metadata: {
    name: string;
    author: string;
    created: string;
    modified: string;
  };
  planet?: PlanetSurfaceProject;
  ship?: ShipInteriorProject;
}

export interface PlanetSurfaceProject extends PlanetSurface {
  layers: {
    terrain: TerrainLayer;
    biomes: BiomeLayer;
    resources: ResourceLayer;
    decorations: DecorationLayer;
  };
  layerState?: {
    terrain: LayerState;
    biomes: LayerState;
    resources: LayerState;
    decorations: LayerState;
  };
}

export interface ShipInteriorProject extends ShipInterior {
  layers: {
    structure: StructureLayer;
    rooms: RoomLayer;
    objects: ObjectLayer;
    lighting: LightingLayer;
  };
  layerState?: {
    structure: LayerState;
    rooms: LayerState;
    objects: LayerState;
    lighting: LayerState;
  };
}

export interface TerrainLayer {
  heightMap?: number[][];
  features: LayerFeature[];
}

export interface BiomeLayer {
  biome: Biome;
  paintedAreas: PaintedArea[];
}

export interface ResourceLayer {
  deposits: LayerFeature[];
}

export interface DecorationLayer {
  decorations: LayerFeature[];
}

export interface StructureLayer {
  walls: LayerFeature[];
  hull: LayerFeature[];
}

export interface RoomLayer {
  rooms: LayerFeature[];
  autoDetected: boolean;
}

export interface ObjectLayer {
  doors: LayerFeature[];
  stations: LayerFeature[];
  furniture: LayerFeature[];
}

export interface LightingLayer {
  lights: LayerFeature[];
  ambientLevel: number;
}

export interface LayerFeature {
  id: string;
  x: number;
  y: number;
  type: string;
  properties: Record<string, unknown>;
  selected?: boolean;
  locked?: boolean;
}

export interface PaintedArea {
  id: string;
  points: Point2D[];
  biome: Biome;
  opacity: number;
}

export interface LayerState {
  visible: boolean;
  locked: boolean;
  opacity: number; // 0..1
  order: number; // draw order low→back, high→front
}
