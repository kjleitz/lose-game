import { describe, it, expect } from "vitest";
import { Player } from "./player";

describe("Player", () => {
  it("initializes with correct state", () => {
    const initial = { x: 0, y: 0, vx: 1, vy: 2, angle: 0 };
    const player = new Player(initial);
    expect(player.state).toEqual(initial);
  });

  it("updates position and velocity with thrust", () => {
    const initial = { x: 0, y: 0, vx: 0, vy: 0, angle: 0 };
    const player = new Player(initial);
    player.update(1, new Set(["thrust"]));
    expect(player.state.vx).not.toBe(0);
    expect(player.state.vy).not.toBe(0);
    expect(player.state.x).not.toBe(0);
    expect(player.state.y).not.toBe(0);
  });

  it("updates angle with turnLeft and turnRight", () => {
    const initial = { x: 0, y: 0, vx: 0, vy: 0, angle: 0 };
    const player = new Player(initial);
    player.update(1, new Set(["turnLeft"]));
    expect(player.state.angle).toBeLessThan(0);
    player.update(1, new Set(["turnRight"]));
    expect(player.state.angle).toBeGreaterThanOrEqual(0);
  });

  it("applies drag to velocity", () => {
    const initial = { x: 0, y: 0, vx: 10, vy: 10, angle: 0 };
    const player = new Player(initial);
    player.update(1, new Set());
    expect(player.state.vx).toBeLessThan(10);
    expect(player.state.vy).toBeLessThan(10);
  });
});
