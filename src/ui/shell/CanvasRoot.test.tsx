import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CanvasRoot } from "./CanvasRoot";

// Avoid heavy canvas work in tests
vi.mock("../../domain/render/GameRenderer", () => ({
  GameRenderer: class {
    render(): void {}
  },
}));
// Use a minimal loop that runs one update+render
vi.mock("../../application/game/loop", () => ({
  GameLoop: class {
    private opts: { update: (dt: number) => void; render: () => void };
    constructor(opts: { update: (dt: number) => void; render: () => void }) {
      this.opts = opts;
    }
    start(): void {
      this.opts.update(1 / 60);
      this.opts.render();
    }
    stop(): void {}
    pause(): void {}
    resume(): void {}
  },
}));

describe("CanvasRoot", () => {
  it("renders canvas and HUD elements", (): void => {
    const { container } = render(<CanvasRoot />);
    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();
    // HUD text shows 'idle' initially (no actions)
    expect(screen.getByText("idle")).toBeInTheDocument();
    // Container still present
    const div = container.querySelector(".relative.w-screen.h-screen.overflow-hidden");
    expect(div).not.toBeNull();
  });
});
