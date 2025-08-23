import { generatePlanets } from "./planets";
import type { Planet } from "./planets";

export class PlanetManager {
  private planets: Planet[] = [];
  private generatedRegions: Set<string> = new Set();

  constructor(size: { width: number; height: number }, initialCenter = { x: 0, y: 0 }) {
    this.planets = generatePlanets({
      count: 16,
      screenW: size.width,
      screenH: size.height,
      center: initialCenter,
    });
  }

  getPlanets() {
    return this.planets;
  }

  maybeGenerateRegion(
    center: { x: number; y: number },
    regionKey: string,
    count = 4,
    size: { width: number; height: number },
  ) {
    if (!this.generatedRegions.has(regionKey)) {
      const newPlanets = generatePlanets({
        count,
        screenW: size.width,
        screenH: size.height,
        center,
      });
      const existingKeys = new Set(this.planets.map((p) => p.id));
      const uniquePlanets = newPlanets.filter((p: Planet) => !existingKeys.has(p.id));
      this.planets = [...this.planets, ...uniquePlanets];
      this.generatedRegions.add(regionKey);
    }
  }
}
