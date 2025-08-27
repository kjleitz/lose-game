// Planet generation and data
import { generatePlanet } from "./planetGenerator";
import type { Point2D } from "../../shared/types/geometry";

export interface Planet {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  design: "solid" | "ringed" | "striped" | "spotted";
}

const DESIGNS: Planet["design"][] = ["solid", "ringed", "striped", "spotted"];

export interface GeneratePlanetsOptions {
  count: number;
  screenW: number;
  screenH: number;
  center?: Point2D;
}

export function generatePlanets(options: GeneratePlanetsOptions): Planet[] {
  const { count, screenW, screenH, center = { x: 0, y: 0 } } = options;
  // Even grid distribution near the requested center.
  // Aim for roughly 5–10 planets visible by spacing ~1/3 of the larger screen axis.
  const gridStep = Math.max(screenW, screenH) / 3;

  // Build a list of candidate grid points around the center, then take the closest N.
  // Choose a radius in grid cells large enough to exceed `count` comfortably.
  const cellsRadius = Math.ceil(Math.sqrt(count)) + 2; // ensures (2r+1)^2 > count
  const candidates: { x: number; y: number; ix: number; iy: number; dist: number }[] = [];

  const ix0 = Math.round(center.x / gridStep);
  const iy0 = Math.round(center.y / gridStep);
  for (let dx = -cellsRadius; dx <= cellsRadius; dx++) {
    for (let dy = -cellsRadius; dy <= cellsRadius; dy++) {
      const ix = ix0 + dx;
      const iy = iy0 + dy;
      const x = ix * gridStep;
      const y = iy * gridStep;
      if (Number.isNaN(x) || Number.isNaN(y)) continue;
      const dist = Math.hypot(x - center.x, y - center.y);
      candidates.push({ x, y, ix, iy, dist });
    }
  }

  // Sort by distance so we prefer planets close to the center/player
  candidates.sort((a, b) => a.dist - b.dist);

  const planets: Planet[] = [];
  const seen = new Set<string>();

  for (const c of candidates) {
    const id = `planet-${c.ix}-${c.iy}`;
    if (seen.has(id)) continue; // safety against any duplicate indices
    seen.add(id);

    const planetData = generatePlanet(c.x, c.y);
    const design =
      DESIGNS[(Math.abs((c.ix * 73856093) ^ (c.iy * 19349663)) >>> 0) % DESIGNS.length];
    planets.push({
      id,
      x: c.x,
      y: c.y,
      radius: planetData.size,
      color: planetData.color,
      design,
    });

    if (planets.length >= count) break;
  }

  return planets;
}
