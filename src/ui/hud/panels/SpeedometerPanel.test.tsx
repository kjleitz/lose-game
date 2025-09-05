import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SpeedometerPanel } from "./SpeedometerPanel";

describe("SpeedometerPanel", () => {
  it("renders speed label and value", () => {
    render(<SpeedometerPanel speed={12.3456} />);
    expect(screen.getByText(/Speed/i)).toBeInTheDocument();
    expect(screen.getByText("12.35")).toBeInTheDocument();
  });
});
