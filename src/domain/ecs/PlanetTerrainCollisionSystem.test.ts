import { describe, expect, it } from "vitest";

import type { Action } from "../../application/input/ActionTypes";
import { GameSessionECS } from "./GameSessionECS";

function actionsSet(actions: Action[]): Set<Action> {
  return new Set(actions);
}

describe("Planet terrain collision system", () => {
  it("pushes player out of overlapping terrain feature", async () => {
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

    // New assertion: player should not overlap any of the feature's colliders
    // (rocks are now contoured with multiple circles instead of one big circle).
    const { getTerrainColliders } = await import("./collision/terrain-colliders");
    const colliders = getTerrainColliders({
      id: "rock-overlap",
      x: 0,
      y: 0,
      type: "rock",
      size: 20,
    });
    const playerRadius = 16; // from EntityFactories collider
    for (const c of colliders) {
      const dx = p.x - c.cx;
      const dy = p.y - c.cy;
      const d = Math.hypot(dx, dy);
      expect(d).toBeGreaterThanOrEqual(playerRadius + c.r - 0.002);
    }
  });
});
