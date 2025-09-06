import { describe, it, expect, vi, beforeEach } from "vitest";

import type { Action } from "../../application/input/ActionTypes";
import type { ViewSize } from "../../shared/types/geometry";
import type { PlayerView } from "../game/views";
import { GameRenderer } from "./GameRenderer";

// Capture aux thruster calls
const drawAuxThrusterMock = vi.fn();

vi.mock("./sprites", async (importOriginal): Promise<Record<string, unknown>> => {
  const actual = await importOriginal<typeof import("./sprites")>();
  return {
    ...actual,
    drawAuxThruster: (...args: unknown[]): void => {
      drawAuxThrusterMock(...args);
    },
  };
});
// Silence starfield rendering to avoid requiring full 2D API mocks
vi.mock(
  "./StarfieldRenderer",
  (): Record<string, unknown> => ({
    StarfieldRenderer: class {
      render(): void {}
    },
  }),
);

function createCtx(): CanvasRenderingContext2D {
  // Minimal mock 2D context sufficient for our render path
  const canvas = { width: 800, height: 600 } as HTMLCanvasElement;
  const ctx: Partial<CanvasRenderingContext2D> = {
    canvas,
    setTransform: () => {},
    clearRect: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
    drawImage: () => {},
    fillRect: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    stroke: () => {},
    fill: () => {},
    // style props used by renderer
    globalCompositeOperation: "source-over",
    lineWidth: 1,
    strokeStyle: "#000",
    fillStyle: "#000",
  };
  return ctx as CanvasRenderingContext2D;
}

describe("Ship aux thrusters rendering", () => {
  const size: ViewSize = { width: 800, height: 600 };
  const dpr = 1;
  const camera = { x: 0, y: 0, zoom: 1 } as const;

  beforeEach(() => {
    drawAuxThrusterMock.mockClear();
  });

  it("draws side thruster when strafing with perk (boost + turnLeft)", () => {
    const renderer = new GameRenderer();
    const ctx = createCtx();
    const player = { x: 0, y: 0, vx: 0, vy: 0, angle: 0 };
    const actions = new Set<Action>(["boost", "turnLeft"]);
    const session = {
      getCurrentModeType: (): "space" => "space" as const,
      getStars: (): [] => [],
      getPlanets: (): [] => [],
      getEnemies: (): [] => [],
      getProjectiles: (): [] => [],
      getEnemyStarHeatOverlays: (): [] => [],
      getPlayer: (): PlayerView => ({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        angle: 0,
        health: 100,
        healthMax: 100,
        experience: 0,
        level: 1,
        xpToNextLevel: 100,
        perkPoints: 0,
        perks: { "thrusters.strafing-thrusters": 1 },
      }),
    };

    renderer.render(ctx, player, camera, [], [], [], actions, size, dpr, session);

    expect(drawAuxThrusterMock).toHaveBeenCalled();
  });

  it("draws front thruster when reversing with perk (moveDown)", () => {
    const renderer = new GameRenderer();
    const ctx = createCtx();
    const player = { x: 0, y: 0, vx: 0, vy: 0, angle: 0 };
    const actions = new Set<Action>(["moveDown"]);
    const session = {
      getCurrentModeType: (): "space" => "space" as const,
      getStars: (): [] => [],
      getPlanets: (): [] => [],
      getEnemies: (): [] => [],
      getProjectiles: (): [] => [],
      getEnemyStarHeatOverlays: (): [] => [],
      getPlayer: (): PlayerView => ({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        angle: 0,
        health: 100,
        healthMax: 100,
        experience: 0,
        level: 1,
        xpToNextLevel: 100,
        perkPoints: 0,
        perks: { "thrusters.reverse-thrusters": 1 },
      }),
    };

    renderer.render(ctx, player, camera, [], [], [], actions, size, dpr, session);

    expect(drawAuxThrusterMock).toHaveBeenCalled();
  });
});
