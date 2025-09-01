import type { PerkDefinition, PerkId } from "./types";

const makePerkDef = (
  id: PerkId,
  name: string,
  description: string,
  tiers: PerkDefinition["tiers"],
  category: PerkDefinition["category"],
): PerkDefinition => ({ id, name, description, tiers, category });

export const perkDefinitions: readonly PerkDefinition[] = [
  makePerkDef(
    "navigation.drift-mastery",
    "Drift Mastery",
    "Tighter turn response and reduced drift.",
    [
      {
        tier: 1,
        cost: 1,
        requiresLevel: 1,
        effects: [
          { kind: "stat-mod", target: "turnSpeedMult", value: 0.15 },
          { kind: "stat-mod", target: "dragReduction", value: 0.01 },
        ],
      },
      {
        tier: 2,
        cost: 1,
        requiresLevel: 5,
        requires: ["navigation.drift-mastery"],
        effects: [
          { kind: "stat-mod", target: "turnSpeedMult", value: 0.15 },
          { kind: "stat-mod", target: "dragReduction", value: 0.01 },
        ],
      },
    ],
    "navigation",
  ),
  makePerkDef(
    "navigation.star-cartographer",
    "Star Cartographer",
    "Reveals nearby POIs; boosts exploration XP.",
    [
      {
        tier: 1,
        cost: 1,
        requiresLevel: 2,
        effects: [{ kind: "system-hook", target: "sensorRange", value: 1 }],
      },
      {
        tier: 2,
        cost: 1,
        requiresLevel: 6,
        requires: ["navigation.star-cartographer"],
        effects: [{ kind: "stat-mod", target: "explorationXpMult", value: 0.2 }],
      },
    ],
    "navigation",
  ),
  makePerkDef(
    "navigation.efficient-burn",
    "Efficient Burn",
    "Reduced boost costs; improved acceleration.",
    [
      {
        tier: 1,
        cost: 1,
        requiresLevel: 3,
        effects: [{ kind: "stat-mod", target: "accelMult", value: 0.1 }],
      },
      {
        tier: 2,
        cost: 1,
        requiresLevel: 7,
        effects: [{ kind: "stat-mod", target: "boostCostMult", value: -0.1 }],
      },
    ],
    "navigation",
  ),
  makePerkDef(
    "combat.targeting-suite",
    "Targeting Suite",
    "Improved accuracy; reduces projectile spread.",
    [
      {
        tier: 1,
        cost: 1,
        requiresLevel: 1,
        excludes: ["combat.spray-and-pray"],
        effects: [{ kind: "stat-mod", target: "projectileSpreadMult", value: -0.4 }],
      },
      {
        tier: 2,
        cost: 1,
        requiresLevel: 6,
        requires: ["combat.targeting-suite"],
        effects: [{ kind: "stat-mod", target: "projectileSpreadMult", value: -0.1 }],
      },
    ],
    "combat",
  ),
  makePerkDef(
    "combat.spray-and-pray",
    "Spray and Pray",
    "High spread but increased fire volume.",
    [
      {
        tier: 1,
        cost: 1,
        requiresLevel: 1,
        excludes: ["combat.targeting-suite"],
        effects: [{ kind: "stat-mod", target: "projectileSpreadMult", value: 0.6 }],
      },
    ],
    "combat",
  ),
  makePerkDef(
    "combat.overcharge-capacitors",
    "Overcharge Capacitors",
    "Increased weapon damage; risk of overheat.",
    [
      {
        tier: 1,
        cost: 1,
        requiresLevel: 4,
        effects: [{ kind: "stat-mod", target: "weaponDamageMult", value: 0.2 }],
      },
      {
        tier: 2,
        cost: 2,
        requiresLevel: 8,
        effects: [{ kind: "stat-mod", target: "weaponDamageMult", value: 0.2 }],
      },
    ],
    "combat",
  ),
  makePerkDef(
    "combat.shield-harmonizer",
    "Shield Harmonizer",
    "Shields regenerate faster after delay.",
    [
      {
        tier: 1,
        cost: 1,
        requiresLevel: 3,
        effects: [{ kind: "system-hook", target: "shieldRegenDelayDelta", value: -0.5 }],
      },
      {
        tier: 2,
        cost: 1,
        requiresLevel: 7,
        effects: [{ kind: "stat-mod", target: "shieldRegenRateMult", value: 0.2 }],
      },
    ],
    "combat",
  ),
  makePerkDef(
    "engineering.scavenger",
    "Scavenger",
    "Increased resource drops from wrecks and flora.",
    [
      {
        tier: 1,
        cost: 1,
        requiresLevel: 1,
        effects: [{ kind: "stat-mod", target: "lootQuantityMult", value: 0.25 }],
      },
      {
        tier: 2,
        cost: 1,
        requiresLevel: 5,
        effects: [{ kind: "stat-mod", target: "lootQuantityMult", value: 0.25 }],
      },
    ],
    "engineering",
  ),
  makePerkDef(
    "engineering.modular-hardpoints",
    "Modular Hardpoints",
    "+1 auxiliary slot for powerups.",
    [
      {
        tier: 1,
        cost: 2,
        requiresLevel: 6,
        effects: [{ kind: "system-hook", target: "auxSlotsDelta", value: 1 }],
      },
    ],
    "engineering",
  ),
  makePerkDef(
    "survival.hazard-training",
    "Hazard Training",
    "Reduced environmental damage.",
    [
      {
        tier: 1,
        cost: 1,
        requiresLevel: 2,
        effects: [{ kind: "stat-mod", target: "hazardDamageMult", value: -0.2 }],
      },
      {
        tier: 2,
        cost: 1,
        requiresLevel: 6,
        effects: [{ kind: "stat-mod", target: "hazardDamageMult", value: -0.2 }],
      },
    ],
    "survival",
  ),
  makePerkDef(
    "survival.emergency-reserve",
    "Emergency Reserve",
    "One-time auto-shield on lethal hit.",
    [
      {
        tier: 1,
        cost: 2,
        requiresLevel: 6,
        effects: [{ kind: "system-hook", target: "autoShieldReserve", value: 1 }],
      },
    ],
    "survival",
  ),
  makePerkDef(
    "survival.field-rations",
    "Field Rations",
    "Passive trickle heal outside combat.",
    [
      {
        tier: 1,
        cost: 1,
        requiresLevel: 3,
        effects: [{ kind: "stat-mod", target: "outOfCombatRegen", value: 1 }],
      },
    ],
    "survival",
  ),
];
