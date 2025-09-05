import { describe, it, expect } from "vitest";
import { GameSessionECS } from "./GameSessionECS";
import * as EntityFactories from "./entities/EntityFactories";

function actionsSet<T extends string>(actions: T[]): Set<T> {
  return new Set(actions);
}

describe("Enemy star hazard (space mode)", () => {
  it("insta-kills enemies within stellar kill radius", () => {
    const star = { id: "s", x: 0, y: 0, radius: 140, color: "#ffcc66", design: "solid" as const };
    const killR = star.radius * 0.75;
    const enemy = {
      id: "e_dead",
      x: killR - 1, // just inside kill radius to the right
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
    const session = new GameSessionECS({ planets: [], enemies: [enemy] });
    // Add star via world factory to ensure ECS has it
    const world = session.getWorld();
    EntityFactories.createStar(world, star.id, star.x, star.y, star.radius, star.color);
    session.update(actionsSet([]), 0.1);
    const eView = session.getEnemies().find((en) => en.id === enemy.id);
    // Enemy should have been removed after instant-kill
    expect(eView).toBeUndefined();
  });

  it("damages enemies within heat radius but outside kill radius", () => {
    const star = { id: "s2", x: 0, y: 0, radius: 140, color: "#ffcc66", design: "solid" as const };
    const heatOuter = star.radius * 1.25;
    const enemy = {
      id: "e_hot",
      x: heatOuter - 1,
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
    const session = new GameSessionECS({ planets: [], enemies: [enemy] });
    const world = session.getWorld();
    EntityFactories.createStar(world, star.id, star.x, star.y, star.radius, star.color);
    session.update(actionsSet([]), 0.5); // half a second of exposure
    const eView = session.getEnemies().find((en) => en.id === enemy.id);
    expect(eView).toBeDefined();
    if (!eView) return;
    expect(eView.health).toBeLessThan(enemy.health);
    expect(eView.health).toBeGreaterThan(0);
  });
});
