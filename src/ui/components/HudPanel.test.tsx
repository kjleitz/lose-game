import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HudPanel } from "./HudPanel";

describe("HudPanel", () => {
  function renderPanel(overrides?: Partial<React.ComponentProps<typeof HudPanel>>) {
    return render(
      <HudPanel
        player={{ x: 0, y: 0 }}
        planets={[]}
        screenW={800}
        screenH={600}
        notification={overrides?.notification ?? "Hello"}
        actions={overrides?.actions ?? new Set()}
        paused={overrides?.paused ?? false}
      />,
    );
  }

  it("shows 'idle' when there are no actions", () => {
    renderPanel({ actions: new Set() });
    expect(screen.getByText("idle")).toBeInTheDocument();
  });

  it("lists current actions when present", () => {
    renderPanel({ actions: new Set(["thrust", "turnLeft"]) });
    expect(screen.getByText(/thrust, turnLeft|turnLeft, thrust/)).toBeInTheDocument();
  });

  it("indicates when paused", () => {
    renderPanel({ paused: true });
    expect(screen.getByText("paused")).toBeInTheDocument();
  });
});
