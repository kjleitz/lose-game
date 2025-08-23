import { describe, it, expect } from "vitest";
import { ShipRenderer } from "./ShipRenderer";

describe("ShipRenderer", () => {
  it("can be instantiated", () => {
    const renderer = new ShipRenderer();
    expect(renderer).toBeInstanceOf(ShipRenderer);
  });

  it("render does not throw with mock context and player", () => {
    const renderer = new ShipRenderer();
    const ctx: Partial<CanvasRenderingContext2D> = {
      setTransform: () => {},
      fillRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      fill: () => {},
      stroke: () => {},
      canvas: { width: 800, height: 600 } as HTMLCanvasElement,
    };
    const player = { x: 100, y: 100, vx: 10, vy: 5, angle: Math.PI / 4 };
    const actions = new Set<string>(["thrust"]);
    expect(() =>
      renderer.render(ctx as CanvasRenderingContext2D, player, actions, 48),
    ).not.toThrow();
  });
});
