import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import PlanetSvg from "./PlanetSvg";

describe("PlanetSvg", () => {
  const basePlanet = {
    id: "p1",
    x: 0,
    y: 0,
    radius: 10,
    color: "#123456",
    design: "solid",
  };

  it("renders a solid planet as a circle", () => {
    const { container } = render(
      <svg>
        <PlanetSvg planet={{ ...basePlanet, design: "solid" }} x={0} y={0} r={10} />
      </svg>,
    );
    expect(container.querySelector("circle")).not.toBeNull();
    expect(container.querySelectorAll("ellipse").length).toBe(0);
  });

  it("renders a ringed planet with an ellipse", () => {
    const { container } = render(
      <svg>
        <PlanetSvg planet={{ ...basePlanet, design: "ringed" }} x={0} y={0} r={10} />
      </svg>,
    );
    expect(container.querySelector("ellipse")).not.toBeNull();
  });

  it("renders a striped planet with multiple circles", () => {
    const { container } = render(
      <svg>
        <PlanetSvg planet={{ ...basePlanet, design: "striped" }} x={0} y={0} r={10} />
      </svg>,
    );
    // Should have more than one circle (main + stripes)
    expect(container.querySelectorAll("circle").length).toBeGreaterThan(1);
  });

  it("renders a spotted planet with multiple circles", () => {
    const { container } = render(
      <svg>
        <PlanetSvg planet={{ ...basePlanet, design: "spotted" }} x={0} y={0} r={10} />
      </svg>,
    );
    // Should have more than one circle (main + spots)
    expect(container.querySelectorAll("circle").length).toBeGreaterThan(1);
  });
});
