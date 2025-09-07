import type { EntityBuilder, World } from "../../../lib/ecs";
import type { EnemyView as OldEnemy } from "../../game/views";
import type { Planet as OldPlanet } from "../../game/planets";
import type { Player as OldPlayer } from "../../game/player";
import type { Projectile as OldProjectile } from "../../game/projectiles";
import * as Components from "../components";
import { DamageType } from "../../game/damage/DamageableEntity";
import { xpRequired } from "../../leveling/xp";

export function createPlayerEntity(world: World, player: OldPlayer): EntityBuilder {
  return world
    .createEntity()
    .addComponent(Components.Position, { x: player.state.x, y: player.state.y })
    .addComponent(Components.Velocity, { dx: player.state.vx, dy: player.state.vy })
    .addComponent(Components.Rotation, { angle: player.state.angle })
    .addComponent(Components.Health, {
      current: player.state.health ?? 100,
      max: 100,
    })
    .addComponent(Components.Player)
    .addComponent(Components.PlayerInventory, {
      slots: 20,
      maxWeight: 100,
      currentWeight: 0, // TODO: Get actual weight from inventory
      items: [], // TODO: Get actual items from inventory
    })
    .addComponent(Components.PlayerPerkPoints, { unspent: 0 })
    .addComponent(Components.Perks, { unlocked: {} })
    .addComponent(Components.PlayerExperience, {
      current: player.state.experience ?? 0,
      level: 1,
      toNextLevel: xpRequired(1),
    })
    .addComponent(Components.Collider, { radius: 16 })
    .addComponent(Components.Sprite, { color: "#00ff00", scale: 1.0 })
    .addComponent(Components.Faction, { team: "player" })
    .addComponent(Components.SpaceMode)
    .addComponent(Components.WeaponCooldown, { remaining: 0, duration: 0.2 })
    .addComponent(Components.SelectedAmmo, { type: "standard" })
    .addComponent(Components.PlayerModifiers, {
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
}

export function createEnemyEntity(world: World, enemy: OldEnemy): EntityBuilder {
  return (
    world
      .createEntity()
      .addComponent(Components.Position, { x: enemy.x, y: enemy.y })
      .addComponent(Components.Velocity, { dx: enemy.vx, dy: enemy.vy })
      .addComponent(Components.Rotation, { angle: enemy.angle })
      .addComponent(Components.Health, { current: enemy.health, max: enemy.health })
      .addComponent(Components.Enemy, { id: enemy.id })
      .addComponent(Components.AIVision, {
        radius: enemy.visionRadius,
        hysteresis: enemy.visionHysteresis,
        hasTarget: false,
      })
      .addComponent(Components.AIMovement, {
        turnSpeed: enemy.turnSpeed,
        accel: enemy.accel,
        maxSpeed: enemy.maxSpeed,
      })
      .addComponent(Components.AIState, {
        currentState: "idle",
        stateTime: 0,
      })
      .addComponent(Components.Collider, { radius: enemy.radius })
      .addComponent(Components.Sprite, { color: "#ff0000", scale: 1.0 })
      .addComponent(Components.Faction, { team: "enemy" })
      // Default combat capabilities
      .addComponent(Components.RangedWeapon, {
        cooldown: 0.9,
        remaining: 0,
        projectileSpeed: 520,
        spread: 0.1,
        damage: 12,
        range: Math.max(400, enemy.visionRadius * 0.8),
        color: "#ff5555",
      })
      .addComponent(Components.MeleeWeapon, {
        cooldown: 0.9,
        remaining: 0,
        damage: 8,
        range: 28,
      })
      // Basic drop table so enemies can drop items on death (planet/space)
      .addComponent(Components.LootDropTable, {
        guaranteed: [
          { itemTemplateId: "body_parts", minQuantity: 1, maxQuantity: 2, probability: 1.0 },
        ],
        possible: [
          { itemTemplateId: "health_pack_small", minQuantity: 1, maxQuantity: 1, probability: 0.4 },
          { itemTemplateId: "xp_pack_small", minQuantity: 1, maxQuantity: 3, probability: 0.6 },
          { itemTemplateId: "alien_beer", minQuantity: 1, maxQuantity: 1, probability: 0.2 },
          { itemTemplateId: "flashlight", minQuantity: 1, maxQuantity: 1, probability: 0.15 },
        ],
        rare: [
          {
            itemTemplateId: "health_pack_large",
            minQuantity: 1,
            maxQuantity: 1,
            probability: 0.08,
          },
          { itemTemplateId: "melee_knife", minQuantity: 1, maxQuantity: 1, probability: 0.05 },
          { itemTemplateId: "gun_pistol", minQuantity: 1, maxQuantity: 1, probability: 0.02 },
        ],
        modifiers: [
          {
            type: "damage_type_bonus",
            condition: { damageType: DamageType.ENERGY },
            multiplier: 1.0,
          },
        ],
      })
      .addComponent(Components.SpaceMode)
  );
}

export function createPlanetEntity(world: World, planet: OldPlanet): EntityBuilder {
  return world
    .createEntity()
    .addComponent(Components.Position, { x: planet.x, y: planet.y })
    .addComponent(Components.Collider, { radius: planet.radius })
    .addComponent(Components.Planet, { id: planet.id })
    .addComponent(Components.Sprite, {
      color: planet.color,
      design: planet.design,
      scale: 1.0,
    })
    .addComponent(Components.SpaceMode);
}

export function createProjectileEntity(
  world: World,
  projectile: OldProjectile,
  damage = 25,
): EntityBuilder {
  return world
    .createEntity()
    .addComponent(Components.Position, { x: projectile.x, y: projectile.y })
    .addComponent(Components.Velocity, { dx: projectile.vx, dy: projectile.vy })
    .addComponent(Components.Projectile)
    .addComponent(Components.TimeToLive, {
      remaining: projectile.ttl,
      initial: projectile.ttl,
    })
    .addComponent(Components.Damage, { amount: damage })
    .addComponent(Components.Collider, { radius: projectile.radius })
    .addComponent(Components.Sprite, { color: "#ffff00", scale: 0.5 })
    .addComponent(Components.SpaceMode);
}

// Quick entity creation for new game setup
export function createBasicPlayer(world: World, x = 0, y = 0): EntityBuilder {
  return world
    .createEntity()
    .addComponent(Components.Position, { x, y })
    .addComponent(Components.Velocity, { dx: 0, dy: 0 })
    .addComponent(Components.Rotation, { angle: 0 })
    .addComponent(Components.Health, { current: 100, max: 100 })
    .addComponent(Components.Player)
    .addComponent(Components.PlayerInventory, {
      slots: 20,
      maxWeight: 100,
      currentWeight: 0,
      items: [],
    })
    .addComponent(Components.PlayerPerkPoints, { unspent: 0 })
    .addComponent(Components.Perks, { unlocked: {} })
    .addComponent(Components.PlayerExperience, {
      current: 0,
      level: 1,
      toNextLevel: xpRequired(1),
    })
    .addComponent(Components.Collider, { radius: 16 })
    .addComponent(Components.Sprite, { color: "#00ff00", scale: 1.0 })
    .addComponent(Components.Faction, { team: "player" })
    .addComponent(Components.SpaceMode)
    .addComponent(Components.WeaponCooldown, { remaining: 0, duration: 0.2 })
    .addComponent(Components.SelectedAmmo, { type: "standard" })
    .addComponent(Components.PlayerModifiers, {
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
}

export function createBasicEnemy(world: World, id: string, x: number, y: number): EntityBuilder {
  return world
    .createEntity()
    .addComponent(Components.Position, { x, y })
    .addComponent(Components.Velocity, { dx: 0, dy: 0 })
    .addComponent(Components.Rotation, { angle: 0 })
    .addComponent(Components.Health, { current: 50, max: 50 })
    .addComponent(Components.Enemy, { id })
    .addComponent(Components.AIVision, {
      radius: 700,
      hysteresis: 80,
      hasTarget: false,
    })
    .addComponent(Components.AIMovement, {
      turnSpeed: 1.8,
      accel: 100,
      maxSpeed: 80,
    })
    .addComponent(Components.AIState, {
      currentState: "idle",
      stateTime: 0,
    })
    .addComponent(Components.Collider, { radius: 14 })
    .addComponent(Components.Sprite, { color: "#ff0000", scale: 1.0 })
    .addComponent(Components.Faction, { team: "enemy" })
    .addComponent(Components.RangedWeapon, {
      cooldown: 0.9,
      remaining: 0,
      projectileSpeed: 520,
      spread: 0.12,
      damage: 12,
      range: 520,
      color: "#ff5555",
    })
    .addComponent(Components.MeleeWeapon, {
      cooldown: 0.7,
      remaining: 0,
      damage: 10,
      range: 28,
    })
    .addComponent(Components.LootDropTable, {
      guaranteed: [
        { itemTemplateId: "body_parts", minQuantity: 1, maxQuantity: 3, probability: 1.0 },
      ],
      possible: [
        { itemTemplateId: "health_pack_small", minQuantity: 1, maxQuantity: 2, probability: 0.5 },
        { itemTemplateId: "xp_pack_small", minQuantity: 2, maxQuantity: 4, probability: 0.7 },
        { itemTemplateId: "rocket_fuel", minQuantity: 1, maxQuantity: 1, probability: 0.3 },
        { itemTemplateId: "towel", minQuantity: 1, maxQuantity: 1, probability: 0.1 },
      ],
      rare: [
        { itemTemplateId: "health_pack_large", minQuantity: 1, maxQuantity: 1, probability: 0.12 },
        { itemTemplateId: "gun_rifle", minQuantity: 1, maxQuantity: 1, probability: 0.06 },
        { itemTemplateId: "shield_mk1", minQuantity: 1, maxQuantity: 1, probability: 0.04 },
        { itemTemplateId: "ten_foot_pole", minQuantity: 1, maxQuantity: 1, probability: 0.03 },
      ],
      modifiers: [
        {
          type: "damage_type_bonus",
          condition: { damageType: DamageType.ENERGY },
          multiplier: 1.0,
        },
      ],
    })
    .addComponent(Components.SpaceMode);
}

export function createBasicPlanet(
  world: World,
  id: string,
  x: number,
  y: number,
  radius = 60,
): EntityBuilder {
  const colors = ["#4a90e2", "#e2a04a", "#4ae264", "#e24a90", "#9c4ae2"];
  const designs: Array<"solid" | "ringed" | "striped" | "spotted"> = [
    "solid",
    "ringed",
    "striped",
    "spotted",
  ];

  return world
    .createEntity()
    .addComponent(Components.Position, { x, y })
    .addComponent(Components.Collider, { radius })
    .addComponent(Components.Planet, { id })
    .addComponent(Components.Sprite, {
      color: colors[Math.floor(Math.random() * colors.length)],
      design: designs[Math.floor(Math.random() * designs.length)],
      scale: 1.0,
    })
    .addComponent(Components.SpaceMode);
}

export function createStar(
  world: World,
  id: string,
  x: number,
  y: number,
  radius = 140,
  color = "#ffcc66",
): EntityBuilder {
  return world
    .createEntity()
    .addComponent(Components.Position, { x, y })
    .addComponent(Components.Collider, { radius })
    .addComponent(Components.Star, { id })
    .addComponent(Components.Sprite, { color, scale: 1.0, opacity: 1.0 })
    .addComponent(Components.SpaceMode);
}

export function createOrbitingPlanet(
  world: World,
  opts: {
    id: string;
    color: string;
    design: "solid" | "ringed" | "striped" | "spotted";
    radius: number;
    centerId: number;
    orbitRadius: number;
    orbitSpeed: number; // radians/sec
    angle: number; // initial angle
  },
): EntityBuilder {
  // Seed initial position on orbit
  // We'll place at (0,0) and let OrbitSystem update this frame; set approximate start
  const entity = world
    .createEntity()
    .addComponent(Components.Position, { x: 0, y: 0 })
    .addComponent(Components.Collider, { radius: opts.radius })
    .addComponent(Components.Planet, { id: opts.id })
    .addComponent(Components.Sprite, {
      color: opts.color,
      design: opts.design,
      scale: 1.0,
    })
    .addComponent(Components.Orbit, {
      centerId: opts.centerId,
      radius: opts.orbitRadius,
      speed: opts.orbitSpeed,
      angle: opts.angle,
    })
    .addComponent(Components.SpaceMode);

  return entity;
}
