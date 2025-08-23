import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CanvasRenderer } from "./CanvasRenderer";

describe("CanvasRenderer", () => {
  it("renders a canvas element", () => {
    render(
      <CanvasRenderer
        player={{ x: 0, y: 0, vx: 0, vy: 0, angle: 0 }}
        camera={{ x: 0, y: 0, zoom: 1 }}
        planets={[]}
        actions={new Set()}
        size={{ width: 300, height: 150 }}
      />,
    );
    const canvas = screen.getByRole("img", { hidden: true });
    expect(canvas.tagName).toBe("CANVAS");
  });
});
