import { describe, it, expect } from "vitest";
import { PlanetRenderer } from "./PlanetRenderer";
import type { Planet } from "../game/planets";

describe("PlanetRenderer", () => {
  it("can be instantiated", () => {
    const renderer = new PlanetRenderer();
    expect(renderer).toBeInstanceOf(PlanetRenderer);
  });

  it("render does not throw with mock context and planets", () => {
    const renderer = new PlanetRenderer();
    const ctx: Partial<CanvasRenderingContext2D> = {
      // No-op for required methods
      setTransform: () => {},
      fillRect: () => {},
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      stroke: () => {},
      canvas: { width: 800, height: 600 } as HTMLCanvasElement,
    };
    const planets: Planet[] = [
      { id: "p1", x: 100, y: 100, radius: 50, color: "#fff", design: "solid" },
    ];
    const getRadius = (planet: Planet) => planet.radius;
    expect(() =>
      renderer.render(ctx as CanvasRenderingContext2D, planets, getRadius),
    ).not.toThrow();
  });
});
