import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Action } from "../../application/input/ActionTypes";
import type { ViewSize } from "../../shared/types/geometry";
import { cameraTransform, type Camera } from "./camera";
import type { Biome } from "../../shared/types/Biome";
import { GameRenderer } from "./GameRenderer";
import type { PlanetSurface } from "../game/planet-surface/types";
import type { DroppedItem } from "../game/items/DroppedItemSystem";
import type { EnemyView as Enemy } from "../game/views";

// Mock projectile drawing to capture transform and size
let lastProjectileCall: {
  ctx: unknown;
  x: number;
  y: number;
  angle: number;
  size: number;
} | null = null;

vi.mock("./sprites", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./sprites")>();
  return {
    ...actual,
    drawProjectile: vi.fn((ctx: unknown, x: number, y: number, angle: number, size: number) => {
      lastProjectileCall = { ctx, x, y, angle, size };
    }),
  };
});

interface MockCtx extends CanvasRenderingContext2D {
  _transform?: [number, number, number, number, number, number];
  _transformHistory: Array<[number, number, number, number, number, number]>;
}

function createMockCtx(): MockCtx {
  const canvas = document.createElement("canvas");
  const ctx: Partial<MockCtx> = {
    canvas,
    // Track transforms
    _transformHistory: [],
    setTransform: vi.fn(function (
      this: MockCtx,
      a: number,
      b: number,
      c: number,
      d: number,
      e: number,
      f: number,
    ): void {
      this._transform = [a, b, c, d, e, f];
      this._transformHistory.push([a, b, c, d, e, f]);
    }) as unknown as MockCtx["setTransform"],
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    ellipse: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    // style props used by renderer
    globalAlpha: 1,
    lineWidth: 1,
    strokeStyle: "#000",
    fillStyle: "#000",
  };
  return ctx as MockCtx;
}

describe("GameRenderer planet projectiles", () => {
  let renderer: GameRenderer;
  let ctx: MockCtx;
  let camera: Camera;
  const actions = new Set<Action>();
  const size: ViewSize = { width: 800, height: 600 };
  const dpr = 1;

  beforeEach(() => {
    renderer = new GameRenderer();
    ctx = createMockCtx();
    camera = { x: 0, y: 0, zoom: 1 };
    lastProjectileCall = null;
  });

  interface TestSession {
    getCurrentModeType: () => "space" | "planet";
    getPlanetSurface: () => PlanetSurface;
    getProjectiles: () => Array<{ x: number; y: number; radius: number }>;
    getDroppedItems: () => DroppedItem[];
    getEnemies: () => Enemy[];
  }

  function makeSession(): TestSession {
    const biomeValue: Biome = "fields";
    return {
      getCurrentModeType: (): "space" | "planet" => "planet",
      getPlanetSurface: (): PlanetSurface => ({
        planetId: "p1",
        landingSite: { x: 0, y: 0 },
        terrain: [],
        resources: [],
        creatures: [],
        biome: biomeValue,
      }),
      getProjectiles: (): Array<{ x: number; y: number; radius: number }> => [
        { x: 100, y: 0, radius: 2 },
      ],
      getDroppedItems: (): DroppedItem[] => [],
      getEnemies: (): Enemy[] => [],
    };
  }

  it("draws planet projectiles using world transform (not parallax)", () => {
    const player = { x: 0, y: 0, vx: 0, vy: 0, angle: 0 };
    const session = makeSession();

    renderer.render(
      ctx as unknown as CanvasRenderingContext2D,
      player,
      camera,
      [],
      [],
      [],
      actions,
      size,
      dpr,
      session,
    );

    // Ensure draw was called
    expect(lastProjectileCall).toBeTruthy();
    // The last setTransform before drawing the projectile should be the world transform
    const expectedWorld = cameraTransform(camera, size.width, size.height, dpr);
    const history = ctx._transformHistory;
    expect(history.length).toBeGreaterThan(0);
    const last = history[history.length - 1];
    expect(last).toEqual(expectedWorld);
  });

  it("renders projectiles with a minimum visible size", () => {
    const player = { x: 0, y: 0, vx: 0, vy: 0, angle: 0 };
    const session = makeSession();

    renderer.render(
      ctx as unknown as CanvasRenderingContext2D,
      player,
      camera,
      [],
      [],
      [],
      actions,
      size,
      dpr,
      session,
    );

    expect(lastProjectileCall).toBeTruthy();
    // Previously radius 2 -> size 4; now we enforce a minimum >= 8
    expect(lastProjectileCall!.size).toBeGreaterThanOrEqual(8);
  });
});
