import { describe, it, expect } from "vitest";
import { GameLoop } from "./loop";

describe("GameLoop", () => {
  it("accumulates and steps fixed updates", () => {
    let updates = 0;
    const update = () => {
      updates += 1;
    };
    const render = () => {};

    // Manual clock and scheduler
    let nowMs = 0;
    const now = () => nowMs;
    let cb: FrameRequestCallback | undefined;
    const schedule = (fn: FrameRequestCallback) => {
      cb = fn;
      return 1;
    };
    const cancel = () => {};

    const loop = new GameLoop({ update, render, fixedDelta: 1 / 60, now, schedule, cancel });
    loop.start();

    // Simulate ~50ms frame, should produce 3 updates at 60Hz (16.67ms each)
    nowMs = 50;
    if (cb) cb(0);
    expect(updates).toBe(3);

    loop.stop();
  });

  it("pauses and resumes without scheduling ticks while paused", () => {
    let updates = 0;
    let renders = 0;
    const update = () => void (updates += 1);
    const render = () => void (renders += 1);

    let nowMs = 0;
    const now = () => nowMs;
    let scheduled = 0;
    let cb: FrameRequestCallback | undefined;
    const schedule = (fn: FrameRequestCallback) => {
      scheduled += 1;
      cb = fn;
      return scheduled;
    };
    const cancel = () => {};

    const loop = new GameLoop({ update, render, fixedDelta: 1 / 60, now, schedule, cancel });
    loop.start();
    nowMs = 20; // advance a bit
    if (cb) cb(0);
    expect(updates).toBeGreaterThanOrEqual(1);
    expect(scheduled).toBe(2); // start + reschedule after first tick

    loop.pause();
    // Calling the last scheduled cb should early return and not reschedule
    const before = scheduled;
    if (cb) cb(0);
    expect(scheduled).toBe(before);

    loop.resume();
    nowMs += 20;
    if (cb) cb(0);
    expect(updates).toBeGreaterThan(1);
  });

  it("steps once when paused", () => {
    let updates = 0;
    let renders = 0;
    const update = () => void (updates += 1);
    const render = () => void (renders += 1);
    const now = () => 0;
    const schedule = () => {
      // don't auto-run cb in this test
      return 1;
    };
    const cancel = () => {};

    const loop = new GameLoop({ update, render, fixedDelta: 1 / 60, now, schedule, cancel });
    loop.start();
    loop.pause();
    const u0 = updates;
    const r0 = renders;
    loop.step();
    expect(updates).toBe(u0 + 1);
    expect(renders).toBe(r0 + 1);
  });
});
