import { describe, it, expect } from "vitest";
import { World } from "../../../lib/ecs";
import { Perks, Player, PlayerPerkPoints } from "../components";
import { createPerkSellSystem } from "./PerkSellSystem";
import { perkDefinitions } from "../../leveling/perksConfig";
import type { PerkDefinition } from "../../leveling/types";

describe("PerkSellSystem", () => {
  it("refunds points and decrements tier when selling an unlocked perk", () => {
    const world = new World();
    const e = world
      .createEntity()
      .addComponent(Player)
      .addComponent(PlayerPerkPoints, { unspent: 0 })
      .addComponent(Perks, { unlocked: { "thrusters.strafing-thrusters": 1 } });

    const requests = [{ entityId: e.id, perkId: "thrusters.strafing-thrusters" as const }];
    const results: Array<{ success: boolean; reason?: string }> = [];
    const sys = createPerkSellSystem(world, requests, perkDefinitions, (res) => results.push(res));
    sys.run();

    const perks = e.getComponent(Perks)!;
    const points = e.getComponent(PlayerPerkPoints)!;
    expect(perks.unlocked["thrusters.strafing-thrusters"]).toBe(0);
    expect(points.unspent).toBe(1); // tier 1 cost is 1
    expect(results[0].success).toBe(true);
  });

  it("blocks selling if another unlocked perk requires it", () => {
    const world = new World();
    const e = world
      .createEntity()
      .addComponent(Player)
      .addComponent(PlayerPerkPoints, { unspent: 0 })
      .addComponent(Perks, {
        unlocked: {
          "thrusters.strafing-thrusters": 1,
          "combat.new-ammo-and-weapons": 1,
        },
      });

    // Custom minimal definitions to express the requirement relationship
    const defs: readonly PerkDefinition[] = [
      {
        id: "thrusters.strafing-thrusters",
        name: "Strafing Thrusters",
        description: "",
        category: "thrusters",
        implemented: true,
        tiers: [{ tier: 1, cost: 1 }],
      },
      {
        id: "combat.new-ammo-and-weapons",
        name: "New Ammo",
        description: "",
        category: "combat",
        implemented: true,
        tiers: [{ tier: 1, cost: 1, requires: ["thrusters.strafing-thrusters"] }],
      },
    ];

    const requests = [{ entityId: e.id, perkId: "thrusters.strafing-thrusters" as const }];
    const results: Array<{ success: boolean; reason?: string }> = [];
    const sys = createPerkSellSystem(world, requests, defs, (res) => results.push(res));
    sys.run();

    const perks = e.getComponent(Perks)!;
    const points = e.getComponent(PlayerPerkPoints)!;
    expect(perks.unlocked["thrusters.strafing-thrusters"]).toBe(1);
    expect(points.unspent).toBe(0);
    expect(results[0].success).toBe(false);
    expect(results[0].reason).toBe("required_by_other");
  });

  it("sells down one tier at a time and refunds that tier's cost", () => {
    const world = new World();
    const e = world
      .createEntity()
      .addComponent(Player)
      .addComponent(PlayerPerkPoints, { unspent: 0 })
      .addComponent(Perks, { unlocked: { "thrusters.strafing-thrusters": 2 } });

    const multiTierDefs: readonly PerkDefinition[] = [
      {
        id: "thrusters.strafing-thrusters",
        name: "Strafing Thrusters",
        description: "",
        category: "thrusters",
        implemented: true,
        tiers: [
          { tier: 1, cost: 1 },
          { tier: 2, cost: 2 },
        ],
      },
    ];

    const runSell = (): void => {
      const requests = [{ entityId: e.id, perkId: "thrusters.strafing-thrusters" as const }];
      const sys = createPerkSellSystem(world, requests, multiTierDefs, () => {});
      sys.run();
    };

    // First sell: 2 -> 1, refund 2
    runSell();
    expect(e.getComponent(Perks)!.unlocked["thrusters.strafing-thrusters"]).toBe(1);
    expect(e.getComponent(PlayerPerkPoints)!.unspent).toBe(2);

    // Second sell: 1 -> 0, refund 1
    runSell();
    expect(e.getComponent(Perks)!.unlocked["thrusters.strafing-thrusters"]).toBe(0);
    expect(e.getComponent(PlayerPerkPoints)!.unspent).toBe(3);
  });
});
