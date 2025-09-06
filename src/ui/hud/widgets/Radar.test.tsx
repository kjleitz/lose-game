import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Radar } from "./Radar";

describe("Radar", () => {
  const basePlanet = {
    id: "p1",
    x: 100,
    y: 100,
    radius: 10,
    color: "#123456",
    design: "solid" as const,
  };
  const player = { x: 100, y: 100 };
  const screenW = 800;
  const screenH = 600;

  it("renders SVG and planet when in radar range", () => {
    const { container } = render(
      <Radar player={player} planets={[basePlanet]} screenW={screenW} screenH={screenH} />,
    );
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("g")).not.toBeNull();
    expect(container.querySelectorAll("circle").length).toBeGreaterThan(1);
  });

  it("renders edge indicator polygon when planet is out of radar range", () => {
    const farPlanet = { ...basePlanet, x: 10000, y: 10000 };
    const { container } = render(
      <Radar player={player} planets={[farPlanet]} screenW={screenW} screenH={screenH} />,
    );
    expect(container.querySelector("polygon")).not.toBeNull();
  });

  it("renders a rectangular radar in planet mode", () => {
    const { container } = render(
      <Radar
        mode="planet"
        player={player}
        planets={[]}
        enemies={[]}
        screenW={screenW}
        screenH={screenH}
      />,
    );
    expect(container.querySelector("svg")).not.toBeNull();
    // Outer frame rect present in planet mode
    expect(container.querySelector("rect")).not.toBeNull();
  });
});
