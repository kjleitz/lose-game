import { describe, it, expect } from "vitest";
import { GameSessionECS } from "./GameSessionECS";

function actionsSet<T extends string>(actions: T[]): Set<T> {
  return new Set(actions);
}

describe("Enemy gravity behavior (space mode)", () => {
  it("applies inverse-square acceleration with orbital assist toward a planet", () => {
    const planet = { id: "p", x: 0, y: 0, radius: 100, color: "#888", design: "solid" as const };
    const enemy = {
      id: "e",
      x: 250,
      y: 0,
      vx: 0,
      vy: 0,
      angle: 0,
      radius: 14,
      health: 50,
      visionRadius: 0, // force idle so AI doesn’t override velocity via pursuit this frame
      visionHysteresis: 0,
      turnSpeed: 0,
      accel: 0,
      maxSpeed: 9999,
    };
    const session = new GameSessionECS({ planets: [planet], enemies: [enemy] });
    const dt = 0.1;
    session.update(actionsSet([]), dt);
    const enemies = session.getEnemies();
    expect(enemies.length).toBeGreaterThan(0);
    const e = enemies.find((en) => en.id === "e");
    expect(e).toBeDefined();
    if (!e) return;

    // Expect velocity toward planet (negative x) and a small tangential assist (negative y)
    expect(e.vx).toBeLessThan(0);

    // Numeric expectation mirrors player gravity constants
    const G = 120;
    const densityPlanet = 0.1;
    const r = 100;
    const d = 250;
    const effectiveGM = G * densityPlanet * r * r * r;
    const expectedDv = (effectiveGM / (d * d)) * dt;
    expect(e.vx).toBeCloseTo(-expectedDv, 3);

    const accel = effectiveGM / (d * d);
    const maxAssist = accel * 0.7;
    const desiredTangential = Math.sqrt(effectiveGM / d);
    const assistGain = 0.8;
    const assistPerSec = Math.min(maxAssist, desiredTangential * assistGain);
    const expectedVy = -assistPerSec * dt;
    expect(e.vy).toBeCloseTo(expectedVy, 3);
  });

  it("does not apply gravity to enemies beyond 3R influence", () => {
    const planet = { id: "p", x: 0, y: 0, radius: 100, color: "#888", design: "solid" as const };
    const enemy = {
      id: "e_far",
      x: 400, // > 3R
      y: 0,
      vx: 0,
      vy: 0,
      angle: 0,
      radius: 14,
      health: 50,
      visionRadius: 0,
      visionHysteresis: 0,
      turnSpeed: 0,
      accel: 0,
      maxSpeed: 9999,
    };
    const session = new GameSessionECS({ planets: [planet], enemies: [enemy] });
    const dt = 0.1;
    session.update(actionsSet([]), dt);
    const enemies = session.getEnemies();
    const ef = enemies.find((en) => en.id === "e_far");
    expect(ef).toBeDefined();
    if (!ef) return;
    expect(Math.abs(ef.vx)).toBeLessThan(1e-6);
    expect(Math.abs(ef.vy)).toBeLessThan(1e-6);
  });
});
