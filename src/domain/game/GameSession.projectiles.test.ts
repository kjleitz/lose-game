import { describe, it, expect } from "vitest";
import { GameSession } from "./GameSession";
import { Player } from "./player";

describe("GameSession projectiles", () => {
  it("spawns projectiles when firing and steps them forward", () => {
    const player = new Player({ x: 0, y: 0, vx: 0, vy: 0, angle: 0 });
    const session = new GameSession({
      camera: { x: 0, y: 0, zoom: 1 },
      player,
      planets: [],
      size: { width: 800, height: 600 },
    });
    // First update with fire should spawn a projectile
    session.update(
      new Set(["fire"]),
      () => {},
      () => {},
      0.016,
    );
    expect(session.getProjectiles().length).toBe(1);
    const x0 = session.getProjectiles()[0].x;
    // Step without firing moves projectile
    session.update(
      new Set(),
      () => {},
      () => {},
      0.5,
    );
    expect(session.getProjectiles()[0].x).toBeGreaterThan(x0);
  });
});
