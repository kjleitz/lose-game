import { drawPlanetCanvas } from "../../ui/components/PlanetCanvas";
import type { Planet } from "../game/planets";

export class PlanetRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    planets: Planet[],
    getRadius: (planet: Planet) => number,
  ): void {
    for (const planet of planets) {
      drawPlanetCanvas({ planet, ctx, x: planet.x, y: planet.y, r: getRadius(planet) });
    }
  }
}
