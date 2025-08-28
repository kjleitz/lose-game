import { describe, it, expect } from "vitest";
import { GameSessionECS } from "./GameSessionECS";
import type { Action } from "../../engine/input/ActionTypes";

function actionsSet(actions: Action[]): Set<Action> {
  return new Set(actions);
}

describe("GameSessionECS planet surface generation", () => {
  it("generates a planet surface on landing and exposes it", () => {
    const session = new GameSessionECS({
      planets: [{ id: "p1", x: 20, y: 0, radius: 80, color: "#8888ff", design: "solid" }],
    });

    // First tick near planet, then land
    session.update(actionsSet([]), 1 / 60);
    session.update(actionsSet(["land"]), 1 / 60);

    expect(session.getCurrentModeType()).toBe("planet");
    const surface = session.getPlanetSurface();
    expect(surface).toBeDefined();
    expect(surface?.planetId).toBe("p1");
    // Expect some content
    expect(surface?.terrain.length ?? 0).toBeGreaterThan(0);
  });

  it("clears surface on takeoff", () => {
    const session = new GameSessionECS({
      planets: [{ id: "p1", x: 20, y: 0, radius: 80, color: "#8888ff", design: "solid" }],
    });
    session.update(actionsSet([]), 1 / 60);
    session.update(actionsSet(["land"]), 1 / 60);
    expect(session.getPlanetSurface()).toBeDefined();

    // Move to landing site to satisfy takeoff gating
    session.setPlayerPosition({ x: 0, y: 0 });
    session.update(actionsSet(["takeoff"]), 1 / 60);
    expect(session.getCurrentModeType()).toBe("space");
    expect(session.getPlanetSurface()).toBeUndefined();
  });
});
