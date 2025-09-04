import { describe, expect, it } from "vitest";

import * as Components from "./components";
import { GameSessionECS } from "./GameSessionECS";

function setPlayerHealth(session: GameSessionECS, value: number): void {
  const world = session.getWorld();
  const players = world.query({ player: Components.Player, health: Components.Health });
  if (players.length === 0) return;
  players[0].components.health.current = value;
}

describe("GameSessionECS death handling", () => {
  it("marks awaiting respawn, emits one death event, bursts ~50 toasts, and respawns cleanly", () => {
    const session = new GameSessionECS();
    // Kill the player by setting health to 0
    setPlayerHealth(session, 0);
    session.update(new Set(), 1 / 60);

    // Awaiting respawn and death signal emitted
    expect(session.isAwaitingRespawn()).toBe(true);
    const deaths1 = session.getAndClearDeathEvents();
    expect(deaths1).toBeGreaterThan(0);
    const deaths2 = session.getAndClearDeathEvents();
    expect(deaths2).toBe(0);

    // Burst of "You died." toasts is emitted once
    const toasts = session.getAndClearToastEvents();
    const count = toasts.filter((t) => t === "You died.").length;
    expect(count).toBeGreaterThanOrEqual(45);
    expect(count).toBeLessThanOrEqual(60);

    // Further updates do not re-emit while awaiting respawn
    session.update(new Set(), 1 / 60);
    const toasts2 = session.getAndClearToastEvents();
    const count2 = toasts2.filter((t) => t === "You died.").length;
    expect(count2).toBe(0);

    // Respawn to a fresh session in space at origin
    session.respawnFromDeath();
    expect(session.isAwaitingRespawn()).toBe(false);
    expect(session.getCurrentModeType()).toBe("space");
    const pv = session.getPlayer();
    expect(pv).not.toBeNull();
    // Camera reset near origin
    const cam = session.getCamera();
    expect(Math.abs(cam.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(cam.y)).toBeLessThanOrEqual(1);
  });

  it("handles player entity removal as death trigger", () => {
    const session = new GameSessionECS();
    // Remove player entity explicitly
    const world = session.getWorld();
    const players = world.query({ player: Components.Player });
    if (players.length > 0) {
      world.removeEntity(players[0].entity);
    }
    session.update(new Set(), 1 / 60);
    expect(session.isAwaitingRespawn()).toBe(true);
  });
});
