import { describe, it, expect, beforeEach } from "vitest";
import { GameSessionECS } from "./GameSessionECS";

describe("ECS planet resource auto-collect", () => {
  let session: GameSessionECS;

  beforeEach(() => {
    session = new GameSessionECS();
    // Enter planet mode on the first generated planet
    const first = session.getPlanets()[0];
    expect(first).toBeTruthy();
    session.restoreMode({ mode: "planet", planetId: first.id });
    // Land at the landing site (0,0)
    session.setPlayerPosition({ x: 0, y: 0 });
  });

  it("removes resources within collection radius during update", () => {
    // Inject a resource close to the player (within 30 px)
    const surface = (session as any).planetSurface as {
      resources: Array<{ id: string; x: number; y: number; type: string; amount: number }>;
    } | null;
    expect(surface).toBeTruthy();
    if (!surface) return;

    surface.resources.push({ id: "test-energy", x: 10, y: 0, type: "energy", amount: 25 });
    const before = surface.resources.length;

    // Run a frame; no actions required for auto-collect
    session.update(new Set(), 0.016);

    const after = surface.resources.length;
    expect(after).toBe(before - 1);
    expect(surface.resources.find((r) => r.id === "test-energy")).toBeUndefined();
  });

  it("does not remove distant resources", () => {
    const surface = (session as any).planetSurface as {
      resources: Array<{ id: string; x: number; y: number; type: string; amount: number }>;
    } | null;
    expect(surface).toBeTruthy();
    if (!surface) return;

    surface.resources.push({ id: "far-energy", x: 200, y: 0, type: "energy", amount: 25 });
    const before = surface.resources.length;

    session.update(new Set(), 0.016);

    const after = surface.resources.length;
    expect(after).toBe(before);
    expect(surface.resources.find((r) => r.id === "far-energy")).toBeDefined();
  });
});
