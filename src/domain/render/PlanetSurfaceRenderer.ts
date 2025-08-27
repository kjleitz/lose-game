import type { PlanetSurface, TerrainFeature, Resource, Creature } from "../game/modes/PlanetMode";

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

      if (feature.type === "rock") {
        ctx.fillStyle = "#696969"; // Dark gray
        ctx.beginPath();
        ctx.arc(0, 0, feature.size, 0, Math.PI * 2);
        ctx.fill();
        // Add some texture
        ctx.fillStyle = "#778899"; // Light gray
        ctx.beginPath();
        ctx.arc(-feature.size * 0.3, -feature.size * 0.3, feature.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
      } else if (feature.type === "vegetation") {
        // Simple tree/bush representation
        ctx.fillStyle = "#228B22"; // Forest green
        ctx.beginPath();
        ctx.arc(0, 0, feature.size, 0, Math.PI * 2);
        ctx.fill();
        // Add a brown trunk
        ctx.fillStyle = "#8B4513";
        ctx.fillRect(-feature.size * 0.1, 0, feature.size * 0.2, feature.size * 0.5);
      }

      ctx.restore();
    }
    ctx.restore();
  }

  private renderResources(ctx: CanvasRenderingContext2D, resources: Resource[]): void {
    ctx.save();
    for (const resource of resources) {
      ctx.save();
      ctx.translate(resource.x, resource.y);

      // Different colors for different resource types
      switch (resource.type) {
        case "mineral":
          ctx.fillStyle = "#C0C0C0"; // Silver
          break;
        case "energy":
          ctx.fillStyle = "#FFD700"; // Gold
          break;
        case "organic":
          ctx.fillStyle = "#90EE90"; // Light green
          break;
      }

      // Draw as a diamond shape
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(8, 0);
      ctx.lineTo(0, 8);
      ctx.lineTo(-8, 0);
      ctx.closePath();
      ctx.fill();

      // Add a glow effect
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5;
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.restore();
    }
    ctx.restore();
  }

  private renderCreatures(ctx: CanvasRenderingContext2D, creatures: Creature[]): void {
    ctx.save();
    for (const creature of creatures) {
      ctx.save();
      ctx.translate(creature.x, creature.y);

      // Different colors for different creature types
      switch (creature.type) {
        case "passive":
          ctx.fillStyle = "#90EE90"; // Light green
          break;
        case "neutral":
          ctx.fillStyle = "#FFD700"; // Gold
          break;
        case "hostile":
          ctx.fillStyle = "#FF6347"; // Tomato red
          break;
      }

      // Draw as a simple circle with eyes
      ctx.beginPath();
      ctx.arc(0, 0, creature.radius, 0, Math.PI * 2);
      ctx.fill();

      // Add simple eyes
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(-creature.radius * 0.3, -creature.radius * 0.3, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(creature.radius * 0.3, -creature.radius * 0.3, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
    ctx.restore();
  }
}
