import { describe, it, expect } from "vitest";
import { generatePlanets } from "./planets";

describe("generatePlanets", () => {
  it("returns an array of Planet objects", () => {
    const planets = generatePlanets({ count: 5, screenW: 800, screenH: 600 });
    expect(Array.isArray(planets)).toBe(true);
    expect(planets.length).toBe(5);
    planets.forEach((planet) => {
      expect(typeof planet.id).toBe("string");
      expect(typeof planet.x).toBe("number");
      expect(typeof planet.y).toBe("number");
      expect(typeof planet.radius).toBe("number");
      expect(typeof planet.color).toBe("string");
      expect(["solid", "ringed", "striped", "spotted"]).toContain(planet.design);
    });
  });

  it("returns different planets for different centers", () => {
    const planetsA = generatePlanets({
      count: 3,
      screenW: 800,
      screenH: 600,
      center: { x: 0, y: 0 },
    });
    const planetsB = generatePlanets({
      count: 3,
      screenW: 800,
      screenH: 600,
      center: { x: 1000, y: 1000 },
    });
    expect(planetsA.map((p) => p.id)).not.toEqual(planetsB.map((p) => p.id));
  });
});
