import { describe, it, expect, beforeEach } from "vitest";
import { GameSessionECS } from "./GameSessionECS";

describe("ECS XP gains", () => {
  let session: GameSessionECS;

  beforeEach(() => {
    session = new GameSessionECS();
    session.restoreMode({ mode: "planet", planetId: "planet_1" });
    session.setPlayerPosition({ x: 0, y: 0 });
  });

  it("increments player experience when collecting nearby resource", () => {
    const surface = (session as any).planetSurface as {
      resources: Array<{ id: string; x: number; y: number; type: string; amount: number }>;
    };
    const start = session.getPlayer();
    const startXp = start?.experience ?? 0;

    surface.resources.push({ id: "xp-energy", x: 5, y: 0, type: "energy", amount: 17 });
    session.update(new Set(), 0.016);

    const end = session.getPlayer();
    expect(end?.experience).toBe(startXp + 17);
  });
});
