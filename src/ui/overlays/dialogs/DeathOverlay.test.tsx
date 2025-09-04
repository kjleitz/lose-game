import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { DeathOverlay } from "./DeathOverlay";

describe("DeathOverlay", () => {
  it("triggers onRespawn when pressing Enter", () => {
    const onRespawn = vi.fn();
    render(<DeathOverlay open={true} onRespawn={onRespawn} />);
    fireEvent.keyDown(window, { code: "Enter" });
    expect(onRespawn).toHaveBeenCalled();
  });
});
