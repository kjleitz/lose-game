import { describe, expect, it } from "vitest";

import type { Action } from "../../application/input/ActionTypes";
import { GameSessionECS } from "./GameSessionECS";

function actionsSet(actions: Action[]): Set<Action> {
  return new Set(actions);
}

describe("GameSessionECS takeoff gating", () => {
  it("does not takeoff on foot; succeeds anywhere when in ship", () => {
    const session = new GameSessionECS();
    // Enter planet mode deterministically on planet_1 and set player far from landing site
    session.restoreMode({ mode: "planet", planetId: "planet_1" });
    session.setPlayerPosition({ x: 200, y: 0 });

    // Attempt takeoff while on foot: should remain on planet
    session.update(actionsSet(["takeoff"]), 1 / 60);
    expect(session.getCurrentModeType()).toBe("planet");

    // Move to landing site, board the ship, and takeoff
    session.setPlayerPosition({ x: 0, y: 0 });
    session.update(actionsSet(["interact"]), 1 / 60); // enter ship
    // Now takeoff should work anywhere; we can be at site or away
    session.update(actionsSet(["takeoff"]), 1 / 60);
    expect(session.getCurrentModeType()).toBe("space");
  });
});
