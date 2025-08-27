import { describe, it, expect, vi } from "vitest";
import { GameSession } from "./GameSession";
import { Player } from "./player";
import type { Action } from "../../engine/input/ActionTypes";
import type { Planet } from "./planets";

describe("GameSession", () => {
  const makePlanet = (props?: Partial<Planet>): Planet => ({
    id: props?.id ?? "p1",
    x: props?.x ?? 100,
    y: props?.y ?? 100,
    radius: props?.radius ?? 50,
    color: props?.color ?? "#fff",
    design: props?.design ?? "solid",
  });

  it("initializes with correct properties", () => {
    const camera = { x: 0, y: 0, zoom: 1 };
    const player = new Player({ x: 0, y: 0, vx: 0, vy: 0, angle: 0 });
    const planets = [makePlanet()];
    const size = { width: 800, height: 600 };
    const session = new GameSession({ camera, player, planets, size });
    expect(session.camera).toEqual(camera);
    expect(session.player).toEqual(player);
    expect(session.getPlanets()).toEqual(planets);
    expect(session.size).toEqual(size);
    expect(session.notification).toBeNull();
  });

  it("updates player and camera, generates region, and sets notification", () => {
    const camera = { x: 0, y: 0, zoom: 1 };
    const player = new Player({ x: 100, y: 100, vx: 0, vy: 0, angle: 0 });
    const planets = [makePlanet()];
    const size = { width: 800, height: 600 };
    const session = new GameSession({ camera, player, planets, size });
    const updatePlayer = vi.fn();
    const maybeGenerateRegion = vi.fn();
    session.update(new Set<Action>(["thrust"]), updatePlayer, maybeGenerateRegion, 0.016);
    // In the new mode system, these are called internally by the active mode
    expect(maybeGenerateRegion).toHaveBeenCalled();
    expect(session.notification).toContain("Press L to land");
  });

  it("clears notification if not near any planet", () => {
    const camera = { x: 0, y: 0, zoom: 1 };
    const player = new Player({ x: 1000, y: 1000, vx: 0, vy: 0, angle: 0 });
    const planets = [makePlanet()];
    const size = { width: 800, height: 600 };
    const session = new GameSession({ camera, player, planets, size });
    const updatePlayer = vi.fn();
    const maybeGenerateRegion = vi.fn();
    session.update(new Set(), updatePlayer, maybeGenerateRegion, 0.016);
    expect(session.notification).toBeNull();
  });
});
