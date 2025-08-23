import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useInput } from "./useInput";

describe("useInput", () => {
  it("initializes with empty actions", () => {
    const { result } = renderHook(() => useInput());
    expect(result.current.actions.size).toBe(0);
  });

  it("updates actions on keydown/keyup", () => {
    const { result } = renderHook(() => useInput());
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowUp" }));
      result.current.updateActions();
    });
    expect(result.current.actions.has("thrust")).toBe(true);
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowUp" }));
      result.current.updateActions();
    });
    expect(result.current.actions.has("thrust")).toBe(false);
  });
});
