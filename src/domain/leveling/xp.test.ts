import { describe, it, expect } from "vitest";
import { xpRequired } from "./xp";

describe("xpRequired", () => {
  it("returns 100 for level 1", () => {
    expect(xpRequired(1)).toBe(100);
  });

  it("follows the quadratic curve for early levels", () => {
    expect(xpRequired(2)).toBe(300); // 50*4 + 100 = 300
    expect(xpRequired(3)).toBe(600); // 50*9 + 150 = 600
    expect(xpRequired(4)).toBe(1000); // 50*16 + 200 = 1000
    expect(xpRequired(5)).toBe(1500); // 50*25 + 250 = 1500
  });

  it("clamps levels less than 1 to 1", () => {
    expect(xpRequired(0)).toBe(100);
    expect(xpRequired(-10)).toBe(100);
  });
});
