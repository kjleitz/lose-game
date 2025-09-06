import { describe, it, expect } from "vitest";

import type { Action } from "../../application/input/ActionTypes";
import { GameSessionECS } from "./GameSessionECS";

function actionsSet(actions: Action[]): Set<Action> {
  return new Set(actions);
}

describe("Thruster perks", () => {
  it("applies reverse thrust when perk unlocked and pressing moveDown in space", () => {
    const session = new GameSessionECS();
    // Grant points and unlock reverse thrusters
    session.grantPerkPoints(1);
    session.requestUnlockPerk("thrusters.reverse-thrusters");
    session.applyPendingPerkUnlocks();

    // Face +x (angle 0). Reverse thrust should accelerate toward -x.
    const dt = 1;
    session.update(actionsSet(["moveDown"]), dt);
    const p = session.getPlayer();
    expect(p).not.toBeNull();
    // Drag runs first but from rest; reverse then applies negative vx
    expect(p!.vx).toBeLessThan(0);
  });

  it("strafes laterally without rotating when holding boost + turn with perk", () => {
    const session = new GameSessionECS();
    // Unlock strafing
    session.grantPerkPoints(1);
    session.requestUnlockPerk("thrusters.strafing-thrusters");
    session.applyPendingPerkUnlocks();

    // Initial facing is 0 (along +x). Strafe left should add -y velocity (up) and not change angle.
    const before = session.getPlayer();
    expect(before).not.toBeNull();
    const angleBefore = before!.angle;

    const dt = 1;
    session.update(actionsSet(["boost", "turnLeft"]), dt);
    const after = session.getPlayer();
    expect(after).not.toBeNull();

    // Angle unchanged (no rotation while strafing)
    expect(after!.angle).toBeCloseTo(angleBefore, 6);
    // Negative vy indicates left strafe (up) when angle=0
    expect(after!.vy).toBeLessThan(0);
  });
});
