import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import CanvasRoot from "./CanvasRoot";

describe("CanvasRoot", () => {
  it("renders the main container div", () => {
    const { container } = render(<CanvasRoot />);
    const div = container.querySelector(".relative.w-screen.h-screen.overflow-hidden");
    expect(div).not.toBeNull();
  });
});
