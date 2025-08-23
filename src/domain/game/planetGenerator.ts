import { createNoise2D } from "simplex-noise";

const noise2D = createNoise2D();

export function shouldPlacePlanet(x: number, y: number, radius: number): boolean {
  // Use noise to determine if a planet should be placed
  // Normalize coordinates to avoid clustering
  const value = noise2D(x / radius, y / radius);
  // Lower threshold for more planets
  return value > 0.2;
}

export function generatePlanet(x: number, y: number) {
  // Larger, more varied planet sizes
  return {
    x: x,
    y: y,
    size: 40 + Math.abs(noise2D(x, y)) * 60,
    color: `hsl(${Math.floor(noise2D(x + 1000, y + 1000) * 360)}, 70%, 50%)`,
  };
}
