import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AmmoSelector } from "./AmmoSelector";

describe("AmmoSelector", () => {
  it("renders options and shows current selection", () => {
    const onSelect = vi.fn();
    render(
      <AmmoSelector current="standard" options={["standard", "kinetic"]} onSelect={onSelect} />,
    );
    expect(screen.getByTestId("hud-ammo-selector")).toBeInTheDocument();
    expect(screen.getByTestId("hud-ammo-current").textContent).toContain("Standard");
    // Locked options should be present but disabled via class
    expect(screen.getByTestId("ammo-btn-plasma")).toBeInTheDocument();
    // Click available option
    fireEvent.click(screen.getByTestId("ammo-btn-kinetic"));
    expect(onSelect).toHaveBeenCalledWith("kinetic");
  });
});
