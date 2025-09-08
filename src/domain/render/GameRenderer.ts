import type { Action } from "../../application/input/ActionTypes";
import type { Planet } from "../../domain/game/planets";
import type { Circle2D, Kinematics2D, ViewSize } from "../../shared/types/geometry";
import type { EnemyView as Enemy } from "../game/views";
import type { Camera } from "./camera";
import { SpaceModeRenderer } from "./SpaceModeRenderer";
import { PlanetModeRenderer } from "./PlanetModeRenderer";
import { ShipModeRenderer } from "./ShipModeRenderer";
import type { RenderSession } from "./RenderSession";

type MinimalGameSession = RenderSession;

export class GameRenderer {
  private readonly space = new SpaceModeRenderer();
  private readonly planet = new PlanetModeRenderer();
  private readonly ship = new ShipModeRenderer();

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
    gameSession: MinimalGameSession,
  ): void {
    const currentMode = gameSession.getCurrentModeType();

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
        gameSession,
      );
      return;
    }

    if (currentMode === "planet") {
      this.planet.render(ctx, player, camera, actions, size, dpr, gameSession);
      return;
    }

    if (currentMode === "ship") {
      this.ship.render(ctx, player, camera, actions, size, dpr, gameSession);
      return;
    }
  }
}
