import { describe, it, expect } from "vitest";
import { GameSessionECS } from "./GameSessionECS";

describe("GameSessionECS", () => {
  it("creates default planets and enemies when none provided", () => {
    const session = new GameSessionECS({
      camera: { x: 0, y: 0, zoom: 1 },
      size: { width: 800, height: 600 },
    });

    const counts = session.getEntityCount();
    expect(counts.players).toBe(1);
    expect(counts.planets).toBeGreaterThan(0);
    expect(counts.enemies).toBeGreaterThan(0);

    const planets = session.getPlanets();
    expect(planets.length).toBeGreaterThan(0);
    const player = session.getPlayer();
    expect(player).not.toBeNull();
  });
});
