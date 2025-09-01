export interface ExperienceState {
  xp: number;
  level: number; // >= 1
  unspentPerkPoints: number;
}

export interface LevelingConfig {
  xpRequired: (level: number) => number;
}

export type PerkCategory = "navigation" | "combat" | "engineering" | "survival";

export type PerkId =
  | "navigation.drift-mastery"
  | "navigation.star-cartographer"
  | "navigation.efficient-burn"
  | "combat.targeting-suite"
  | "combat.spray-and-pray"
  | "combat.overcharge-capacitors"
  | "combat.shield-harmonizer"
  | "engineering.scavenger"
  | "engineering.modular-hardpoints"
  | "survival.hazard-training"
  | "survival.emergency-reserve"
  | "survival.field-rations";

export interface PerkEffect {
  kind: "stat-mod" | "system-hook" | "powerup-synergy";
  target: string;
  value: number;
}

export interface PerkTier {
  tier: number; // 1..n
  cost: number; // perk points required for this tier
  requiresLevel?: number;
  requires?: PerkId[]; // prerequisite perk ids (any tier)
  excludes?: PerkId[]; // mutually exclusive perk ids
  effects?: readonly PerkEffect[];
}

export interface PerkDefinition {
  id: PerkId;
  category: PerkCategory;
  name: string;
  description: string;
  tiers: readonly PerkTier[];
}
