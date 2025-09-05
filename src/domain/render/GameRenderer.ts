import type { Action } from "../../application/input/ActionTypes";
import type { Planet } from "../../domain/game/planets";
import type { Circle2D, Kinematics2D, ViewSize } from "../../shared/types/geometry";
import type { PlayerView, EnemyView as Enemy } from "../game/views";
import type { DroppedItem } from "../game/items/DroppedItemSystem";
import type { PlanetSurface } from "../game/planet-surface/types";
import type { Camera } from "./camera";
import { SpaceModeRenderer } from "./SpaceModeRenderer";
import { PlanetModeRenderer } from "./PlanetModeRenderer";

interface MinimalGameSession {
  getCurrentModeType?: (this: MinimalGameSession) => "space" | "planet";
  getPlanetSurface?: () => PlanetSurface | undefined;
  getProjectiles?: () => Array<Circle2D>;
  getDroppedItems?: () => DroppedItem[];
  getEnemies?: () => Enemy[];
  getPlayer?: () => PlayerView | null;
  isInPlanetShip?: () => boolean;
  getInPlanetShipProgress?: () => number;
  getProjectilesDetailed?: () => Array<{
    id: number;
    x: number;
    y: number;
    radius: number;
    vx: number;
    vy: number;
    faction?: "player" | "enemy" | "neutral";
  }>;
  getStars?: () => Array<{ id: string; x: number; y: number; radius: number; color: string }>;
  getStarHeatOverlay?: () => { angle: number; intensity: number } | null;
  getAndClearRenderFxEvents?: () => Array<{ type: "burn"; x: number; y: number }>;
}

export class GameRenderer {
  private readonly space = new SpaceModeRenderer();
  private readonly planet = new PlanetModeRenderer();

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
    let currentMode: "space" | "planet" = "space";
    if (gameSession && typeof gameSession.getCurrentModeType === "function") {
      currentMode = gameSession.getCurrentModeType();
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (currentMode === "space") {
      this.space.render(
        ctx,
        player,
        camera,
        planets,
        projectiles,
        enemies,
        actions,
        size,
        dpr,
        gameSession || undefined,
      );
      return;
    }

    this.planet.render(ctx, player, camera, actions, size, dpr, gameSession || undefined);
  }
}
