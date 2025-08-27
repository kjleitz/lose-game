import { describe, it, expect } from "vitest";
import { GameSession } from "./GameSession";
import { Player } from "./player";
import { createEnemy } from "./enemies";

describe("GameSession enemies", () => {
  it("projectiles damage enemies and destroy them on zero health", () => {
    const player = new Player({ x: 0, y: 0, vx: 0, vy: 0, angle: 0 });
    const enemy = createEnemy("tgt", 60, 0, 10, 10);
    const session = new GameSession({
      camera: { x: 0, y: 0, zoom: 1 },
      player,
      planets: [],
      size: { width: 800, height: 600 },
      enemies: [enemy],
    });
    // Fire to spawn a projectile heading +x
    session.update(
      new Set(["fire"]),
      () => {},
      () => {},
      0.016,
    );
    expect(session.getProjectiles().length).toBe(1);
    // Advance until hit
    for (let i = 0; i < 10; i++)
      session.update(
        new Set(),
        () => {},
        () => {},
        0.05,
      );
    expect(session.getEnemies().length).toBe(0);
    expect(player.state.experience ?? 0).toBeGreaterThanOrEqual(5);
  });
});
