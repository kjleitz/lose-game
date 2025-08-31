import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ControlsPanel } from "./ControlsPanel";

describe("ControlsPanel", () => {
  function renderPanel(
    overrides?: Partial<React.ComponentProps<typeof ControlsPanel>>,
  ): ReturnType<typeof render> {
    return render(
      <ControlsPanel
        actions={overrides?.actions ?? new Set()}
        paused={overrides?.paused ?? false}
      />,
    );
  }

  it("shows 'idle' when there are no actions", (): void => {
    renderPanel({ actions: new Set() });
    expect(screen.getByText("idle")).toBeInTheDocument();
  });

  it("lists current actions when present", (): void => {
    renderPanel({ actions: new Set(["thrust", "turnLeft"]) });
    expect(screen.getByText(/thrust, turnLeft|turnLeft, thrust/)).toBeInTheDocument();
  });

  it("indicates when paused", (): void => {
    renderPanel({ paused: true });
    expect(screen.getByText("paused")).toBeInTheDocument();
  });
});
