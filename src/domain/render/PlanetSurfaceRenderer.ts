import type { Biome } from "../../shared/types/Biome";
import { drawCreature, drawResource, drawTerrain, drawShipTriangle } from "./sprites";
import { createSeededRng, hashStringToInt } from "../../shared/utils";
import { getVisualConfig } from "./VisualConfig";
import type { PlanetSurface } from "../game/planet-surface/types";

export class PlanetSurfaceRenderer {
  render(ctx: CanvasRenderingContext2D, surface: PlanetSurface | undefined): void {
    if (!surface) return;
    const biome: Biome = surface.biome ?? "fields";
    // Draw ground as a world-space repeating texture so it does not stick to the screen
    this.renderGroundTexture(ctx, biome);

    // Water features under everything else
    if (surface.waterBodies && surface.waterBodies.length > 0) {
      this.renderWaterBodies(ctx, surface.waterBodies, biome);
    }

    // Draw landed ship sprite at the landing site
    drawShipTriangle(ctx, surface.landingSite.x, surface.landingSite.y, 0, 64);

    // Draw terrain features
    this.renderTerrainFeatures(ctx, surface.terrain);

    // Draw resources
    this.renderResources(ctx, surface.resources);

    // Draw creatures
    this.renderCreatures(ctx, surface.creatures);
  }

  private renderTerrainFeatures(
    ctx: CanvasRenderingContext2D,
    terrain: PlanetSurface["terrain"],
  ): void {
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

  private renderResources(
    ctx: CanvasRenderingContext2D,
    resources: PlanetSurface["resources"],
  ): void {
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

  private renderCreatures(
    ctx: CanvasRenderingContext2D,
    creatures: PlanetSurface["creatures"],
  ): void {
    ctx.save();
    for (const creature of creatures) {
      ctx.save();
      ctx.translate(creature.x, creature.y);

      drawCreature(ctx, 0, 0, creature.type, creature.radius * 2);

      ctx.restore();
    }
    ctx.restore();
  }

  private renderWaterBodies(
    ctx: CanvasRenderingContext2D,
    waters: NonNullable<PlanetSurface["waterBodies"]>,
    biome: Biome,
  ): void {
    ctx.save();
    for (const water of waters) {
      ctx.save();
      ctx.translate(water.x, water.y);
      ctx.rotate(water.rotation);
      // Main water fill
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = "#2e77b6";
      ctx.beginPath();
      ctx.ellipse(0, 0, water.rx, water.ry, 0, 0, Math.PI * 2);
      ctx.fill();

      // Shallow-water blending: inner lighter water near shore
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = "#6bbbe6";
      ctx.beginPath();
      ctx.ellipse(0, 0, water.rx * 0.86, water.ry * 0.86, 0, 0, Math.PI * 2);
      ctx.fill();

      // Feathered band to blend into ground
      ctx.globalAlpha = 0.08;
      ctx.strokeStyle = "#6bbbe6";
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.ellipse(0, 0, water.rx * 0.95, water.ry * 0.95, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Inner gradient suggestion (simple alpha ring)
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(0, 0, water.rx * 0.92, water.ry * 0.92, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Shoreline highlight
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = "#e9d8a6";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.ellipse(0, 0, water.rx + 4, water.ry + 4, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Gentle ripple lines
      ctx.globalAlpha = 0.08;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.ellipse(
          0,
          0,
          water.rx * (0.6 + i * 0.08),
          water.ry * (0.6 + i * 0.08),
          0,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }

      // Edge foam and shoreline clutter (deterministic per water id)
      this.drawShoreFoam(ctx, water.rx, water.ry, biome, water.id);
      this.drawShoreClutter(ctx, water.rx, water.ry, biome, water.id);
      this.drawShorePlants(ctx, water.rx, water.ry, biome, water.id);

      ctx.restore();
    }
    ctx.restore();
  }

  private drawShoreFoam(
    ctx: CanvasRenderingContext2D,
    rx: number,
    ry: number,
    biome: Biome,
    waterId: string,
  ): void {
    // More foam in archipelago, subtle elsewhere
    const cfg = getVisualConfig();
    const base = biome === "archipelago" ? 22 : biome === "rainforest" ? 10 : 6;
    const density = Math.max(0, Math.floor(base * (cfg.foamDensity ?? 1)));
    const rng = createSeededRng(hashStringToInt(`foam-${waterId}`));
    ctx.save();
    ctx.globalAlpha = biome === "archipelago" ? 0.22 : 0.12;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    for (let i = 0; i < density; i++) {
      const angle = rng.float(0, Math.PI * 2);
      const len = rng.float(10, 26);
      const off = rng.float(3, 10);
      // Foam arc positioned just outside shoreline
      const cx = Math.cos(angle) * (rx + off);
      const cy = Math.sin(angle) * (ry + off);
      ctx.beginPath();
      ctx.ellipse(cx, cy, len, len * 0.35, angle, Math.PI * 0.1, Math.PI * 0.9);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawShoreClutter(
    ctx: CanvasRenderingContext2D,
    rx: number,
    ry: number,
    biome: Biome,
    waterId: string,
  ): void {
    const rng = createSeededRng(hashStringToInt(`clutter-${waterId}`));
    // Stones density higher in archipelago/fields; driftwood more in archipelago
    const stones =
      biome === "archipelago" ? 18 : biome === "fields" ? 12 : biome === "desert" ? 4 : 10;
    const sticks = biome === "archipelago" ? 10 : biome === "fields" ? 6 : 2;

    // Stones
    ctx.save();
    ctx.fillStyle = "#7c6f64";
    ctx.globalAlpha = 0.8;
    for (let i = 0; i < stones; i++) {
      const angle = rng.float(0, Math.PI * 2);
      const radiusJitter = rng.float(6, 16);
      const offset = rng.float(8, 22);
      const px = Math.cos(angle) * (rx + offset);
      const py = Math.sin(angle) * (ry + offset);
      ctx.beginPath();
      ctx.ellipse(
        px,
        py,
        radiusJitter,
        radiusJitter * rng.float(0.5, 0.9),
        rng.float(0, Math.PI),
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.restore();

    // Driftwood sticks
    ctx.save();
    ctx.strokeStyle = "#6b4f3a";
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.9;
    for (let i = 0; i < sticks; i++) {
      const angleAround = rng.float(0, Math.PI * 2);
      // Tangent direction for stick orientation
      const tangentX = -Math.sin(angleAround) * rx;
      const tangentY = Math.cos(angleAround) * ry;
      const tangentLen = Math.hypot(tangentX, tangentY) || 1;
      const unitX = tangentX / tangentLen;
      const unitY = tangentY / tangentLen;
      const cx = Math.cos(angleAround) * (rx + rng.float(10, 28));
      const cy = Math.sin(angleAround) * (ry + rng.float(10, 28));
      const half = rng.float(8, 20);
      ctx.beginPath();
      ctx.moveTo(cx - unitX * half, cy - unitY * half);
      ctx.lineTo(cx + unitX * half, cy + unitY * half);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawShorePlants(
    ctx: CanvasRenderingContext2D,
    rx: number,
    ry: number,
    biome: Biome,
    waterId: string,
  ): void {
    const rng = createSeededRng(hashStringToInt(`plants-${waterId}`));
    // More reeds in rainforest/fields, palms in archipelago/desert
    const reeds = biome === "rainforest" ? 28 : biome === "fields" ? 18 : 6;
    const palms = biome === "archipelago" ? 10 : biome === "desert" ? 6 : 0;

    // Reeds: tufted lines near water edge
    ctx.save();
    ctx.strokeStyle = "#2f7d2a";
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.9;
    for (let i = 0; i < reeds; i++) {
      const angle = rng.float(0, Math.PI * 2);
      const offset = rng.float(-2, 10); // allow a few slightly inside
      const px = Math.cos(angle) * (rx + offset);
      const py = Math.sin(angle) * (ry + offset);
      const blades = 3 + rng.int(0, 3);
      for (let bladeIndex = 0; bladeIndex < blades; bladeIndex++) {
        const bladeAngle = angle + rng.float(-0.3, 0.3);
        const len = rng.float(8, 18);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(bladeAngle) * len, py + Math.sin(bladeAngle) * len);
        ctx.stroke();
      }
    }
    ctx.restore();

    // Palms: simple trunk + fronds just beyond shore
    if (palms > 0) {
      ctx.save();
      for (let i = 0; i < palms; i++) {
        const angleAround = rng.float(0, Math.PI * 2);
        const px = Math.cos(angleAround) * (rx + rng.float(12, 30));
        const py = Math.sin(angleAround) * (ry + rng.float(12, 30));
        const angle = rng.float(-0.4, 0.4);
        const height = rng.float(14, 26);
        // trunk
        ctx.strokeStyle = "#6b4f3a";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(angle) * height, py + Math.sin(angle) * height);
        ctx.stroke();
        // fronds
        ctx.strokeStyle = "#2f7d2a";
        ctx.lineWidth = 2;
        for (let frondIndex = -2; frondIndex <= 2; frondIndex++) {
          const frondAngle = angle + frondIndex * 0.35 + rng.float(-0.1, 0.1);
          const len = rng.float(10, 16);
          ctx.beginPath();
          ctx.moveTo(px + Math.cos(angle) * height, py + Math.sin(angle) * height);
          ctx.lineTo(
            px + Math.cos(angle) * height + Math.cos(frondAngle) * len,
            py + Math.sin(angle) * height + Math.sin(frondAngle) * len,
          );
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  private renderGroundTexture(ctx: CanvasRenderingContext2D, biome: Biome): void {
    // Use current world transform (already set by GameRenderer)
    const tile = this.getBiomeTile(biome);
    let pattern: CanvasPattern | null = null;
    try {
      pattern = ctx.createPattern(tile, "repeat");
    } catch {
      pattern = null;
    }

    ctx.save();
    if (pattern) {
      ctx.fillStyle = pattern;
    } else {
      // Fallback solid colors if pattern unsupported (test mocks)
      ctx.fillStyle =
        biome === "desert"
          ? "#e6c58f"
          : biome === "rainforest"
            ? "#145a3a"
            : biome === "archipelago"
              ? "#2e77b6"
              : "#5aaa3e";
    }

    // Fill a sufficiently large world-space rect to cover the viewport.
    const worldRect = { x: -2000, y: -2000, w: 4000, h: 4000 };

    ctx.fillRect(worldRect.x, worldRect.y, worldRect.w, worldRect.h);
    ctx.restore();
  }

  // Biome tiles are small procedurally drawn patterns; cached per instance
  private tileCache: Partial<Record<Biome, HTMLCanvasElement>> = {};

  private getBiomeTile(biome: Biome): HTMLCanvasElement {
    const cached = this.tileCache[biome];
    if (cached) return cached;
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return canvas;

    // Base fill
    if (biome === "desert") ctx2d.fillStyle = "#e9d8a6";
    else if (biome === "rainforest") ctx2d.fillStyle = "#145a3a";
    else if (biome === "archipelago") ctx2d.fillStyle = "#2e77b6";
    else ctx2d.fillStyle = "#5aaa3e"; // fields
    ctx2d.fillRect(0, 0, size, size);

    // Texture details
    if (biome === "desert") {
      ctx2d.fillStyle = "#caa66a";
      for (let x = 0; x < size; x += 8) {
        const y = 20 + Math.sin(x * 0.35) * 2;
        ctx2d.fillRect(x, y, 6, 2);
      }
      ctx2d.globalAlpha = 0.06;
      ctx2d.fillStyle = "#fff";
      ctx2d.fillRect(0, 0, size, size);
      ctx2d.globalAlpha = 1;
    } else if (biome === "rainforest") {
      ctx2d.globalAlpha = 0.25;
      ctx2d.fillStyle = "#0f6d44";
      for (let i = 0; i < 12; i++) {
        const radius = 10 + ((i * 7) % 16);
        ctx2d.beginPath();
        ctx2d.ellipse((i * 11) % size, (i * 17) % size, radius, radius * 0.6, 0, 0, Math.PI * 2);
        ctx2d.fill();
      }
      ctx2d.globalAlpha = 1;
    } else if (biome === "fields") {
      ctx2d.strokeStyle = "#2f7d2a";
      ctx2d.globalAlpha = 0.3;
      for (let i = 0; i < size; i += 6) {
        ctx2d.beginPath();
        ctx2d.moveTo(i, size);
        ctx2d.lineTo(i + 1, size - 8 - ((i * 3) % 4));
        ctx2d.stroke();
      }
      ctx2d.globalAlpha = 1;
    } else if (biome === "archipelago") {
      ctx2d.fillStyle = "#e9d8a6";
      for (let i = 0; i < 4; i++) {
        ctx2d.beginPath();
        const px = (i * 13) % size;
        const py = (i * 19) % size;
        ctx2d.ellipse(
          px,
          py,
          8 + (i % 3),
          5 + ((i * 2) % 4),
          (i * 20 * Math.PI) / 180,
          0,
          Math.PI * 2,
        );
        ctx2d.fill();
      }
    }

    this.tileCache[biome] = canvas;
    return canvas;
  }

  // removed unused detail helpers (canopy, rain, grass, dunes, heat haze, islands)
}
