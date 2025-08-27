import { describe, it, expect } from "vitest";
import { GameRenderer } from "./GameRenderer";
import type { PlanetSurface } from "../game/modes/PlanetMode";
import type { Planet } from "../../domain/game/planets";
import type { Enemy } from "../game/enemies";
import type { Circle2D } from "../../shared/types/geometry";
import type { Action } from "../../engine/input/ActionTypes";

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
      ellipse: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      fill: () => {},
      stroke: () => {},
      strokeRect: () => {},
      canvas: { width: 800, height: 600 } as HTMLCanvasElement,
    };
    const player = { x: 0, y: 0, vx: 0, vy: 0, angle: 0 };
    const camera = { x: 0, y: 0, zoom: 1 };
    const planets: Planet[] = [];
    const actions = new Set<Action>();
    const projectiles: Circle2D[] = [];
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

  it("uses bound method for mode detection (no unbound this crash)", () => {
    const renderer = new GameRenderer();
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
    const size = { width: 800, height: 600 };
    const sessionLike = {
      mode: "space" as "space" | "planet",
      getCurrentModeType(): "space" | "planet" {
        // relies on this binding; would crash if unbound
        return this.mode;
      },
    };
    expect(() =>
      renderer.render(
        ctx as CanvasRenderingContext2D,
        player,
        camera,
        [],
        [],
        [],
        new Set(),
        size,
        1,
        sessionLike,
      ),
    ).not.toThrow();
  });

  it("renders planet surface when session provides one", () => {
    const renderer = new GameRenderer();
    let drew = 0;
    const ctx: Partial<CanvasRenderingContext2D> = {
      setTransform: () => {},
      clearRect: () => {},
      fillRect: () => {
        drew += 1;
      },
      fillStyle: "",
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      arc: () => {},
      ellipse: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      fill: () => {},
      stroke: () => {},
      strokeRect: () => {},
      translate: () => {},
      rotate: () => {},
      canvas: { width: 800, height: 600 } as HTMLCanvasElement,
    };
    const player = { x: 0, y: 0, vx: 0, vy: 0, angle: 0 };
    const camera = { x: 0, y: 0, zoom: 1 };
    const size = { width: 800, height: 600 };
    const sessionLike: {
      getCurrentModeType: () => "planet";
      getPlanetSurface: () => PlanetSurface;
    } = {
      getCurrentModeType: () => "planet",
      getPlanetSurface: (): PlanetSurface => ({
        planetId: "p1",
        landingSite: { x: 0, y: 0 },
        terrain: [{ id: "t1", x: 10, y: 10, type: "rock", size: 20 }],
        resources: [],
        creatures: [],
      }),
    };

    expect(() =>
      renderer.render(
        ctx as CanvasRenderingContext2D,
        player,
        camera,
        [],
        [],
        [],
        new Set(),
        size,
        1,
        sessionLike,
      ),
    ).not.toThrow();
    expect(drew).toBeGreaterThan(0);
  });
});
