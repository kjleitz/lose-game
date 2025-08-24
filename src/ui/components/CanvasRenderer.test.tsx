import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { CanvasRenderer } from "./CanvasRenderer";

// Avoid relying on actual 2D canvas context implementation
vi.mock("../../domain/render/GameRenderer", () => ({
  GameRenderer: class {
    render() {}
  },
}));

describe("CanvasRenderer", () => {
  it("renders a canvas element", () => {
    render(
      <CanvasRenderer
        player={{ x: 0, y: 0, vx: 0, vy: 0, angle: 0 }}
        camera={{ x: 0, y: 0, zoom: 1 }}
        planets={[]}
        projectiles={[]}
        enemies={[]}
        actions={new Set()}
        size={{ width: 300, height: 150 }}
      />,
    );
    const canvas = document.querySelector("canvas");
    expect(canvas?.tagName).toBe("CANVAS");
  });
});
