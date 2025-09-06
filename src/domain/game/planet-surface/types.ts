import type { Point2D } from "../../../shared/types/geometry";
import type { Biome } from "../../../shared/types/Biome";

export interface PlanetSurface {
  planetId: string;
  landingSite: Point2D;
  // Ship facing angle when grounded at landingSite (radians). Optional.
  shipAngle?: number;
  terrain: TerrainFeature[];
  resources: Resource[];
  creatures: Creature[];
  biome?: Biome;
  waterBodies?: WaterBody[];
}

export interface TerrainFeature {
  id: string;
  x: number;
  y: number;
  type: "rock" | "vegetation" | "structure";
  size: number;
}

export interface Resource {
  id: string;
  x: number;
  y: number;
  type: "mineral" | "energy" | "organic";
  amount: number;
}

export interface Creature {
  id: string;
  x: number;
  y: number;
  type: "passive" | "neutral" | "hostile";
  radius: number;
}

export interface WaterBody {
  id: string;
  x: number;
  y: number;
  rx: number;
  ry: number;
  rotation: number;
}
