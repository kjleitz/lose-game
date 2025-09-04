import { describe, expect, it } from "vitest";

import { GameSessionECS } from "./GameSessionECS";

function actionsSet(
  actions: Array<Parameters<GameSessionECS["update"]>[0] extends Set<infer A> ? A : never>,
): Set<Parameters<GameSessionECS["update"]>[0] extends Set<infer A> ? A : never> {
  // Helper identical to other tests' local helper
  // We avoid importing Action type to keep this file focused on behavior
  return new Set(actions);
}

describe("GameSessionECS landing/takeoff positioning", () => {
  it("lands at planet landing site and takes off hovering east of planet with zeroed motion", () => {
    const planet = {
      id: "p_test",
      x: 20,
      y: 0,
      radius: 80,
      color: "#8888ff",
      design: "solid" as const,
    };
    const session = new GameSessionECS({ planets: [planet] });

    // First tick for proximity, then land
    session.update(actionsSet([]), 1 / 60);
    session.update(actionsSet(["land"]), 1 / 60);
    expect(session.getCurrentModeType()).toBe("planet");

    // Player should be at landing site (0,0 in planet-local coords)
    const onPlanet = session.getPlayer();
    expect(onPlanet).not.toBeNull();
    expect(onPlanet!.x).toBeCloseTo(0, 1);
    expect(onPlanet!.y).toBeCloseTo(0, 1);

    // Take off while in ship-on-planet state
    session.update(actionsSet(["takeoff"]), 1 / 60);
    expect(session.getCurrentModeType()).toBe("space");

    // Verify spawn position just east of planet and zero motion/angle
    const pv = session.getPlayer();
    expect(pv).not.toBeNull();
    expect(pv!.x).toBeCloseTo(planet.x + planet.radius + 70, 3);
    expect(pv!.y).toBeCloseTo(planet.y, 3);
    expect(Math.abs(pv!.vx)).toBeLessThan(0.0001);
    expect(Math.abs(pv!.vy)).toBeLessThan(0.0001);
    expect(pv!.angle).toBeCloseTo(0, 5);
  });
});
