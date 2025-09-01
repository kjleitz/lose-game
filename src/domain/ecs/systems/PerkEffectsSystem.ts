import type { World, System } from "../../../lib/ecs";
import { defineSystem } from "../../../lib/ecs";
import { Perks, Player, PlayerModifiers } from "../components";

export function createPerkEffectsSystem(world: World): System {
  return defineSystem(world)
    .withComponents({ player: Player, perks: Perks, mods: PlayerModifiers })
    .execute((entities): void => {
      entities.forEach(({ components }) => {
        const { perks, mods } = components;

        // Reset to defaults each frame; recompute from current perks
        mods.turnSpeedMult = 1;
        mods.accelMult = 1;
        mods.maxSpeedMult = 1;
        mods.dragReduction = 0;
        mods.walkSpeedMult = 1;
        mods.runSpeedMult = 1;
        mods.frictionMult = 1;
        mods.projectileSpreadMult = 1;
        mods.lootQuantityMult = 1;

        // Drift Mastery: better turn control and reduced drift
        const driftTier = perks.unlocked["navigation.drift-mastery"] ?? 0;
        if (driftTier > 0) {
          mods.turnSpeedMult += 0.15 * driftTier;
          mods.dragReduction += Math.min(0.02, 0.01 * driftTier); // cap 0.02 reduction
        }

        // Targeting Suite: reduce projectile spread
        const targetingTier = perks.unlocked["combat.targeting-suite"] ?? 0;
        if (targetingTier > 0) {
          const mult = 1 - Math.min(0.5, 0.4 * targetingTier); // tier1 -> 0.6, cap at 0.5
          mods.projectileSpreadMult *= mult;
        }

        // Scavenger: increase loot quantities
        const scavengerTier = perks.unlocked["engineering.scavenger"] ?? 0;
        if (scavengerTier > 0) {
          mods.lootQuantityMult *= 1 + 0.25 * scavengerTier; // tier1 -> +25%
        }

        // Other perks can be integrated here (e.g., targeting-suite to weapon systems)
      });
    });
}
