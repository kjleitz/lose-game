import { describe, it, expect } from "vitest";
import { StarfieldRenderer } from "./StarfieldRenderer";

describe("StarfieldRenderer", () => {
  it("can be instantiated", () => {
    const renderer = new StarfieldRenderer();
    expect(renderer).toBeInstanceOf(StarfieldRenderer);
  });

  it("render does not throw with mock context and camera", () => {
    const renderer = new StarfieldRenderer();
    const ctx: Partial<CanvasRenderingContext2D> = {
      setTransform: () => {},
      fillRect: () => {},
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      stroke: () => {},
      canvas: { width: 800, height: 600 } as HTMLCanvasElement,
    };
    const cam = { x: 0, y: 0, zoom: 1 };
    const viewportWidth = 800;
    const viewportHeight = 600;
    const opts = { starsPerCell: 10, minSize: 0.5, maxSize: 2 };
    expect(() =>
      renderer.render(ctx as CanvasRenderingContext2D, cam, viewportWidth, viewportHeight, opts),
    ).not.toThrow();
  });
});
