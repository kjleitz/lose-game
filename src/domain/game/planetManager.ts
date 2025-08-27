import { generatePlanets } from "./planets";
import type { Planet } from "./planets";
import type { ViewSize, Point2D } from "../../shared/types/geometry";

export class PlanetManager {
  private planets: Planet[] = [];
  private generatedRegions: Set<string> = new Set();

  constructor(size: ViewSize, initialCenter: Point2D = { x: 0, y: 0 }) {
    this.planets = generatePlanets({
      count: 16,
      screenW: size.width,
      screenH: size.height,
      center: initialCenter,
    });
  }

  getPlanets(): Planet[] {
    return this.planets;
  }

  maybeGenerateRegion(center: Point2D, regionKey: string, count = 4, size: ViewSize): void {
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
