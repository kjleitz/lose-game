import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CanvasRoot from "./CanvasRoot";

// Avoid spinning up real game loop in this test environment
vi.mock("./GameLoopProvider", () => ({
  GameLoopProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("../../domain/render/GameRenderer", () => ({
  GameRenderer: class {
    render() {}
  },
}));

describe("CanvasRoot", () => {
  it("renders canvas and HUD elements", () => {
    const { container } = render(<CanvasRoot />);
    // Canvas from CanvasRenderer
    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();
    // HUD text shows 'idle' initially (no actions)
    expect(screen.getByText("idle")).toBeInTheDocument();
    // Container still present
    const div = container.querySelector(".relative.w-screen.h-screen.overflow-hidden");
    expect(div).not.toBeNull();
  });
});
