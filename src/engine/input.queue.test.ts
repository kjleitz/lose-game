import { describe, it, expect } from "vitest";
import { createActionState, createActionQueue, enqueueKeyEvent, consumeQueue } from "./input";

describe("Action queue", () => {
  it("enqueues and consumes key events deterministically", () => {
    const state = createActionState();
    const q = createActionQueue();
    enqueueKeyEvent(q, "KeyW", true);
    enqueueKeyEvent(q, "KeyD", true);
    enqueueKeyEvent(q, "KeyW", false);

    const next = consumeQueue(state, q);
    // After W down, D down, W up → only turnRight remains
    expect(q.length).toBe(0);
    expect(next.has("turnRight")).toBe(true);
    expect(next.has("thrust")).toBe(false);
  });

  it("ignores unmapped keys and leaves state if empty", () => {
    const state = createActionState();
    const q = createActionQueue();
    enqueueKeyEvent(q, "KeyZ", true); // unmapped
    const next = consumeQueue(state, q);
    expect(next).toBe(state); // unchanged reference if no effective events
  });
});
