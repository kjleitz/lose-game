import { describe, expect, it } from "vitest";

import type { Action } from "../../application/input/ActionTypes";
import { GameSessionECS } from "./GameSessionECS";

function actionsSet(actions: Action[]): Set<Action> {
  return new Set(actions);
}

describe("GameSessionECS input integration", () => {
  it("applies boost to increase acceleration/speed while thrusting", () => {
    // Session A: normal thrust
    const sessionNormal = new GameSessionECS();
    const dt = 1; // amplify effect for easy comparison

    // One update with just thrust
    sessionNormal.update(actionsSet(["thrust"]), dt);
    const pNormal = sessionNormal.getPlayer();
    expect(pNormal).not.toBeNull();
    const speedNormal = Math.hypot(pNormal!.vx, pNormal!.vy);

    // Session B: thrust + boost
    const sessionBoost = new GameSessionECS();
    sessionBoost.update(actionsSet(["thrust", "boost"]), dt);
    const pBoost = sessionBoost.getPlayer();
    expect(pBoost).not.toBeNull();
    const speedBoost = Math.hypot(pBoost!.vx, pBoost!.vy);

    expect(speedBoost).toBeGreaterThan(speedNormal);
  });

  it("lands near a planet when pressing L and switches to planet mode", () => {
    const session = new GameSessionECS({
      planets: [
        // Place a planet close to origin where the player starts
        { id: "p_test", x: 30, y: 0, radius: 80, color: "#8888ff", design: "solid" },
      ],
    });

    // First tick without landing to populate proximity notification
    session.update(actionsSet([]), 1 / 60);
    const note = session.getNotification();
    expect(note).toContain("Press L to land on p_test");
    expect(session.getCurrentModeType()).toBe("space");

    // Press L to land
    session.update(actionsSet(["land"]), 1 / 60);
    expect(session.getCurrentModeType()).toBe("planet");
    let landedNote = session.getNotification();
    expect(landedNote).toContain("Exploring p_test");
    // Immediately after landing, player is at landing site; hint appears
    expect(landedNote).toContain("Press T to takeoff");

    // Move away from the landing site; hint should remain (can takeoff anywhere while in ship)
    session.setPlayerPosition({ x: 200, y: 0 });
    session.update(actionsSet([]), 1 / 60);
    landedNote = session.getNotification();
    expect(landedNote).toContain("Exploring p_test");
    expect(landedNote).toContain("Press T to takeoff");

    // And pressing T takes off back to space even when far from the ship
    session.update(actionsSet(["takeoff"]), 1 / 60);
    expect(session.getCurrentModeType()).toBe("space");
  });
});
