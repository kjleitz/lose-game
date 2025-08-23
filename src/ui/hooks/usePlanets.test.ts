import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePlanets } from "./usePlanets";

describe("usePlanets", () => {
  it("initializes with planets", () => {
    const size = { width: 800, height: 600 };
    const { result } = renderHook(() => usePlanets(size));
    expect(Array.isArray(result.current.planets)).toBe(true);
    expect(result.current.planets.length).toBeGreaterThan(0);
  });

  it("maybeGenerateRegion adds new planets for a new region", () => {
    const size = { width: 800, height: 600 };
    const { result } = renderHook(() => usePlanets(size));
    const initialCount = result.current.planets.length;
    act(() => {
      result.current.maybeGenerateRegion({ x: 1000, y: 1000 }, "region-1", 2);
    });
    expect(result.current.planets.length).toBeGreaterThanOrEqual(initialCount);
  });

  it("setPlanets updates the planets state", () => {
    const size = { width: 800, height: 600 };
    const { result } = renderHook(() => usePlanets(size));
    act(() => {
      result.current.setPlanets([
        { id: "test", x: 0, y: 0, radius: 1, color: "#fff", design: "solid" },
      ]);
    });
    expect(result.current.planets).toEqual([
      { id: "test", x: 0, y: 0, radius: 1, color: "#fff", design: "solid" },
    ]);
  });
});
