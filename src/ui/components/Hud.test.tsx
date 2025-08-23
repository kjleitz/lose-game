import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import Hud from "./Hud";

describe("Hud", () => {
  it("renders the HUD container div", () => {
    const { container } = render(
      <Hud
        player={{ x: 0, y: 0 }}
        planets={[]}
        screenW={800}
        screenH={600}
        notification={"Test notification"}
      />,
    );
    const div = container.querySelector(".absolute.inset-0.pointer-events-none.z-10");
    expect(div).not.toBeNull();
  });
});
