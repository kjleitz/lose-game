import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Action } from "../../application/input/ActionTypes";
import type { ViewSize } from "../../shared/types/geometry";
import { cameraTransform, type Camera } from "./camera";
import type { Biome } from "../../shared/types/Biome";
import { GameRenderer } from "./GameRenderer";
import type { PlanetSurface } from "../game/planet-surface/types";
import type { DroppedItem } from "../game/items/DroppedItemSystem";
import type { EnemyView as Enemy, PlayerView } from "../game/views";

// Mock projectile drawing to capture transform and size
let lastProjectileCall: {
  ctx: unknown;
  x: number;
  y: number;
  angle: number;
  size: number;
} | null = null;

let lastArcCall: { x: number; y: number; r: number } | null = null;
let strokes: Array<{
  strokeStyle: unknown;
  lineWidth: number;
  arc?: { x: number; y: number; r: number };
}> = [];

vi.mock("./sprites", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./sprites")>();
  return {
    ...actual,
    drawProjectile: vi.fn((ctx: unknown, x: number, y: number, angle: number, size: number) => {
      lastProjectileCall = { ctx, x, y, angle, size };
    }),
  };
});

// Remove noise from starfield and other renderers that might use arcs/strokes
vi.mock("./StarfieldRenderer", () => ({
  StarfieldRenderer: class {
    render(): void {}
  },
}));
vi.mock("./PlanetRenderer", () => ({
  PlanetRenderer: class {
    render(): void {}
  },
}));
vi.mock("./EnemyRenderer", () => ({
  EnemyRenderer: class {
    render(): void {}
  },
}));

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
    arc: vi.fn((x: number, y: number, r: number) => {
      lastArcCall = { x, y, r };
    }) as unknown as MockCtx["arc"],
    fill: vi.fn(),
    stroke: vi.fn(function (this: MockCtx): void {
      strokes.push({
        strokeStyle: this.strokeStyle,
        lineWidth: this.lineWidth,
        arc: lastArcCall ? { ...lastArcCall } : undefined,
      });
    }) as unknown as MockCtx["stroke"],
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
    lastArcCall = null;
    strokes = [];
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

describe("GameRenderer player hit ring", () => {
  let renderer: GameRenderer;
  let ctx: MockCtx;
  const size: ViewSize = { width: 800, height: 600 };
  const dpr = 1;

  beforeEach(() => {
    renderer = new GameRenderer();
    ctx = createMockCtx();
    lastArcCall = null;
  });

  it("draws hit ring in space when hitFlash present", () => {
    const player = { x: 10, y: -20, vx: 0, vy: 0, angle: 0 };
    const camera: Camera = { x: 0, y: 0, zoom: 1 };
    const actions = new Set<Action>();
    const baseSession = { getCurrentModeType: (): "space" => "space" as const };
    const sessionNoHit = {
      ...baseSession,
      getPlayer: (): PlayerView => ({
        x: player.x,
        y: player.y,
        vx: 0,
        vy: 0,
        angle: 0,
        health: 100,
        healthMax: 100,
        experience: 0,
        level: 1,
        xpToNextLevel: 100,
        perkPoints: 0,
        perks: {},
      }),
    };
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
      sessionNoHit,
    );
    // reset tracking to isolate second render
    strokes = [];
    lastArcCall = null;
    const sessionHit = {
      ...baseSession,
      getPlayer: (): PlayerView => ({
        x: player.x,
        y: player.y,
        vx: 0,
        vy: 0,
        angle: 0,
        health: 100,
        healthMax: 100,
        experience: 0,
        level: 1,
        xpToNextLevel: 100,
        perkPoints: 0,
        perks: {},
        hitFlash: { progress: 0.2 },
      }),
    };
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
      sessionHit,
    );
    // Expect at least one stroked arc when hit is present
    expect(strokes.length).toBeGreaterThanOrEqual(1);
    const ring = strokes.find((s) => s.arc);
    expect(ring).toBeTruthy();
  });

  it("draws hit ring on planet when hitFlash present", () => {
    const player = { x: 5, y: 7, vx: 0, vy: 0, angle: 0 };
    const camera: Camera = { x: 0, y: 0, zoom: 1 };
    const actions = new Set<Action>();
    const session = {
      getCurrentModeType: (): "planet" => "planet" as const,
      getPlanetSurface: (): PlanetSurface => ({
        planetId: "p1",
        landingSite: { x: 0, y: 0 },
        terrain: [],
        resources: [],
        creatures: [],
        biome: "fields" as Biome,
      }),
      getDroppedItems: (): DroppedItem[] => [],
      getEnemies: (): Enemy[] => [],
      getProjectiles: (): Array<{ x: number; y: number; radius: number }> => [],
      isInPlanetShip: (): boolean => false,
      getPlayer: (): PlayerView => ({
        x: player.x,
        y: player.y,
        vx: 0,
        vy: 0,
        angle: 0,
        health: 100,
        healthMax: 100,
        experience: 0,
        level: 1,
        xpToNextLevel: 100,
        perkPoints: 0,
        perks: {},
        hitFlash: { progress: 0.2 },
      }),
    };

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

    const ring = strokes.find((s) => s.arc && Math.abs(s.arc.r - 26) < 0.5);
    expect(ring).toBeTruthy();
    expect(ring!.arc).toBeTruthy();
    expect(ring!.arc!.x).toBeCloseTo(player.x, 1);
    expect(ring!.arc!.y).toBeCloseTo(player.y, 1);
    expect(ring!.arc!.r).toBeCloseTo(26, 1);
  });
});
