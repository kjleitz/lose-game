import { defineSystem } from "../../../lib/ecs/dist";
import type { World } from "../../../lib/ecs/dist";
import {
  Position,
  Rotation,
  Player,
  WeaponCooldown,
  Projectile,
  Velocity,
  TimeToLive,
  Damage,
  Collider,
  Sprite,
} from "../components";

export function createWeaponSystem(world: World, actions: Set<string>) {
  return defineSystem(world)
    .withComponents({ position: Position, rotation: Rotation, player: Player })
    .withOptionalComponents({ weaponCooldown: WeaponCooldown })
    .execute((entities) => {
      entities.forEach(({ components }) => {
        const { position, rotation, weaponCooldown } = components;

        // Check if player wants to fire and weapon is ready
        const canFire = weaponCooldown === undefined || weaponCooldown.remaining <= 0;
        const wantsToFire = actions.has("Space") || actions.has("KeyX");

        if (wantsToFire && canFire) {
          // Create projectile
          const speed = 600;
          const dirX = Math.cos(rotation.angle);
          const dirY = Math.sin(rotation.angle);
          const spawnDistance = 28;

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
            .addComponent(Sprite, { color: "#ffff00", scale: 0.5 });

          // Set weapon cooldown if component exists
          if (weaponCooldown) {
            weaponCooldown.remaining = weaponCooldown.duration;
          }
        }
      });
    });
}
