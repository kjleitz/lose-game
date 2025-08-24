import { describe, it, expect } from "vitest";
import { createProjectile, stepProjectile } from "./projectiles";

describe("projectiles", () => {
  it("creates a projectile in front of the ship heading forward", () => {
    const p = createProjectile({ x: 0, y: 0, angle: 0 }, 1000);
    expect(p.x).toBeGreaterThan(0); // spawned ahead on +x
    expect(p.vx).toBeGreaterThan(0);
    expect(p.vy).toBe(0);
    expect(p.ttl).toBeGreaterThan(0);
  });

  it("steps forward and reduces ttl", () => {
    const p = createProjectile({ x: 0, y: 0, angle: 0 }, 100);
    const prevTTL = p.ttl;
    const x0 = p.x;
    stepProjectile(p, 0.5);
    expect(p.x - x0).toBeCloseTo(50, 5);
    expect(p.ttl).toBeLessThan(prevTTL);
  });
});
