import type { Action } from "../../../application/input/ActionTypes";
import type { System, World } from "../../../lib/ecs";
import { defineSystem } from "../../../lib/ecs";
import {
  Collider,
  Damage,
  Player,
  Position,
  Projectile,
  Rotation,
  Sprite,
  TimeToLive,
  Velocity,
  WeaponCooldown,
  Faction,
  JustFired,
} from "../components";
import { PlayerModifiers } from "../components";
import { Entity as ECSEntity } from "../../../lib/ecs";

export function createWeaponSystem(world: World, actions: Set<Action>): System {
  return defineSystem(world)
    .withComponents({ position: Position, rotation: Rotation, player: Player })
    .withOptionalComponents({ weaponCooldown: WeaponCooldown, mods: PlayerModifiers })
    .execute((entities): void => {
      entities.forEach(({ entity, components }) => {
        const { position, rotation, weaponCooldown, mods } = components;

        // Check if player wants to fire and weapon is ready
        const canFire = weaponCooldown === undefined || weaponCooldown.remaining <= 0;
        // Use normalized action names, not key codes
        const wantsToFire = actions.has("fire");

        if (wantsToFire && canFire) {
          // Create projectile
          const speed = 600;
          const baseSpread = 0.12; // ~7 degrees
          const spread = baseSpread * (mods?.projectileSpreadMult ?? 1);
          const jitter = (Math.random() * 2 - 1) * spread;
          const fireAngle = rotation.angle + jitter;
          const dirX = Math.cos(fireAngle);
          const dirY = Math.sin(fireAngle);
          const spawnDistance = 28;

          const shooterFaction = new ECSEntity(entity, world).getComponent(Faction)?.team;
          world
            .createEntity()
            .addComponent(Position, {
              x: position.x + dirX * spawnDistance,
              y: position.y + dirY * spawnDistance,
            })
            .addComponent(Velocity, {
              dx: dirX * speed,
              dy: dirY * speed,
            })
            .addComponent(Projectile)
            .addComponent(TimeToLive, { remaining: 1.5, initial: 1.5 })
            .addComponent(Damage, { amount: 25 })
            .addComponent(Collider, { radius: 2 })
            .addComponent(Sprite, { color: "#ffff00", scale: 0.5 })
            .addComponent(Faction, { team: shooterFaction ?? "player" })
            .addComponent(JustFired, { team: shooterFaction ?? "player" });

          // Set weapon cooldown if component exists
          if (weaponCooldown) {
            weaponCooldown.remaining = weaponCooldown.duration;
          }
        }
      });
    });
}
