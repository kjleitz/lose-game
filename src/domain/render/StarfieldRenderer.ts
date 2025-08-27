import { drawStarfield } from "./starfield";
import type { StarfieldOptions } from "./starfield";
import type { Camera } from "./camera";

export class StarfieldRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    cam: Camera,
    viewportWidth: number,
    viewportHeight: number,
    opts: StarfieldOptions = {},
  ): void {
    drawStarfield(ctx, cam, viewportWidth, viewportHeight, opts);
  }
}
