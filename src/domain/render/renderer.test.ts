import { describe, it, expect } from "vitest";
import { createRenderer } from "./renderer";

describe("createRenderer", () => {
  it("returns a Renderer object with clear method", () => {
    const ctx: Partial<CanvasRenderingContext2D> = {
      setTransform: () => {},
      fillRect: () => {},
      save: () => {},
      restore: () => {},
      fillStyle: "",
      canvas: { width: 800, height: 600 } as HTMLCanvasElement,
    };
    const renderer = createRenderer(ctx as CanvasRenderingContext2D);
    expect(typeof renderer.clear).toBe("function");
    expect(() => renderer.clear()).not.toThrow();
  });
});
