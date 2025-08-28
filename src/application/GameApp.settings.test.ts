import { describe, it, expect, beforeEach } from "vitest";
import { GameApp } from "./GameApp";
import { updateSettings } from "./settings/settingsStorage";

function createCanvas(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  // minimal size
  Object.defineProperty(c, "width", { value: 800, writable: true });
  Object.defineProperty(c, "height", { value: 600, writable: true });
  return c;
}

describe("GameApp settings integration", () => {
  beforeEach(() => {
    try {
      window.localStorage.clear();
    } catch {
      // ignore
    }
  });

  it("initializes speed from saved settings", async () => {
    updateSettings({ speed: 2.5 });
    const canvas = createCanvas();
    const ctrl = await GameApp.create(canvas, { size: { width: 800, height: 600 } });
    expect(ctrl.getSpeed()).toBeCloseTo(2.5, 5);
    ctrl.dispose();
  });

  it("persists speed when changed", async () => {
    const canvas = createCanvas();
    const ctrl = await GameApp.create(canvas, { size: { width: 800, height: 600 } });
    ctrl.setSpeed(3.25);
    // read raw storage via our helper
    const raw = window.localStorage.getItem("lose.settings::app");
    expect(typeof raw).toBe("string");
    const parsed = raw ? JSON.parse(raw) : null;
    expect(parsed).not.toBeNull();
    expect(parsed.speed).toBeCloseTo(3.25, 5);
    // sprite settings should be present with defaults if not changed
    expect(["classic", "art-deco"]).toContain(parsed.spriteTheme);
    expect(typeof parsed.spriteOverrides).toBe("object");
    ctrl.dispose();
  });
});
