import { describe, it, expect, vi } from "vitest";
import { createRenderer } from "./renderer";

describe("createRenderer", () => {
  it("clears the full canvas with identity transform and black fill", () => {
    const ctx: Partial<CanvasRenderingContext2D> = {
      setTransform: vi.fn(),
      fillRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      fillStyle: "",
      canvas: { width: 800, height: 600 } as HTMLCanvasElement,
    };
    const renderer = createRenderer(ctx as CanvasRenderingContext2D);
    renderer.clear();
    expect(ctx.save).toHaveBeenCalledTimes(1);
    expect(ctx.setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0);
    expect(ctx.fillStyle).toBe("#000");
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
    expect(ctx.restore).toHaveBeenCalledTimes(1);
  });
});
