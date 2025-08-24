import { describe, it, expect } from "vitest";
import { GameRenderer } from "./GameRenderer";
import type { Planet } from "../../domain/game/planets";
import type { Enemy } from "../game/enemies";

describe("GameRenderer", () => {
  it("can be instantiated", () => {
    const renderer = new GameRenderer();
    expect(renderer).toBeInstanceOf(GameRenderer);
  });

  it("render does not throw with mock context", () => {
    const renderer = new GameRenderer();
    // Mock CanvasRenderingContext2D
    const ctx: Partial<CanvasRenderingContext2D> = {
      setTransform: () => {},
      clearRect: () => {},
      fillRect: () => {},
      fillStyle: "",
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      stroke: () => {},
      canvas: { width: 800, height: 600 } as HTMLCanvasElement,
    };
    const player = { x: 0, y: 0, vx: 0, vy: 0, angle: 0 };
    const camera = { x: 0, y: 0, zoom: 1 };
    const planets: Planet[] = [];
    const actions = new Set<string>();
    const projectiles: Array<{ x: number; y: number; radius: number }> = [];
    const enemies: Enemy[] = [];
    const size = { width: 800, height: 600 };
    const dpr = 1;
    expect(() =>
      renderer.render(
        ctx as CanvasRenderingContext2D,
        player,
        camera,
        planets,
        projectiles,
        enemies,
        actions,
        size,
        dpr,
      ),
    ).not.toThrow();
  });
});
