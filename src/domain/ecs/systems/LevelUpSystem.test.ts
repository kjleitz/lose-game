import { describe, it, expect } from "vitest";
import { World } from "../../../lib/ecs";
import { Player, PlayerExperience, PlayerPerkPoints } from "../components";
import { createLevelUpSystem, type LevelUpEvent } from "./LevelUpSystem";
import { xpRequired } from "../../leveling/xp";

describe("LevelUpSystem", () => {
  it("levels up when XP meets threshold and awards perk points", () => {
    const world = new World();
    const e = world
      .createEntity()
      .addComponent(Player)
      .addComponent(PlayerExperience, { current: 0, level: 1, toNextLevel: xpRequired(1) })
      .addComponent(PlayerPerkPoints, { unspent: 0 });

    const events: LevelUpEvent[] = [];
    const sys = createLevelUpSystem(world, (ev) => events.push(ev));

    // Give enough XP for two level-ups plus remainder
    const exp = e.getComponent(PlayerExperience);
    if (!exp) throw new Error("PlayerExperience missing");
    exp.current = exp.toNextLevel + xpRequired(2) + 5; // two levels and 5 xp carryover

    sys.run();

    const after = e.getComponent(PlayerExperience)!;
    const perks = e.getComponent(PlayerPerkPoints)!;
    expect(after.level).toBe(3);
    expect(after.current).toBe(5);
    expect(after.toNextLevel).toBe(xpRequired(3));
    expect(perks.unspent).toBe(2);
    expect(events.length).toBe(1);
    expect(events[0].newLevel).toBe(3);
    expect(events[0].awardedPerkPoints).toBe(2);
  });
});
