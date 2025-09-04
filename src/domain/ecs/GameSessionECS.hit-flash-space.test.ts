import { describe, it, expect } from "vitest";
import { GameSessionECS } from "./GameSessionECS";

describe("GameSessionECS hit flash in space", () => {
  it("applies HitFlash to player when hit by enemy projectile in space", () => {
    const session = new GameSessionECS({});
    // Run a few updates to allow an enemy to fire and hit the player
    // Use small dt but several iterations to progress AI, firing, and collision
    for (let i = 0; i < 50; i++) {
      session.update(new Set(), 0.05);
      const pv = session.getPlayer();
      if (pv && pv.hitFlash) {
        expect(pv.hitFlash.progress).toBeGreaterThanOrEqual(0);
        expect(pv.hitFlash.progress).toBeLessThanOrEqual(1);
        return; // success
      }
    }
    // If we got here, no hit flash was observed within the time budget
    const pv = session.getPlayer();
    expect(pv && pv.hitFlash).toBeTruthy();
  });
});
