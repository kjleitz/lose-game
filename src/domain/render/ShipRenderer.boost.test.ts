import { describe, expect, it, vi } from "vitest";

// Mock sprites before importing the renderer to intercept calls
const drawShipTriangleMock = vi.fn();
const drawThrusterMock = vi.fn();
vi.mock("./sprites", () => ({
  drawShipTriangle: (...args: unknown[]): void => {
    drawShipTriangleMock(...args);
  },
  drawThruster: (...args: unknown[]): void => {
    drawThrusterMock(...args);
  },
}));

import type { Action } from "../../application/input/ActionTypes";
import { ShipRenderer } from "./ShipRenderer";

describe("ShipRenderer boost thruster scale", () => {
  it("doubles thruster scale when boosting without changing ship alignment", () => {
    const renderer = new ShipRenderer();
    const ctx: Partial<CanvasRenderingContext2D> = {
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      drawImage: () => {},
      globalCompositeOperation: "source-over",
      canvas: { width: 800, height: 600 } as HTMLCanvasElement,
    };
    const player = { x: 0, y: 0, vx: 0, vy: 0, angle: 0 };
    const baseSize = 48;
    const actions = new Set<Action>(["thrust", "boost"]);

    drawThrusterMock.mockClear();
    renderer.render(ctx as CanvasRenderingContext2D, player, actions, baseSize);

    expect(drawThrusterMock).toHaveBeenCalled();
    const lastCall = drawThrusterMock.mock.calls[drawThrusterMock.mock.calls.length - 1];
    // args: (ctx, x, y, angle, size, power, flameMult)
    expect(lastCall[4]).toBe(baseSize);
    expect(typeof lastCall[6]).toBe("number");
    expect(lastCall[6]).toBe(2);
  });
});
