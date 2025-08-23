import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import App from "./App";

// Prevent spinning loops and canvas internals from interfering
vi.mock("./ui/components/GameLoopProvider", () => ({
  GameLoopProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("./domain/render/GameRenderer", () => ({
  GameRenderer: class {
    render() {}
  },
}));

describe("App", () => {
  it("renders the game root without crashing", () => {
    const { container } = render(<App />);
    // Ensure CanvasRoot structure exists
    expect(container.querySelector(".relative.w-screen.h-screen.overflow-hidden")).not.toBeNull();
  });
});
