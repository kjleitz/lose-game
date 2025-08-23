import { describe, it, expect } from "vitest";
import { shouldPlacePlanet, generatePlanet } from "./planetGenerator";

describe("shouldPlacePlanet", () => {
  it("returns a boolean", () => {
    const result = shouldPlacePlanet(100, 200, 50);
    expect(typeof result).toBe("boolean");
  });

  it("returns true or false based on noise", () => {
    // Should be deterministic for same input
    const a = shouldPlacePlanet(100, 200, 50);
    const b = shouldPlacePlanet(100, 200, 50);
    expect(a).toBe(b);
  });
});

describe("generatePlanet", () => {
  it("returns planet data with expected properties", () => {
    const planet = generatePlanet(100, 200);
    expect(planet).toHaveProperty("x", 100);
    expect(planet).toHaveProperty("y", 200);
    expect(typeof planet.size).toBe("number");
    expect(typeof planet.color).toBe("string");
  });

  it("returns different results for different coordinates", () => {
    const planet1 = generatePlanet(100, 200);
    const planet2 = generatePlanet(101, 201);
    expect(planet1.x).not.toBe(planet2.x);
    expect(planet1.y).not.toBe(planet2.y);
    expect(planet1.size).not.toBe(planet2.size);
    expect(planet1.color).not.toBe(planet2.color);
  });
});
