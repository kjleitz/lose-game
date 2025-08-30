import type { Action } from "../../application/input/ActionTypes";
import type { Planet } from "../../domain/game/planets";
import type { Biome } from "../../shared/types/Biome";
import type { Circle2D, Kinematics2D, ViewSize } from "../../shared/types/geometry";
import { createSeededRng, hashStringToInt } from "../../shared/utils";
import type { Enemy } from "../game/enemies";
import type { DroppedItem } from "../game/items/DroppedItemSystem";
import type { PlanetSurface } from "../game/planet-surface/types";
import type { Camera } from "./camera";
import { CameraTransform } from "./CameraTransform";
import { CharacterRenderer } from "./CharacterRenderer";
import { CreatureRenderer } from "./CreatureRenderer";
import { DroppedItemRenderer } from "./DroppedItemRenderer";
import { EnemyRenderer } from "./EnemyRenderer";
import { PlanetRenderer } from "./PlanetRenderer";
import { PlanetSurfaceRenderer } from "./PlanetSurfaceRenderer";
import { ShipRenderer } from "./ShipRenderer";
import { drawProjectile } from "./sprites";
import { StarfieldRenderer } from "./StarfieldRenderer";
import { getVisualConfig } from "./VisualConfig";

// Legacy modes removed from renderer path; rely on session getters only

interface MinimalGameSession {
  getCurrentModeType?: (this: MinimalGameSession) => "space" | "planet";
  getPlanetSurface?: () => PlanetSurface | undefined;
  getProjectiles?: () => Array<Circle2D>;
  getDroppedItems?: () => DroppedItem[];
  getEnemies?: () => Enemy[];
}

export class GameRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    player: Kinematics2D,
    camera: Camera,
    planets: Planet[],
    projectiles: Array<Circle2D>,
    enemies: Enemy[],
    actions: Set<Action>,
    size: ViewSize,
    dpr: number,
    gameSession?: MinimalGameSession | null,
  ): void {
    // Determine current game mode (avoid unbound method call)
    let currentMode: "space" | "planet" = "space";
    if (gameSession && typeof gameSession.getCurrentModeType === "function") {
      currentMode = gameSession.getCurrentModeType();
    }

    // Clear screen
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (currentMode === "space") {
      this.renderSpaceMode(ctx, player, camera, planets, projectiles, enemies, actions, size, dpr);
    } else if (currentMode === "planet") {
      this.renderPlanetMode(ctx, player, camera, actions, size, dpr, gameSession);
    }

    // FX layer hook for later (particles, etc.)
  }

  private renderSpaceMode(
    ctx: CanvasRenderingContext2D,
    player: Kinematics2D,
    camera: Camera,
    planets: Planet[],
    projectiles: Array<Circle2D>,
    enemies: Enemy[],
    actions: Set<Action>,
    size: ViewSize,
    dpr: number,
  ): void {
    // Black space background
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Starfield layers
    const starfieldRenderer = new StarfieldRenderer();
    const layers = [
      { p: 0.4, opts: { starsPerCell: 10, minSize: 0.6, maxSize: 2 } },
      { p: 0.8, opts: { starsPerCell: 6, minSize: 0.4, maxSize: 1.2 } },
    ];
    for (const layer of layers) {
      const camLayer = { x: camera.x * layer.p, y: camera.y * layer.p, zoom: camera.zoom };
      const [m11L, m12L, m21L, m22L, dxL, dyL] = CameraTransform.getTransform(
        camLayer,
        size.width,
        size.height,
        dpr,
      );
      ctx.setTransform(m11L, m12L, m21L, m22L, dxL, dyL);
      starfieldRenderer.render(ctx, camLayer, size.width, size.height, layer.opts);
    }

    // World entities
    const [m11, m12, m21, m22, dx, dy] = CameraTransform.getTransform(
      camera,
      size.width,
      size.height,
      dpr,
    );
    ctx.setTransform(m11, m12, m21, m22, dx, dy);

    // Draw planets
    const planetRenderer = new PlanetRenderer();
    planetRenderer.render(ctx, planets, (planet) => planet.radius);

    // Draw enemies beneath ship/projectiles
    const enemyRenderer = new EnemyRenderer();
    enemyRenderer.render(ctx, enemies);

    // Draw ship and thruster
    const shipRenderer = new ShipRenderer();
    shipRenderer.render(ctx, player, actions, 48);

    // Draw projectiles with sprite
    for (const projectile of projectiles) {
      const angle = 0; // space bullets are drawn without heading for now
      drawProjectile(ctx, projectile.x, projectile.y, angle, projectile.radius * 2);
    }
  }

  private renderPlanetMode(
    ctx: CanvasRenderingContext2D,
    player: Kinematics2D,
    camera: Camera,
    actions: Set<Action>,
    size: ViewSize,
    dpr: number,
    gameSession?: MinimalGameSession | null,
  ): void {
    // Ask session for surface (ECS path)
    let surface: PlanetSurface | undefined = undefined;
    if (gameSession && typeof gameSession.getPlanetSurface === "function")
      surface = gameSession.getPlanetSurface();

    // Planet surface background
    const planetSurfaceRenderer = new PlanetSurfaceRenderer();

    // Set up world transform for planet surface
    const [m11P, m12P, m21P, m22P, dxP, dyP] = CameraTransform.getTransform(
      camera,
      size.width,
      size.height,
      dpr,
    );
    ctx.setTransform(m11P, m12P, m21P, m22P, dxP, dyP);

    // Render planet surface (must be provided by mode or session)
    planetSurfaceRenderer.render(ctx, surface);

    // Beneath-water parallax (archipelago-only), subtle and below entities
    if (surface && surface.biome === "archipelago") {
      this.renderUnderwaterParallax(ctx, camera, size, dpr);
    }

    // Death effects omitted in ECS path for now

    // Draw dropped items (behind characters but above death effects)
    const droppedItemRenderer = new DroppedItemRenderer();
    if (gameSession && typeof gameSession.getDroppedItems === "function") {
      const items = gameSession.getDroppedItems();
      if (Array.isArray(items) && items.length > 0) {
        droppedItemRenderer.render(ctx, items);
      }
    }

    // Draw character and enemies
    const characterRenderer = new CharacterRenderer();
    const creatureRenderer = new CreatureRenderer();
    if (gameSession && typeof gameSession.getEnemies === "function") {
      const enemies = gameSession.getEnemies();
      creatureRenderer.render(ctx, enemies);
    }
    characterRenderer.render(ctx, player, actions, 32);

    // Above-ground parallax: clouds and birds
    if (surface) {
      const biome: Biome = surface.biome ?? "fields";
      this.renderSkyParallax(ctx, camera, size, dpr, biome, surface.planetId);
    }

    // Draw projectiles provided by session (ECS path)
    if (gameSession && typeof gameSession.getProjectiles === "function") {
      // ECS path: render projectiles provided by session
      const sessionProjectiles = gameSession.getProjectiles();
      if (Array.isArray(sessionProjectiles) && sessionProjectiles.length > 0) {
        for (const projectile of sessionProjectiles) {
          drawProjectile(ctx, projectile.x, projectile.y, 0, projectile.radius * 2);
        }
      }
    }
  }

  private renderUnderwaterParallax(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    size: ViewSize,
    dpr: number,
  ): void {
    const factor = 0.7;
    const camL = { x: camera.x * factor, y: camera.y * factor, zoom: camera.zoom };
    const [m11U, m12U, m21U, m22U, dxU, dyU] = CameraTransform.getTransform(
      camL,
      size.width,
      size.height,
      dpr,
    );
    ctx.setTransform(m11U, m12U, m21U, m22U, dxU, dyU);

    const widthPx = size.width;
    const heightPx = size.height;
    const timeSec = Date.now() * 0.001;
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 6; i++) {
      const y = (i + 1) * (heightPx / 8) + Math.sin(timeSec + i) * 10;
      ctx.fillRect(-widthPx, y, widthPx * 3, 8);
    }
    ctx.restore();
  }

  private renderSkyParallax(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    size: ViewSize,
    dpr: number,
    biome: Biome,
    planetId: string,
  ): void {
    const factor = 0.6;
    const camL = { x: camera.x * factor, y: camera.y * factor, zoom: camera.zoom };
    const [m11S, m12S, m21S, m22S, dxS, dyS] = CameraTransform.getTransform(
      camL,
      size.width,
      size.height,
      dpr,
    );
    ctx.setTransform(m11S, m12S, m21S, m22S, dxS, dyS);

    const widthPx = size.width;
    const heightPx = size.height;
    const seed = hashStringToInt(planetId);
    const rng = createSeededRng(seed);

    // Clouds: soft ellipses
    ctx.save();
    ctx.globalAlpha = biome === "desert" ? 0.15 : 0.22;
    ctx.fillStyle = "#ffffff";
    const cfg = getVisualConfig();
    const baseClouds = biome === "rainforest" ? 10 : 6;
    const cloudCount = Math.max(0, Math.floor(baseClouds * cfg.cloudDensity));
    const timeMs = Date.now() * 0.0003;
    for (let i = 0; i < cloudCount; i++) {
      const baseX = (rng.int(0, widthPx) + i * 123) % (widthPx * 2);
      const baseY = (rng.int(0, Math.floor(heightPx / 2)) + i * 47) % Math.floor(heightPx * 0.6);
      const drift = (timeMs * (20 + (i % 5))) % (widthPx * 2);
      const x = -widthPx + baseX + drift;
      const y = baseY * 0.5;
      ctx.beginPath();
      ctx.ellipse(x, y, 80, 35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + 40, y + 5, 50, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x - 35, y + 8, 45, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Birds: small chevrons drifting
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 1;
    const baseFlocks = biome === "rainforest" || biome === "fields" ? 3 : 1;
    const birdFlocks = Math.max(0, Math.floor(baseFlocks * cfg.birdDensity));
    for (let i = 0; i < birdFlocks; i++) {
      const baseX = (rng.int(0, widthPx) + i * 177) % (widthPx * 2);
      const baseY = (rng.int(0, Math.floor(heightPx / 2)) + i * 59) % Math.floor(heightPx * 0.5);
      const drift = (timeMs * 120 + i * 60) % (widthPx * 2);
      const x = -widthPx + baseX + drift;
      const y = 40 + baseY * 0.6;
      for (let bI = 0; bI < 5; bI++) {
        const bx = x + bI * 16;
        const by = y + Math.sin(timeMs * 8 + bI) * 3;
        ctx.beginPath();
        ctx.moveTo(bx - 4, by);
        ctx.lineTo(bx, by + 3);
        ctx.lineTo(bx + 4, by);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}
