import { createNoise2D } from "simplex-noise";
import { hashStringToInt } from "../../shared/utils";

const noise2D = createNoise2D();

export function shouldPlacePlanet(x: number, y: number, radius: number): boolean {
  // Use noise to determine if a planet should be placed
  // Normalize coordinates to avoid clustering
  const value = noise2D(x / radius, y / radius);
  // Lower threshold for more planets
  return value > 0.2;
}

export interface PlanetSeed {
  x: number;
  y: number;
  size: number;
  color: string;
}

export function generatePlanet(x: number, y: number): PlanetSeed {
  // Larger, more varied planet sizes
  const size = 40 + Math.abs(noise2D(x, y)) * 60;
  // Stable hue in [0, 360) using two decorrelated noise samples to avoid collisions
  const n1 = noise2D(x * 0.01 + 1000, y * 0.01 + 1000);
  const n2 = noise2D(x * 0.017 - 500, y * 0.019 + 750);
  const baseHue = Math.floor((((n1 + n2) * 0.5 + 1) * 180) % 360);
  const hueOffset = hashStringToInt(`${Math.round(x * 1000)},${Math.round(y * 1000)}`) % 360;
  const hue = (baseHue + hueOffset) % 360;
  return {
    x,
    y,
    size,
    color: `hsl(${hue}, 70%, 50%)`,
  };
}
