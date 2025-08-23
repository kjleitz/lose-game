// ...existing code...
// Planet generation and data
import { generatePlanet } from "./planetGenerator";

export type Planet = {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  design: "solid" | "ringed" | "striped" | "spotted";
};

const DESIGNS: Planet["design"][] = ["solid", "ringed", "striped", "spotted"];

export interface GeneratePlanetsOptions {
  count: number;
  screenW: number;
  screenH: number;
  center?: { x: number; y: number };
}

export function generatePlanets({
  count,
  screenW,
  screenH,
  center = { x: 0, y: 0 },
}: GeneratePlanetsOptions): Planet[] {
  const planets: Planet[] = [];
  // Grid spacing: want ~5 planets visible on screen at once
  const gridStep = Math.max(screenW, screenH) / 5;
  // Cover a region around the center large enough for movement
  const gridRadius = gridStep * 10; // covers 10x10 grid
  for (let gx = -gridRadius; gx <= gridRadius; gx += gridStep) {
    for (let gy = -gridRadius; gy <= gridRadius; gy += gridStep) {
      const x = center.x + gx;
      const y = center.y + gy;
      // Skip if x or y is NaN
      if (isNaN(x) || isNaN(y)) continue;
      // Place a planet at every grid vertex
      const planetData = generatePlanet(x, y);
      const design = DESIGNS[Math.floor(Math.abs(x + y)) % DESIGNS.length];
      const radius = planetData.size;
      planets.push({
        id: `planet-${x.toFixed(0)}-${y.toFixed(0)}`,
        x,
        y,
        radius,
        color: planetData.color,
        design,
      });
      if (planets.length >= count) return planets;
    }
  }
  return planets;
}
