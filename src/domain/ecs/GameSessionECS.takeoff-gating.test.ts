import { describe, it, expect } from "vitest";
import { GameSessionECS } from "./GameSessionECS";
import type { Action } from "../../engine/input/ActionTypes";

function actionsSet(actions: Action[]): Set<Action> {
  return new Set(actions);
}

describe("GameSessionECS takeoff gating", () => {
  it("does not takeoff when far from landing site; succeeds when near", () => {
    const session = new GameSessionECS();
    // Enter planet mode deterministically on planet_1 and set player far from landing site
    session.restoreMode({ mode: "planet", planetId: "planet_1" });
    session.setPlayerPosition({ x: 200, y: 0 });

    // Attempt takeoff while far: should remain on planet
    session.update(actionsSet(["takeoff"]), 1 / 60);
    expect(session.getCurrentModeType()).toBe("planet");

    // Move to landing site and try again
    session.setPlayerPosition({ x: 0, y: 0 });
    session.update(actionsSet(["takeoff"]), 1 / 60);
    expect(session.getCurrentModeType()).toBe("space");
  });
});
