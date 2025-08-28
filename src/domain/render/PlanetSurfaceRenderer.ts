import type { PlanetSurface, TerrainFeature, Resource, Creature } from "../game/modes/PlanetMode";
import { drawCreature, drawResource, drawTerrain } from "./sprites";

export class PlanetSurfaceRenderer {
  render(ctx: CanvasRenderingContext2D, surface: PlanetSurface | undefined): void {
    if (!surface) return;

    // Clear to a planet surface color (brownish/sandy)
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#8B4513"; // Brown surface
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();

    // Draw landing site as a cleared circle
    ctx.save();
    ctx.fillStyle = "#CD853F"; // Sandy brown
    ctx.beginPath();
    ctx.arc(surface.landingSite.x, surface.landingSite.y, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw terrain features
    this.renderTerrainFeatures(ctx, surface.terrain);

    // Draw resources
    this.renderResources(ctx, surface.resources);

    // Draw creatures
    this.renderCreatures(ctx, surface.creatures);
  }

  private renderTerrainFeatures(ctx: CanvasRenderingContext2D, terrain: TerrainFeature[]): void {
    ctx.save();
    for (const feature of terrain) {
      ctx.save();
      ctx.translate(feature.x, feature.y);

      const spriteType = feature.type;
      drawTerrain(ctx, 0, 0, spriteType, feature.size * 2);

      ctx.restore();
    }
    ctx.restore();
  }

  private renderResources(ctx: CanvasRenderingContext2D, resources: Resource[]): void {
    ctx.save();
    for (const resource of resources) {
      ctx.save();
      ctx.translate(resource.x, resource.y);

      // Draw resource sprite
      drawResource(ctx, 0, 0, resource.type, 24);

      ctx.restore();
    }
    ctx.restore();
  }

  private renderCreatures(ctx: CanvasRenderingContext2D, creatures: Creature[]): void {
    ctx.save();
    for (const creature of creatures) {
      ctx.save();
      ctx.translate(creature.x, creature.y);

      drawCreature(ctx, 0, 0, creature.type, creature.radius * 2);

      ctx.restore();
    }
    ctx.restore();
  }
}
