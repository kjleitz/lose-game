import { StarfieldRenderer } from "./StarfieldRenderer";
import { PlanetRenderer } from "./PlanetRenderer";
import { ShipRenderer } from "./ShipRenderer";
import { CameraTransform } from "./CameraTransform";
import type { Planet } from "../../domain/game/planets";

export class GameRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    player: { x: number; y: number; vx: number; vy: number; angle: number },
    camera: { x: number; y: number; zoom: number },
    planets: Planet[],
    actions: Set<string>,
    size: { width: number; height: number },
    dpr: number,
  ) {
    // Clear to black every frame
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
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

    // Draw ship and thruster
    const shipRenderer = new ShipRenderer();
    shipRenderer.render(ctx, player, actions, 48);

    // FX layer hook for later (particles, etc.)
  }
}
