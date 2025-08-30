import { describe, expect, it } from "vitest";

import type { Action } from "../../application/input/ActionTypes";
import { GameSessionECS } from "./GameSessionECS";

function actionsSet(actions: Action[]): Set<Action> {
  return new Set(actions);
}

describe("Planet terrain collision system", () => {
  it("pushes player out of overlapping terrain feature", () => {
    const session = new GameSessionECS();
    session.restoreMode({ mode: "planet", planetId: "planet_1" });
    // Land at landing site
    session.setPlayerPosition({ x: 0, y: 0 });

    const surface = session.getPlanetSurface();
    expect(surface).toBeTruthy();
    if (!surface) return;

    // Place a blocking terrain feature at player position to force overlap
    surface.terrain.push({ id: "rock-overlap", x: 0, y: 0, type: "rock", size: 20 });

    // Run an update; no movement input. Collision system should push player out.
    session.update(actionsSet([]), 1 / 60);

    const p = session.getPlayer();
    expect(p).toBeTruthy();
    if (!p) return;

    const dx = p.x - 0;
    const dy = p.y - 0;
    const dist = Math.hypot(dx, dy);
    const playerRadius = 16; // from EntityFactories collider
    expect(dist).toBeGreaterThanOrEqual(playerRadius + 20 - 0.001);
  });
});
