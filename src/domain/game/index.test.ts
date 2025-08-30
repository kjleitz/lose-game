import { describe, expect, it } from "vitest";

import { createInitialState } from "./index";

describe("createInitialState", () => {
  it("returns a GameState with default screen size", () => {
    const state = createInitialState();
    expect(state.time).toBe(0);
    expect(Array.isArray(state.planets)).toBe(true);
    expect(state.planets.length).toBeGreaterThan(0);
  });

  it("returns a GameState with custom screen size", () => {
    const state = createInitialState(800, 600);
    expect(state.time).toBe(0);
    expect(Array.isArray(state.planets)).toBe(true);
    expect(state.planets.length).toBeGreaterThan(0);
  });
});
