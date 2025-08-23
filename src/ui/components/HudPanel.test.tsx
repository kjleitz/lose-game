import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { HudPanel } from "./HudPanel";

describe("HudPanel", () => {
  it("renders the HUD panel div", () => {
    const { container } = render(
      <HudPanel
        player={{ x: 0, y: 0 }}
        planets={[]}
        screenW={800}
        screenH={600}
        notification={"Test notification"}
        actions={new Set(["move"])}
        paused={false}
      />,
    );
    const div = container.querySelector(".hud-panel.px-3.py-2.space-y-1.pointer-events-auto");
    expect(div).not.toBeNull();
  });
});
