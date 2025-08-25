import { StarfieldRenderer } from "./StarfieldRenderer";
import { PlanetRenderer } from "./PlanetRenderer";
import { ShipRenderer } from "./ShipRenderer";
import { EnemyRenderer } from "./EnemyRenderer";
import { PlanetSurfaceRenderer } from "./PlanetSurfaceRenderer";
import { CharacterRenderer } from "./CharacterRenderer";
import { CameraTransform } from "./CameraTransform";
import type { Planet } from "../../domain/game/planets";
import type { Enemy } from "../game/enemies";
import type { GameSession } from "../game/GameSession";
import type { PlanetSurface } from "../game/modes/PlanetMode";

export class GameRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    player: { x: number; y: number; vx: number; vy: number; angle: number },
    camera: { x: number; y: number; zoom: number },
    planets: Planet[],
    projectiles: Array<{ x: number; y: number; radius: number }>,
    enemies: Enemy[],
    actions: Set<string>,
    size: { width: number; height: number },
    dpr: number,
    gameSession?: GameSession | null,
  ) {
    // Determine current game mode
    const currentMode = gameSession?.getCurrentModeType() || "space";

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
    player: { x: number; y: number; vx: number; vy: number; angle: number },
    camera: { x: number; y: number; zoom: number },
    planets: Planet[],
    projectiles: Array<{ x: number; y: number; radius: number }>,
    enemies: Enemy[],
    actions: Set<string>,
    size: { width: number; height: number },
    dpr: number,
  ) {
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
      const camL = { x: camera.x * layer.p, y: camera.y * layer.p, zoom: camera.zoom };
      const [la, lb, lc, ld, le, lf] = CameraTransform.getTransform(
        camL,
        size.width,
        size.height,
        dpr,
      );
      ctx.setTransform(la, lb, lc, ld, le, lf);
      starfieldRenderer.render(ctx, camL, size.width, size.height, layer.opts);
    }

    // World entities
    const [a, b, c, d, e, f] = CameraTransform.getTransform(camera, size.width, size.height, dpr);
    ctx.setTransform(a, b, c, d, e, f);

    // Draw planets
    const planetRenderer = new PlanetRenderer();
    planetRenderer.render(ctx, planets, (planet) => planet.radius);

    // Draw enemies beneath ship/projectiles
    const enemyRenderer = new EnemyRenderer();
    enemyRenderer.render(ctx, enemies);

    // Draw ship and thruster
    const shipRenderer = new ShipRenderer();
    shipRenderer.render(ctx, player, actions, 48);

    // Draw projectiles
    ctx.save();
    ctx.fillStyle = "#ffd166";
    for (const p of projectiles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private renderPlanetMode(
    ctx: CanvasRenderingContext2D,
    player: { x: number; y: number; vx: number; vy: number; angle: number },
    camera: { x: number; y: number; zoom: number },
    actions: Set<string>,
    size: { width: number; height: number },
    dpr: number,
    gameSession?: GameSession | null,
  ) {
    // Get planet surface data
    const planetMode = gameSession?.getCurrentMode();
    const surface =
      planetMode?.type === "planet"
        ? (planetMode as { surfaceData?: PlanetSurface }).surfaceData
        : undefined;

    // Planet surface background
    const planetSurfaceRenderer = new PlanetSurfaceRenderer();

    // Set up world transform for planet surface
    const [a, b, c, d, e, f] = CameraTransform.getTransform(camera, size.width, size.height, dpr);
    ctx.setTransform(a, b, c, d, e, f);

    // Render planet surface
    planetSurfaceRenderer.render(ctx, surface);

    // Draw character instead of ship
    const characterRenderer = new CharacterRenderer();
    characterRenderer.render(ctx, player, actions, 32);
  }
}
