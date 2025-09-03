import { describe, it, expect } from "vitest";

import type { Action } from "../../application/input/ActionTypes";
import { GameSessionECS } from "./GameSessionECS";

function actionsSet(actions: Action[]): Set<Action> {
  return new Set(actions);
}

describe("Planet mode: enter ship and fly", () => {
  it("starts in ship near landing site and uses ship controls; interact exits/enters", () => {
    const session = new GameSessionECS({
      planets: [{ id: "p1", x: 20, y: 0, radius: 80, color: "#88f", design: "solid" }],
    });

    // Land on the nearby planet
    session.update(actionsSet([]), 1 / 60);
    session.update(actionsSet(["land"]), 1 / 60);
    expect(session.getCurrentModeType()).toBe("planet");
    expect(session.getPlanetSurface()).toBeDefined();

    // Player starts at landing site and is in ship mode immediately
    session.setPlayerPosition({ x: 0, y: 0 });
    expect(session.isInPlanetShip()).toBe(true);

    // With ship controls active on-planet, turning right should rotate the player
    const before = session.getPlayer();
    const startAngle = before?.angle ?? 0;
    session.update(actionsSet(["turnRight"]), 0.2);
    const after = session.getPlayer();
    expect(after).toBeTruthy();
    expect((after?.angle ?? 0) > startAngle).toBe(true);

    // Interact exits the ship when near landing site
    session.update(actionsSet(["interact"]), 1 / 60);
    expect(session.isInPlanetShip()).toBe(false);
  });
});
