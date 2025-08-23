import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePlayer } from "./usePlayer";

describe("usePlayer", () => {
  it("initializes with correct player position", () => {
    const { result } = renderHook(() => usePlayer({ x: 1, y: 2, vx: 0, vy: 0, angle: 0 }));
    expect(result.current.playerPos).toEqual({ x: 1, y: 2 });
  });

  it("updates player position when updatePlayer is called", () => {
    const { result } = renderHook(() => usePlayer({ x: 0, y: 0, vx: 0, vy: 0, angle: 0 }));
    act(() => {
      result.current.updatePlayer(1, new Set(["thrust"]));
    });
    // After thrust, position should change
    expect(result.current.playerPos.x).not.toBe(0);
    expect(result.current.playerPos.y).not.toBe(0);
  });

  it("playerRef always points to Player instance", () => {
    const { result } = renderHook(() => usePlayer());
    expect(result.current.playerRef.current).toBeInstanceOf(Object);
    expect(result.current.playerRef.current.state).toBeDefined();
  });
});
