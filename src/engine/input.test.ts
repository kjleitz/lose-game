import { describe, it, expect } from "vitest";
import { mapKeyToAction, applyKeyEvent, createActionState } from "./input";

describe("input mapping", () => {
  it("maps common keys to actions", () => {
    expect(mapKeyToAction("KeyW")).toBe("thrust");
    expect(mapKeyToAction("ArrowLeft")).toBe("turnLeft");
    expect(mapKeyToAction("KeyD")).toBe("turnRight");
    expect(mapKeyToAction("Space")).toBe("fire");
  });

  it("updates action state on key events", () => {
    let state = createActionState();
    state = applyKeyEvent(state, "KeyW", true);
    expect(state.has("thrust")).toBe(true);
    state = applyKeyEvent(state, "KeyW", false);
    expect(state.has("thrust")).toBe(false);
  });
});
