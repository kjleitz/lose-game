import { defineComponent } from "../../../lib/ecs";
import type { Point2D } from "../../../shared/types/geometry";
import type { Item } from "../../game/items/Item";
import type { DropTable } from "../../game/damage/DamageableEntity";

// Transform components
export const Position = defineComponent<Point2D>();
export const Velocity = defineComponent<{ dx: number; dy: number }>();
export const Rotation = defineComponent<{ angle: number }>();

// Physics components
export const Collider = defineComponent<{ radius: number }>();
export const RigidBody = defineComponent<{ mass: number }>();

// Entity type tags
export const Player = defineComponent<Record<string, never>>(() => ({}));
export const Enemy = defineComponent<{ id: string }>();
export const Planet = defineComponent<{ id: string }>();
export const Projectile = defineComponent<Record<string, never>>(() => ({}));

// Faction/team alignment for friendly-fire rules
export const Faction = defineComponent<{ team: "player" | "enemy" | "neutral" }>();

// Game mechanics
export const Health = defineComponent<{ current: number; max: number }>();
export const Damage = defineComponent<{ amount: number }>();
export const TimeToLive = defineComponent<{ remaining: number; initial: number }>();

// AI components
export const AIVision = defineComponent<{
  radius: number;
  hysteresis: number;
  hasTarget: boolean;
  targetId?: number;
}>();

export const AIMovement = defineComponent<{
  turnSpeed: number;
  accel: number;
  maxSpeed: number;
}>();

export const AIState = defineComponent<{
  currentState: "idle" | "pursuing" | "attacking" | "fleeing";
  stateTime: number;
}>();

// Visual components
export const Sprite = defineComponent<{
  color: string;
  design?: "solid" | "ringed" | "striped" | "spotted";
  scale?: number;
  opacity?: number;
}>();

export interface TrailPoint extends Point2D {
  age: number;
}
export const Trail = defineComponent<{
  points: Array<TrailPoint>;
  maxLength: number;
  fadeTime: number;
}>();

// Player-specific
export const PlayerInventory = defineComponent<{
  slots: number;
  maxWeight: number;
  currentWeight: number;
  items: Item[];
}>();

export const PlayerExperience = defineComponent<{
  current: number;
  level: number;
  toNextLevel: number;
}>();

export const PlayerPerkPoints = defineComponent<{
  unspent: number;
}>();

export const Perks = defineComponent<{
  // map of perk id to current unlocked tier (0 if locked, omitted if not started)
  unlocked: Record<string, number>;
}>();

export const PlayerModifiers = defineComponent<{
  turnSpeedMult: number; // scales ship turn speed
  accelMult: number; // scales ship acceleration
  maxSpeedMult: number; // scales ship max speed
  dragReduction: number; // subtract from drag factor (e.g., 0.01 -> 0.97 from 0.98)
  walkSpeedMult: number; // scales planet walk speed
  runSpeedMult: number; // scales planet run speed
  frictionMult: number; // scales planet friction
  projectileSpreadMult: number; // multiplies base projectile spread (lower is better accuracy)
  lootQuantityMult: number; // multiplies loot quantities from drops
}>();

// Game modes
export const SpaceMode = defineComponent<Record<string, never>>(() => ({}));
export const PlanetMode = defineComponent<{
  planetId: string;
  surfacePosition: Point2D;
}>();

// Weapon system
export const WeaponCooldown = defineComponent<{
  remaining: number;
  duration: number;
}>();

// Enemy combat stats (ranged)
export const RangedWeapon = defineComponent<{
  cooldown: number; // seconds between shots
  remaining: number; // seconds until next shot
  projectileSpeed: number;
  spread: number; // radians randomization
  damage: number;
  range: number; // max effective range to fire
  color?: string; // projectile color hint
}>();

// Enemy combat stats (melee)
export const MeleeWeapon = defineComponent<{
  cooldown: number; // seconds between strikes
  remaining: number; // seconds until next strike
  damage: number;
  range: number; // effective strike distance (center-to-center)
}>();

// Looting and drops
export const LootDropTable = defineComponent<DropTable>();
export const DroppedItem = defineComponent<{
  item: Item;
  quantity: number;
  ageSeconds: number;
  sourceEntity?: string;
}>();
