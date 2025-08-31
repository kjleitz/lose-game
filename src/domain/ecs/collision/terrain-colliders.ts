import type { PlanetSurface } from "../../game/planet-surface/types";

export interface CircleCollider {
  cx: number;
  cy: number;
  r: number;
}

function createRockColliders(feature: PlanetSurface["terrain"][number]): CircleCollider[] {
  // Contoured boulder: cluster of lobes contained within the sprite box (size = half sprite width).
  // Use a central core plus 4 offset lobes to approximate an irregular outline.
  const size = feature.size;
  const core: CircleCollider = { cx: feature.x, cy: feature.y, r: size * 0.34 };
  const offset = size * 0.32;
  const lobeRadius = size * 0.3;
  return [
    core,
    { cx: feature.x - offset, cy: feature.y - offset * 0.35, r: lobeRadius },
    { cx: feature.x + offset * 0.4, cy: feature.y - offset * 0.5, r: lobeRadius },
    { cx: feature.x - offset * 0.2, cy: feature.y + offset * 0.45, r: lobeRadius },
    { cx: feature.x + offset * 0.5, cy: feature.y + offset * 0.2, r: lobeRadius },
  ];
}

function createVegetationColliders(feature: PlanetSurface["terrain"][number]): CircleCollider[] {
  // Tighter footprint around the trunk/base so you can walk under canopy.
  // Offsets are relative to feature.size (sprite half-size).
  const size = feature.size;
  const baseY = feature.y + size * 0.18; // slightly below center
  const main: CircleCollider = { cx: feature.x, cy: baseY, r: size * 0.36 };
  const left: CircleCollider = {
    cx: feature.x - size * 0.22,
    cy: baseY + size * 0.06,
    r: size * 0.28,
  };
  const right: CircleCollider = {
    cx: feature.x + size * 0.22,
    cy: baseY + size * 0.06,
    r: size * 0.28,
  };
  return [main, left, right];
}

function createStructureColliders(feature: PlanetSurface["terrain"][number]): CircleCollider[] {
  // Approximate a rectangular footprint near the ground with a row of circles.
  const size = feature.size;
  const rowY = feature.y + size * 0.06;
  const radius = size * 0.28;
  const stepX = size * 0.32;
  return [
    { cx: feature.x - stepX, cy: rowY, r: radius },
    { cx: feature.x, cy: rowY, r: radius },
    { cx: feature.x + stepX, cy: rowY, r: radius },
  ];
}

export function getTerrainColliders(feature: PlanetSurface["terrain"][number]): CircleCollider[] {
  if (feature.type === "vegetation") return createVegetationColliders(feature);
  if (feature.type === "structure") return createStructureColliders(feature);
  // Default rock behavior keeps original circular blocker
  return createRockColliders(feature);
}
