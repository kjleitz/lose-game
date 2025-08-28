import { StarfieldRenderer } from "./StarfieldRenderer";
import { PlanetRenderer } from "./PlanetRenderer";
import { ShipRenderer } from "./ShipRenderer";
import { EnemyRenderer } from "./EnemyRenderer";
import { CreatureRenderer } from "./CreatureRenderer";
import { PlanetSurfaceRenderer } from "./PlanetSurfaceRenderer";
import { CharacterRenderer } from "./CharacterRenderer";
import { DroppedItemRenderer } from "./DroppedItemRenderer";
import { WeaponSystem } from "../game/weapons/WeaponSystem";
import { EntityDeathRenderer } from "./EntityDeathRenderer";
import { DroppedItemSystem } from "../game/items/DroppedItemSystem";
import { PlanetMode } from "../game/modes/PlanetMode";
import { CameraTransform } from "./CameraTransform";
import type { Planet } from "../../domain/game/planets";
import type { Enemy } from "../game/enemies";
import type { PlanetSurface } from "../game/modes/PlanetMode";
import type { DroppedItem } from "../game/items/DroppedItemSystem";
import type { Kinematics2D, Circle2D, ViewSize } from "../../shared/types/geometry";
import type { Camera } from "./camera";
import type { Action } from "../../engine/input/ActionTypes";
import { drawProjectile } from "./sprites";

import type { GameMode } from "../game/modes/GameMode";
import type { SpaceMode } from "../game/modes/SpaceMode";

interface MinimalGameSession {
  getCurrentModeType?: (this: MinimalGameSession) => "space" | "planet";
  getCurrentMode?: () => GameMode | SpaceMode | PlanetMode;
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

    // Draw projectiles with sprite
    for (const p of projectiles) {
      const angle = 0; // space bullets are drawn without heading for now
      drawProjectile(ctx, p.x, p.y, angle, p.radius * 2);
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
    // Get planet mode and related systems (guarded introspection)
    const planetMode =
      typeof gameSession?.getCurrentMode === "function" ? gameSession.getCurrentMode() : undefined;
    let surface: PlanetSurface | undefined =
      planetMode instanceof PlanetMode ? planetMode.getSurfaceData() : undefined;
    // Prefer session-provided surface if available (ECS path)
    if (gameSession && typeof gameSession.getPlanetSurface === "function") {
      const s = gameSession.getPlanetSurface();
      if (s) surface = s;
    }
    const weaponSystem = this.getWeaponSystem(planetMode);

    // Planet surface background
    const planetSurfaceRenderer = new PlanetSurfaceRenderer();

    // Set up world transform for planet surface
    const [a, b, c, d, e, f] = CameraTransform.getTransform(camera, size.width, size.height, dpr);
    ctx.setTransform(a, b, c, d, e, f);

    // Render planet surface (must be provided by mode or session)
    planetSurfaceRenderer.render(ctx, surface);

    // Draw death effects first (behind everything)
    const deathRenderer = this.getDeathRenderer(planetMode);
    if (deathRenderer) deathRenderer.render(ctx);

    // Draw dropped items (behind characters but above death effects)
    const droppedItemSystem = this.getDroppedItemSystem(planetMode);
    const droppedItemRenderer = new DroppedItemRenderer();
    if (droppedItemSystem) {
      droppedItemRenderer.render(ctx, droppedItemSystem.getAllDroppedItems());
    } else if (gameSession && typeof gameSession.getDroppedItems === "function") {
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

    // Draw projectiles from weapon system (classic PlanetMode) or ECS session
    if (weaponSystem) {
      const projectiles = weaponSystem.getAllProjectiles();
      for (const p of projectiles) {
        const ang = Math.atan2(p.vy, p.vx);
        drawProjectile(ctx, p.x, p.y, ang, 10);
      }
    } else if (gameSession && typeof gameSession.getProjectiles === "function") {
      // ECS path: render projectiles provided by session
      const ecsProjectiles = gameSession.getProjectiles();
      if (Array.isArray(ecsProjectiles) && ecsProjectiles.length > 0) {
        for (const p of ecsProjectiles) {
          drawProjectile(ctx, p.x, p.y, 0, p.radius * 2);
        }
      }
    }
  }

  private getWeaponSystem(
    planetMode: GameMode | SpaceMode | PlanetMode | undefined,
  ): WeaponSystem | null {
    return planetMode instanceof PlanetMode ? planetMode.getWeaponSystemData() : null;
  }

  private getDeathRenderer(
    planetMode: GameMode | SpaceMode | PlanetMode | undefined,
  ): EntityDeathRenderer | null {
    return planetMode instanceof PlanetMode ? planetMode.getDeathRenderer() : null;
  }

  private getDroppedItemSystem(
    planetMode: GameMode | SpaceMode | PlanetMode | undefined,
  ): DroppedItemSystem | null {
    return planetMode instanceof PlanetMode ? planetMode.getDroppedItemSystem() : null;
  }
}
