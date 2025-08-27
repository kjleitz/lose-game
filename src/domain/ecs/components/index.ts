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

// Looting and drops
export const LootDropTable = defineComponent<DropTable>();
export const DroppedItem = defineComponent<{
  item: Item;
  quantity: number;
  ageSeconds: number;
  sourceEntity?: string;
}>();
