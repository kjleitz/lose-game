# Leveling System: Perks, Powerups, and Progression

This document proposes a robust, extensible leveling system that fits the game’s ECS architecture and dual modes (space/planet). It emphasizes meaningful choices on level-up, synergies with temporary powerups, clear balance levers, and clean save/load integration.

## Goals

- Deliver steady, satisfying progression without grind or stat bloat.
- Reward different play styles (navigation, combat, engineering, survival) via perks.
- Make temporary powerups exciting, especially when combined with unlocked perks.
- Keep implementation modular and testable across systems and modes.

## Core Concepts

- Experience (XP): Earned from combat, exploration, objectives, and discoveries. Tuned to reward engaged play and risk.
- Level: Gated by a deterministic curve. Each level grants perk points and occasional baseline stat bumps.
- Perks: Persistent, player-chosen upgrades with category trees and synergies. Unlocks cost perk points earned on level-up.
- Powerups: Short-lived pickups that temporarily amplify capabilities. Enhanced by certain perks.

## XP & Level Curve

- XP gain sources:
  - Combat: enemy defeated, assist, boss phase cleared.
  - Exploration: sector charted, biome landmark, artifact scanned.
  - Objectives: mission steps, rescue, delivery, story beats.
- Curve: `xpRequired(level) = round(50 * level^2 + 50 * level)`.
  - Level 1→2: 100 XP; 2→3: 300 XP; 3→4: 600 XP; 4→5: 1000 XP; 5→6: 1500 XP.
  - Smooth quadratic growth keeps early levels brisk and later levels meaningful.
- Overflow handling: excess XP carries over on level-ups.
- Soft cap: Post-cap scaling switches to linear pads or awards only currency/vanity to avoid runaway stats.

## Perk Trees

Perks are grouped by category. Each perk defines effects, prerequisites, and whether it modifies base stats, systems, or powerups.

- Navigation
  - Drift Mastery: reduced inertia penalties; tighter turn response.
  - Star Cartographer: reveals nearby POIs; increases exploration XP.
  - Efficient Burn: reduced fuel/energy costs for boosts.
- Combat
  - Targeting Suite: improved accuracy/convergence; projectile spread reduction.
  - Overcharge Capacitors: increased weapon damage; overheats faster (tradeoff).
  - Shield Harmonizer: shields regenerate faster after delay.
- Engineering
  - Rapid Repair: faster hull/structure repair while stationary.
  - Scavenger: increased resource drops from wrecks.
  - Modular Hardpoints: +1 auxiliary slot (enables more powerup effects).
- Survival
  - Hazard Training: reduced environmental damage (radiation, heat, storms).
  - Emergency Reserve: one-time auto-shield on lethal hit (long cooldown).
  - Field Rations: passive trickle heal outside combat.

Perk structure and rules:

- Tiers: perks may have 1–3 tiers; higher tiers require previous tier and level threshold.
- Prerequisites: graph edges ensure coherent paths (e.g., Overcharge II requires Overcharge I + Level ≥ 6).
- Cost: 1 perk point per tier unless otherwise specified; late-tier perks can cost 2.
- Conflicts: mutually exclusive perks (e.g., Accuracy vs. Spray-and-Pray) present meaningful choices.

## Powerups (Temporary Buffs)

Pickup items that apply a buff for a duration. Some scale with level, others synergize with perks.

- Damage Booster: +25% weapon damage for 20s. Synergy: Overcharge Capacitors boosts to +35%.
- Kinetic Shield: +200 shield buffer for 15s. Synergy: Shield Harmonizer doubles post-buff regen.
- Afterburner: +40% thrust and top speed for 8s; tighter turning with Drift Mastery.
- Sensor Sweep: reveals enemies/loot within radius; longer duration with Star Cartographer.
- Time Dilation: slows nearby hazards/projectiles slightly for 5s; cooldown reduction with Hazard Training.

Rules:

- Stacking: same-type powerups refresh duration; different types can stack.
- Diminishing: some effects apply DR when combined with certain perks to avoid runaway scaling.
- UI: HUD shows icons with timers; tooltip lists perk synergies when present.

## Data Model (Domain Types)

These types guide implementation; keep them in `src/domain/leveling/` and shared enums under `src/shared/`.

```ts
export interface ExperienceState {
  xp: number;
  level: number; // >= 1
  unspentPerkPoints: number;
}

export type PerkId =
  | "navigation.drift-mastery"
  | "navigation.star-cartographer"
  | "navigation.efficient-burn"
  | "combat.targeting-suite"
  | "combat.overcharge-capacitors"
  | "combat.shield-harmonizer"
  | "engineering.rapid-repair"
  | "engineering.scavenger"
  | "engineering.modular-hardpoints"
  | "survival.hazard-training"
  | "survival.emergency-reserve"
  | "survival.field-rations";

export interface PerkTier {
  tier: number; // 1..n
  cost: number; // perk points
  requiresLevel?: number;
  requires?: PerkId[]; // prerequisite perks/tiers
  excludes?: PerkId[]; // mutually exclusive nodes
  effects: readonly PerkEffect[];
}

export interface PerkDefinition {
  id: PerkId;
  category: "navigation" | "combat" | "engineering" | "survival";
  name: string;
  description: string;
  tiers: readonly PerkTier[];
}

export type PowerupId =
  | "powerup.damage-booster"
  | "powerup.kinetic-shield"
  | "powerup.afterburner"
  | "powerup.sensor-sweep"
  | "powerup.time-dilation";

export interface ActiveBuff {
  id: PowerupId;
  expiresAtMs: number;
  stacks?: number;
}

export interface PerkEffect {
  kind:
    | "stat-mod" // e.g., +10% weaponDamage
    | "system-hook" // e.g., change regen delay
    | "powerup-synergy"; // e.g., increase buff multiplier/duration
  target: string; // named stat or hook id
  value: number; // additive or multiplier depending on target semantics
}

export interface LevelingConfig {
  xpRequired: (level: number) => number;
  perks: readonly PerkDefinition[];
}
```

## ECS Integration

- Components
  - `ExperienceComponent` (player): XP, level, unspent perk points.
  - `PerksComponent` (player): unlocked perk tiers (set of `PerkId` with tier info).
  - `BuffsComponent` (player): active `ActiveBuff[]` with expiry timestamps.
  - `StatsComponent` (player/ship): derived final stats used by combat/movement.
- Systems
  - `XPGainSystem`: listens for events (enemy defeated, POI discovered), increments XP.
  - `LevelUpSystem`: converts overflow XP into levels; awards perk points; fires `LevelUpEvent`.
  - `PerkUnlockSystem`: applies chosen perk tiers, validates prerequisites/exclusions.
  - `BuffSystem`: applies/removes `ActiveBuff`s; refreshes durations on pickup.
  - `StatComputeSystem`: recomputes final stats from base + perk effects + active buffs, once per tick or on dirty flags.
- Ordering (within the frame): input → physics → combat/results → XP gain → level-up → stat recompute → render.

## HUD & UX

- XP Bar: progress bar with numeric level. Pulses on level-up.
- Perk Modal: opens on level-up; shows categories/tiers, requirements, and preview of effects.
- Buff Tray: small icons with countdown rings and tooltips; highlights synergies taken.
- Notifications: toast for XP events (rare/big), level-ups, mutually exclusive choices.

## Save/Load

- Persist: XP, level, unspent points, unlocked perk tiers, and (optionally) active buffs with remaining durations for mid-run saves.
- Backward-compatible migrations: default missing fields; rev map removed/moved perks.

## Balancing Levers

- XP rate per source; curve constant (50/50); boss/mission bonuses.
- Stat ceilings per category to avoid runaway stacking (e.g., cap accuracy spread reduction).
- Diminishing returns on overlapping buffs + perks.
- Cooldowns/durations on powerups; spawn rates and rarity.

## Testing Strategy

- Unit: xp curve function, prerequisite/exclusion graph validation, perk application math.
- Integration: XP gain → level-up → modal → perk selection → stat recompute.
- UI: HUD renders level/progress; modal selection flow; buff timers tick down.

---

## Phased Implementation Plan

1. Domain types and config scaffolding

- Add `src/domain/leveling/` with types and `LevelingConfig` (curve + perk defs). Include unit tests for `xpRequired` and graph validation.

2. ECS components and core systems

- Add `ExperienceComponent`, `PerksComponent`, `BuffsComponent`, `StatsComponent`.
- Implement `XPGainSystem`, `LevelUpSystem`, and `StatComputeSystem` with events.
- Add minimal integration tests for XP → level flow.

3. Save/load integration

- Extend session save schema to include leveling state and (optional) active buffs.
- Add migration shims for missing fields.

4. HUD basics

- Add XP bar (HUD widget) and level indicator in `src/ui/hud/`.
- Add toasts for level-ups and significant XP events.

5. Perk selection UI

- Add perk modal with categories/tiers, prerequisites, conflicts, and previews.
- Wire to `PerkUnlockSystem` via application layer actions.

6. Powerups and buffs

- Add powerup pickups and `BuffSystem` application/removal logic.
- Implement 3–5 initial powerups with perk synergies.

7. Balance pass + telemetry hooks

- Tweak curve/constants; add basic telemetry counters for XP sources and perk choices.

8. Polish and docs

- Finalize empty-state UX, accessibility labels, and finalize documentation.

---

## Notes for Implementation

- Keep perk effects declarative. Systems interpret `PerkEffect` targets (e.g., `combat.weaponDamage: +0.10`).
- Use dirty flags to recompute stats only when XP/level/perks/buffs change.
- Prefer composition over deeply nested conditionals; build small mappers from perk/buff effects to stat modifiers.
