import { describe, it, expect } from "vitest";
import { randomInt, randomFloat } from "./utils";

describe("randomInt", () => {
  it("returns an integer within the range", () => {
    for (let i = 0; i < 10; i++) {
      const val = randomInt(1, 5);
      expect(Number.isInteger(val)).toBe(true);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(5);
    }
  });
});

describe("randomFloat", () => {
  it("returns a float within the range", () => {
    for (let i = 0; i < 10; i++) {
      const val = randomFloat(1, 5);
      expect(typeof val).toBe("number");
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThan(5);
    }
  });
});
