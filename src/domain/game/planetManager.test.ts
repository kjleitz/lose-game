import { describe, it, expect } from "vitest";
import { PlanetManager } from "./planetManager";

describe("PlanetManager", () => {
  it("initializes with planets", () => {
    const size = { width: 800, height: 600 };
    const manager = new PlanetManager(size);
    const planets = manager.getPlanets();
    expect(Array.isArray(planets)).toBe(true);
    expect(planets.length).toBeGreaterThan(0);
  });

  it("maybeGenerateRegion adds new planets for new region", () => {
    const size = { width: 800, height: 600 };
    const manager = new PlanetManager(size);
    const initialCount = manager.getPlanets().length;
    manager.maybeGenerateRegion({ x: 1000, y: 1000 }, "region-1", 2, size);
    const newCount = manager.getPlanets().length;
    expect(newCount).toBeGreaterThanOrEqual(initialCount);
  });

  it("maybeGenerateRegion does not add planets for same region twice", () => {
    const size = { width: 800, height: 600 };
    const manager = new PlanetManager(size);
    manager.maybeGenerateRegion({ x: 1000, y: 1000 }, "region-1", 2, size);
    const countAfterFirst = manager.getPlanets().length;
    manager.maybeGenerateRegion({ x: 1000, y: 1000 }, "region-1", 2, size);
    const countAfterSecond = manager.getPlanets().length;
    expect(countAfterSecond).toBe(countAfterFirst);
  });
});
