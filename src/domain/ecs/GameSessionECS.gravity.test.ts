import { describe, it, expect } from "vitest";
import { GameSessionECS } from "./GameSessionECS";
import * as EntityFactories from "./entities/EntityFactories";
import * as Components from "./components";

function actionsSet<T extends string>(actions: T[]): Set<T> {
  return new Set(actions);
}

describe("Gravity behavior (space mode)", () => {
  it("applies inverse-square acceleration toward a planet within 3R and outside the surface", () => {
    const planet = { id: "p", x: 0, y: 0, radius: 100, color: "#888", design: "solid" as const };
    const session = new GameSessionECS({ planets: [planet] });
    // Player at (250, 0): within 3R=300, outside 0.5R=50
    session.setPlayerPosition({ x: 250, y: 0 });
    const before = session.getPlayer();
    expect(before).not.toBeNull();
    const dt = 0.1;
    session.update(actionsSet([]), dt);
    const after = session.getPlayer();
    expect(after).not.toBeNull();
    if (!after) return;
    // Expect velocity toward planet (negative x)
    expect(after.vx).toBeLessThan(0);
    // New formula: effectiveGM = G * density * r^3; a = effectiveGM / d^2; dv = a * dt
    const G = 120;
    const densityPlanet = 0.1; // planets ~4x stars (0.025)
    const r = 100;
    const d = 250;
    const effectiveGM = G * densityPlanet * r * r * r;
    const expectedDv = (effectiveGM / (d * d)) * dt;
    expect(after.vx).toBeCloseTo(-expectedDv, 3);
    // With orbital assist, expect a small tangential nudge capped at 0.7 * accel
    const accel = effectiveGM / (d * d);
    const maxAssist = accel * 0.7;
    const desiredTangential = Math.sqrt(effectiveGM / d);
    const assistGain = 0.8;
    const assistPerSec = Math.min(maxAssist, desiredTangential * assistGain);
    const expectedVy = -assistPerSec * dt; // negative y (clockwise tangential)
    expect(after.vy).toBeCloseTo(expectedVy, 3);
  });

  it("does not apply gravity beyond 3R influence", () => {
    const planet = { id: "p", x: 0, y: 0, radius: 100, color: "#888", design: "solid" as const };
    const session = new GameSessionECS({ planets: [planet] });
    session.setPlayerPosition({ x: 400, y: 0 }); // > 3R
    const dt = 0.1;
    session.update(actionsSet([]), dt);
    const after = session.getPlayer();
    expect(after).not.toBeNull();
    if (!after) return;
    expect(Math.abs(after.vx)).toBeLessThan(1e-6);
    expect(Math.abs(after.vy)).toBeLessThan(1e-6);
  });

  it("applies inside-body gravity that decreases linearly to center (<= R)", () => {
    const planet = { id: "p", x: 0, y: 0, radius: 100, color: "#888", design: "solid" as const };
    const session = new GameSessionECS({ planets: [planet] });
    session.setPlayerPosition({ x: 40, y: 0 }); // inside body (0.4R)
    const dt = 0.1;
    session.update(actionsSet([]), dt);
    const after = session.getPlayer();
    expect(after).not.toBeNull();
    if (!after) return;
    // Expected inside-body acceleration: a = G * density * d (uniform density sphere)
    const G = 120;
    const densityPlanet = 0.1;
    const d = 40;
    const expectedDv = G * densityPlanet * d * dt;
    expect(after.vx).toBeCloseTo(-expectedDv, 6);
    expect(Math.abs(after.vy)).toBeLessThan(1e-6);
  });

  it("applies stronger acceleration toward a denser planet than a star at equal radius and distance", () => {
    // Provide a far-away planet so default logic doesn't add extras nearby
    const farPlanet = {
      id: "p_far",
      x: 10000,
      y: 0,
      radius: 100,
      color: "#888",
      design: "solid" as const,
    };
    const session = new GameSessionECS({ planets: [farPlanet] });
    // Create a star at origin with same radius as our comparison planet
    const world = session.getWorld();
    const star = EntityFactories.createStar(world, "s", 0, 0, 100, "#ffcc66");
    // Place player within influence at (250, 0)
    session.setPlayerPosition({ x: 250, y: 0 });
    const dt = 0.1;
    session.update(actionsSet([]), dt);
    const afterStar = session.getPlayer();
    expect(afterStar).not.toBeNull();
    if (!afterStar) return;
    const dvStar = -afterStar.vx; // positive magnitude toward -x

    // Reset world: remove the star, remove far planet, add a nearby planet at origin
    world.removeEntity(star.id);
    const planetsNow = world.query({ planet: Components.Planet });
    for (const p of planetsNow) world.removeEntity(p.entity);
    EntityFactories.createPlanetEntity(world, {
      id: "p_near",
      x: 0,
      y: 0,
      radius: 100,
      color: "#8888ff",
      design: "solid",
    });
    session.setPlayerPosition({ x: 250, y: 0 });
    // Clear any velocity from previous step
    const players = world.query({
      position: Components.Position,
      velocity: Components.Velocity,
      player: Components.Player,
    });
    const vel = players[0].components.velocity;
    vel.dx = 0;
    vel.dy = 0;
    session.update(actionsSet([]), dt);
    const afterPlanet = session.getPlayer();
    expect(afterPlanet).not.toBeNull();
    if (!afterPlanet) return;
    const dvPlanet = -afterPlanet.vx;

    expect(dvPlanet).toBeGreaterThan(dvStar);
    // Also check numeric expectations from intended constants
    const G = 120;
    const r = 100;
    const d = 250;
    const densityStar = 0.025;
    const densityPlanet = 0.1;
    const expectedStar = ((G * densityStar * r * r * r) / (d * d)) * dt;
    const expectedPlanet = ((G * densityPlanet * r * r * r) / (d * d)) * dt;
    expect(dvStar).toBeCloseTo(expectedStar, 3);
    expect(dvPlanet).toBeCloseTo(expectedPlanet, 3);
  });
});
