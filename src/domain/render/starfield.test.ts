import { describe, it, expect } from "vitest";
import { drawStarfield } from "./starfield";

describe("drawStarfield", () => {
  it("does not throw with mock context and camera", () => {
    const ctx: Partial<CanvasRenderingContext2D> = {
      save: () => {},
      restore: () => {},
      fillStyle: "",
      globalAlpha: 1,
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      canvas: { width: 800, height: 600 } as HTMLCanvasElement,
    };
    const cam = { x: 0, y: 0, zoom: 1 };
    expect(() => drawStarfield(ctx as CanvasRenderingContext2D, cam, 800, 600)).not.toThrow();
  });
});
