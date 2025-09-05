import { describe, it, expect } from "vitest";
import { GameSessionECS } from "./GameSessionECS";
import * as EntityFactories from "./entities/EntityFactories";
import * as Components from "./components";

function actionsSet<T extends string>(actions: T[]): Set<T> {
  return new Set(actions);
}

describe("Gravity behavior (space mode)", () => {
  it("applies inverse-square acceleration toward a planet within 3R and outside 0.5R", () => {
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
    // Intended formula: a = G * weight * r^2 / d^2; dv = a * dt
    const G = 120;
    const weightPlanet = 2.2;
    const r = 100;
    const d = 250;
    const expectedDv = ((G * weightPlanet * r * r) / (d * d)) * dt;
    expect(after.vx).toBeCloseTo(-expectedDv, 3);
    expect(Math.abs(after.vy)).toBeLessThan(1e-6);
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

  it("does not apply gravity within core exclusion zone (<= 0.5R)", () => {
    const planet = { id: "p", x: 0, y: 0, radius: 100, color: "#888", design: "solid" as const };
    const session = new GameSessionECS({ planets: [planet] });
    session.setPlayerPosition({ x: 40, y: 0 }); // < 0.5R
    const dt = 0.1;
    session.update(actionsSet([]), dt);
    const after = session.getPlayer();
    expect(after).not.toBeNull();
    if (!after) return;
    expect(Math.abs(after.vx)).toBeLessThan(1e-6);
    expect(Math.abs(after.vy)).toBeLessThan(1e-6);
  });

  it("applies stronger acceleration toward a star than a planet at equal radius and distance", () => {
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

    expect(dvStar).toBeGreaterThan(dvPlanet);
    // Also check numeric expectations from intended constants
    const G = 120;
    const r = 100;
    const d = 250;
    const expectedStar = ((G * 2.5 * r * r) / (d * d)) * dt; // weight 2.5 for stars
    const expectedPlanet = ((G * 2.2 * r * r) / (d * d)) * dt; // weight 2.2 for planets
    expect(dvStar).toBeCloseTo(expectedStar, 3);
    expect(dvPlanet).toBeCloseTo(expectedPlanet, 3);
  });
});
