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
import { Perks, SelectedAmmo, ProjectileAmmo } from "../components";
import type { AmmoType } from "../../../shared/types/combat";
import { getAmmoProfile } from "../../../shared/types/combat";

export function createWeaponSystem(world: World, actions: Set<Action>): System {
  return defineSystem(world)
    .withComponents({ position: Position, rotation: Rotation, player: Player })
    .withOptionalComponents({ weaponCooldown: WeaponCooldown, mods: PlayerModifiers, perks: Perks })
    .execute((entities): void => {
      entities.forEach(({ entity, components }) => {
        const { position, rotation, weaponCooldown, mods } = components;

        // Check if player wants to fire and weapon is ready
        const canFire = weaponCooldown === undefined || weaponCooldown.remaining <= 0;
        // Use normalized action names, not key codes
        const wantsToFire = actions.has("fire");

        if (wantsToFire && canFire) {
          // Determine ammo profile (perk-gated). Default baseline values.
          const perkTier = components.perks?.unlocked["combat.new-ammo-and-weapons"] ?? 0;

          // Baseline weapon stats (may be overridden by ammo profile)
          let speed = 600;
          let damage = 25;
          // Visual hint remains handled by renderer; Sprite color is not read in space mode.

          // Resolve ammo to use for this shot
          let ammoUsed: AmmoType = "standard";
          if (perkTier > 0) {
            const ent = new ECSEntity(entity, world);
            const selected: AmmoType | undefined = ent.getComponent(SelectedAmmo)?.type;
            // If the player has selected an ammo, use it; otherwise keep Standard.
            if (selected != null) ammoUsed = selected;
          }

          // Map ammo to stats and cooldown
          const profile = getAmmoProfile(ammoUsed);
          speed = profile.speed;
          damage = profile.damage;

          // Create projectile
          const baseSpread = profile.spread; // ammo-driven accuracy
          const spread = baseSpread * (mods?.projectileSpreadMult ?? 1);
          const jitter = (Math.random() * 2 - 1) * spread;
          const fireAngle = rotation.angle + jitter;
          const dirX = Math.cos(fireAngle);
          const dirY = Math.sin(fireAngle);
          const spawnDistance = 28;

          const shooterFaction = new ECSEntity(entity, world).getComponent(Faction)?.team;
          const builder = world
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
            .addComponent(Damage, { amount: damage })
            .addComponent(Collider, { radius: 2 })
            .addComponent(Sprite, { color: "#ffff00", scale: 0.5 })
            .addComponent(Faction, { team: shooterFaction ?? "player" })
            .addComponent(JustFired, { team: shooterFaction ?? "player" });

          // Tag projectile with ammo type for renderers
          builder.addComponent(ProjectileAmmo, { type: ammoUsed });

          // Set weapon cooldown if component exists (duration follows ammo)
          if (weaponCooldown) {
            weaponCooldown.duration = profile.cooldown;
            weaponCooldown.remaining = weaponCooldown.duration;
          }
        }
      });
    });
}
