export interface ExperienceState {
  xp: number;
  level: number; // >= 1
  unspentPerkPoints: number;
}

export interface LevelingConfig {
  xpRequired: (level: number) => number;
}

export type PerkCategory =
  | "combat"
  | "ship"
  | "navigation"
  | "sensors"
  | "cosmetic"
  | "companions"
  | "structures"
  | "melee"
  | "thrusters"
  | "maneuvers"
  | "audio"
  | "camera"
  | "worldgen"
  | "multiplayer"
  | "environments"
  | "minigames"
  | "vehicles"
  | "society"
  | "economy"
  | "world"
  | "editor";

export type PerkId =
  | "combat.new-ammo-and-weapons"
  | "ship.new-variants"
  | "ship.double-base-acceleration"
  | "sensors.improved-radar"
  | "navigation.warp"
  | "cosmetic.new-paint-job"
  | "companions.ai-buddy"
  | "structures.space-station"
  | "melee.melee-weapon"
  | "companions.pet-animal"
  | "thrusters.strafing-thrusters"
  | "thrusters.reverse-thrusters"
  | "maneuvers.aerobatics"
  | "audio.radio"
  | "camera.zoom-out"
  | "worldgen.procedural-solar-system"
  | "worldgen.procedural-environment"
  | "multiplayer.core"
  | "environments.underground"
  | "environments.underwater"
  | "environments.in-the-clouds"
  | "minigames.space-invaders"
  | "combat.double-guns"
  | "camera.first-person-mode"
  | "combat.heat-seeking-missiles"
  | "companions.robots"
  | "combat.lasers"
  | "companions.fleets"
  | "worldgen.moons"
  | "worldgen.galaxies"
  | "vehicles.mech-suit"
  | "vehicles.boats"
  | "vehicles.airplanes"
  | "society.peaceful-tribes"
  | "society.cities"
  | "vehicles.blimps"
  | "economy.owning-property"
  | "world.damaging-asteroids"
  | "economy.asteroid-mining"
  | "editor.map-maker"
  | "editor.planet-designer"
  | "editor.solar-system-designer"
  // Implemented: separate aim in planet mode via mouse cursor
  | "combat.cursor-aim-planet";

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
  implemented: boolean; // when false, UI should disable/fade and unlocks are rejected
  tiers: readonly PerkTier[];
}
