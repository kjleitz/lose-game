import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { GameLoopProvider } from "./GameLoopProvider";

// Mock the GameLoop class so we can assert lifecycle calls
const mockStart = vi.fn();
const mockStop = vi.fn();
const ctorSpy = vi.fn();

vi.mock("../../application/game/loop", () => {
  return {
    GameLoop: vi.fn().mockImplementation((opts) => {
      ctorSpy(opts);
      return { start: mockStart, stop: mockStop };
    }),
  };
});

describe("GameLoopProvider", () => {
  beforeEach(() => {
    mockStart.mockClear();
    mockStop.mockClear();
    ctorSpy.mockClear();
    cleanup();
  });

  it("constructs GameLoop with provided callbacks and starts on mount", () => {
    const update = vi.fn();
    const renderCb = vi.fn();
    render(
      <GameLoopProvider update={update} render={renderCb}>
        <div data-testid="child">Hello</div>
      </GameLoopProvider>,
    );
    expect(screen.getByTestId("child")).toHaveTextContent("Hello");
    expect(ctorSpy).toHaveBeenCalledTimes(1);
    const passed = ctorSpy.mock.calls[0][0] as any;
    expect(passed.update).toBe(update);
    expect(passed.render).toBe(renderCb);
    expect(mockStart).toHaveBeenCalledTimes(1);
  });

  it("stops the loop on unmount", () => {
    const { unmount } = render(
      <GameLoopProvider update={() => {}} render={() => {}}>
        <div>Child</div>
      </GameLoopProvider>,
    );
    unmount();
    expect(mockStop).toHaveBeenCalled();
  });
});
