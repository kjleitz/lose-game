import { describe, expect, it, vi } from "vitest";

import { drawPlanetCanvas } from "./PlanetCanvas";

describe("drawPlanetCanvas", (): void => {
  const basePlanet = {
    id: "p1",
    x: 0,
    y: 0,
    radius: 10,
    color: "#123456",
    design: "solid",
  };
  interface MockCtx {
    save: () => void;
    restore: () => void;
    translate: (x: number, y: number) => void;
    beginPath: () => void;
    arc: (x: number, y: number, r: number, start: number, end: number) => void;
    fill: () => void;
    stroke: () => void;
    ellipse: (
      x: number,
      y: number,
      radiusX: number,
      radiusY: number,
      rotation: number,
      startAngle: number,
      endAngle: number,
    ) => void;
    fillStyle: string;
    strokeStyle: string;
    lineWidth: number;
    globalAlpha: number;
  }

  function getMockCtx(): MockCtx {
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

  it("draws a solid planet", (): void => {
    const ctx = getMockCtx();
    drawPlanetCanvas({
      planet: { ...basePlanet, design: "solid" },
      ctx,
      x: 0,
      y: 0,
      r: 10,
    });
    expect(ctx.arc).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });

  it("draws a ringed planet", (): void => {
    const ctx = getMockCtx();
    drawPlanetCanvas({
      planet: { ...basePlanet, design: "ringed" },
      ctx,
      x: 0,
      y: 0,
      r: 10,
    });
    expect(ctx.ellipse).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it("draws a striped planet", (): void => {
    const ctx = getMockCtx();
    drawPlanetCanvas({
      planet: { ...basePlanet, design: "striped" },
      ctx,
      x: 0,
      y: 0,
      r: 10,
    });
    expect(ctx.arc).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
  });

  it("draws a spotted planet", (): void => {
    const ctx = getMockCtx();
    drawPlanetCanvas({
      planet: { ...basePlanet, design: "spotted" },
      ctx,
      x: 0,
      y: 0,
      r: 10,
    });
    expect(ctx.arc).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
  });
});
