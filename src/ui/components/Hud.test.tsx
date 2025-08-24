import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Hud from "../hud/Hud";

describe("Hud", () => {
  it("renders notification text and radar SVG", () => {
    const { container } = render(
      <Hud
        player={{ x: 0, y: 0 }}
        planets={[{ id: "p1", x: 0, y: 0, radius: 5, color: "#fff", design: "solid" }]}
        screenW={800}
        screenH={600}
        notification={"Test notification"}
        actions={new Set()}
        paused={false}
      />,
    );
    expect(screen.getByText("Test notification")).toBeInTheDocument();
    // Radar renders an SVG element
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
