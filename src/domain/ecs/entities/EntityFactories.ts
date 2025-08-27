import type { EntityBuilder, World } from "../../../lib/ecs";
import type { Enemy as OldEnemy } from "../../game/enemies";
import type { Planet as OldPlanet } from "../../game/planets";
import type { Player as OldPlayer } from "../../game/player";
import type { Projectile as OldProjectile } from "../../game/projectiles";
import * as Components from "../components";

export function createPlayerEntity(world: World, player: OldPlayer): EntityBuilder {
  return world
    .createEntity()
    .addComponent(Components.Position, { x: player.state.x, y: player.state.y })
    .addComponent(Components.Velocity, { dx: player.state.vx, dy: player.state.vy })
    .addComponent(Components.Rotation, { angle: player.state.angle })
    .addComponent(Components.Health, {
      current: player.state.health || 100,
      max: 100,
    })
    .addComponent(Components.Player)
    .addComponent(Components.PlayerInventory, {
      slots: 20,
      maxWeight: 100,
      currentWeight: 0, // TODO: Get actual weight from inventory
      items: [], // TODO: Get actual items from inventory
    })
    .addComponent(Components.PlayerExperience, {
      current: player.state.experience || 0,
      level: 1,
      toNextLevel: 100,
    })
    .addComponent(Components.Collider, { radius: 16 })
    .addComponent(Components.Sprite, { color: "#00ff00", scale: 1.0 })
    .addComponent(Components.SpaceMode)
    .addComponent(Components.WeaponCooldown, { remaining: 0, duration: 0.2 });
}

export function createEnemyEntity(world: World, enemy: OldEnemy): EntityBuilder {
  return world
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
    .addComponent(Components.SpaceMode);
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
    .addComponent(Components.PlayerExperience, {
      current: 0,
      level: 1,
      toNextLevel: 100,
    })
    .addComponent(Components.Collider, { radius: 16 })
    .addComponent(Components.Sprite, { color: "#00ff00", scale: 1.0 })
    .addComponent(Components.SpaceMode)
    .addComponent(Components.WeaponCooldown, { remaining: 0, duration: 0.2 });
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
