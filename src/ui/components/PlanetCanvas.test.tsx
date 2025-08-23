import { describe, it, expect, vi } from "vitest";
import { drawPlanetCanvas } from "./PlanetCanvas";

describe("drawPlanetCanvas", () => {
  const basePlanet = {
    id: "p1",
    x: 0,
    y: 0,
    radius: 10,
    color: "#123456",
    design: "solid",
  };
  function getMockCtx() {
    return {
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      ellipse: vi.fn(),
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 0,
      globalAlpha: 1,
    };
  }

  it("draws a solid planet", () => {
    const ctx = getMockCtx();
    drawPlanetCanvas({
      planet: { ...basePlanet, design: "solid" },
      ctx: ctx as unknown as CanvasRenderingContext2D,
      x: 0,
      y: 0,
      r: 10,
    });
    expect(ctx.arc).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });

  it("draws a ringed planet", () => {
    const ctx = getMockCtx();
    drawPlanetCanvas({
      planet: { ...basePlanet, design: "ringed" },
      ctx: ctx as unknown as CanvasRenderingContext2D,
      x: 0,
      y: 0,
      r: 10,
    });
    expect(ctx.ellipse).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it("draws a striped planet", () => {
    const ctx = getMockCtx();
    drawPlanetCanvas({
      planet: { ...basePlanet, design: "striped" },
      ctx: ctx as unknown as CanvasRenderingContext2D,
      x: 0,
      y: 0,
      r: 10,
    });
    expect(ctx.arc).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
  });

  it("draws a spotted planet", () => {
    const ctx = getMockCtx();
    drawPlanetCanvas({
      planet: { ...basePlanet, design: "spotted" },
      ctx: ctx as unknown as CanvasRenderingContext2D,
      x: 0,
      y: 0,
      r: 10,
    });
    expect(ctx.arc).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
  });
});
