import { describe, it, expect } from "vitest";
import { World } from "../../../lib/ecs";
import { Perks, Player, PlayerExperience, PlayerPerkPoints } from "../components";
import { createPerkUnlockSystem } from "./PerkUnlockSystem";
import { perkDefinitions } from "../../leveling/perksConfig";
import { xpRequired } from "../../leveling/xp";

describe("PerkUnlockSystem", () => {
  it("rejects unlocking unimplemented perks", () => {
    const world = new World();
    const e = world
      .createEntity()
      .addComponent(Player)
      .addComponent(PlayerExperience, { current: 0, level: 2, toNextLevel: xpRequired(2) })
      .addComponent(PlayerPerkPoints, { unspent: 1 })
      .addComponent(Perks, { unlocked: {} });

    const requests = [{ entityId: e.id, perkId: "navigation.warp" as const }];
    const results: Array<{ success: boolean; reason?: string }> = [];
    const sys = createPerkUnlockSystem(world, requests, perkDefinitions, (res) =>
      results.push(res),
    );
    sys.run();

    const perks = e.getComponent(Perks)!;
    const points = e.getComponent(PlayerPerkPoints)!;
    expect(perks.unlocked["navigation.warp"] ?? 0).toBe(0);
    expect(points.unspent).toBe(1);
    expect(results[0].success).toBe(false);
    expect(results[0].reason).toBe("unimplemented");
  });
});
