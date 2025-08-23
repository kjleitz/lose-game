import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GameLoopProvider } from "./GameLoopProvider";

describe("GameLoopProvider", () => {
  it("renders children", () => {
    render(
      <GameLoopProvider update={() => {}} render={() => {}}>
        <div data-testid="child">Hello</div>
      </GameLoopProvider>,
    );
    expect(screen.getByTestId("child")).toHaveTextContent("Hello");
  });
});
