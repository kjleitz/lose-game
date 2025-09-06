import { describe, it, expect } from "vitest";
import { World } from "../../../lib/ecs";
import { Perks, Player, PlayerModifiers, Position, Rotation, Velocity } from "../components";
import { createPerkEffectsSystem } from "./PerkEffectsSystem";
import { createPlayerControlSystem } from "./PlayerControlSystem";

describe("PerkEffectsSystem integration", () => {
  it("is a no-op for unimplemented perks", () => {
    const world = new World();
    const e = world
      .createEntity()
      .addComponent(Player)
      .addComponent(Position, { x: 0, y: 0 })
      .addComponent(Velocity, { dx: 0, dy: 0 })
      .addComponent(Rotation, { angle: 0 })
      .addComponent(Perks, { unlocked: { "navigation.warp": 1 } })
      .addComponent(PlayerModifiers, {
        turnSpeedMult: 1,
        accelMult: 1,
        maxSpeedMult: 1,
        dragReduction: 0,
        walkSpeedMult: 1,
        runSpeedMult: 1,
        frictionMult: 1,
        projectileSpreadMult: 1,
        lootQuantityMult: 1,
      });

    const perks = createPerkEffectsSystem(world);
    // Build a tiny input set with turnLeft
    const actions = new Set(["turnLeft"] as const);
    const dt = 1;
    const control = createPlayerControlSystem(world, actions, dt, "space");

    // Baseline angle change without perk: temporarily set modifier to defaults
    world.query({ rotation: Rotation })[0].components.rotation.angle = 0;
    // Reset perk to multiples are recomputed by perks system, so run it first
    perks.run();
    control.run();
    const withPerk = world.query({ rotation: Rotation })[0].components.rotation.angle;

    // Now remove the perk and compare
    e.getComponent(Perks)!.unlocked["navigation.warp"] = 0;
    perks.run();
    // Reset angle to 0 and run again
    world.query({ rotation: Rotation })[0].components.rotation.angle = 0;
    control.run();
    const noPerk = world.query({ rotation: Rotation })[0].components.rotation.angle;

    expect(Math.abs(withPerk)).toBeCloseTo(Math.abs(noPerk));
  });
});
