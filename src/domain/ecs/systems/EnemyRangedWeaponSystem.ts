import type { System, World } from "../../../lib/ecs";
import { defineSystem } from "../../../lib/ecs";
import {
  AIVision,
  Enemy,
  Position,
  Rotation,
  RangedWeapon,
  Player,
  Velocity,
  Projectile,
  TimeToLive,
  Damage,
  Collider,
  Sprite,
  Faction,
} from "../components";
import { Entity as ECSEntity } from "../../../lib/ecs";

export function createEnemyRangedWeaponSystem(world: World, dt: number): System {
  return defineSystem(world)
    .withComponents({
      enemy: Enemy,
      position: Position,
      rotation: Rotation,
      aiVision: AIVision,
      ranged: RangedWeapon,
    })
    .execute((entities): void => {
      // Get player target once
      const players = world.query({ position: Position, player: Player, collider: Collider });
      if (players.length === 0) return;
      const playerPos = players[0].components.position;
      const playerCollider = players[0].components.collider;

      entities.forEach(({ entity, components }) => {
        const { position, rotation, aiVision, ranged } = components;

        // Tick cooldown
        if (ranged.remaining > 0) ranged.remaining -= dt;

        // Determine if target in range/vision
        const dx = playerPos.x - position.x;
        const dy = playerPos.y - position.y;
        const dist = Math.hypot(dx, dy);
        const inVision = aiVision.hasTarget || dist <= aiVision.radius;
        if (!inVision || dist > ranged.range) return;

        // Check firing arc: only fire if roughly facing player
        const desired = Math.atan2(dy, dx);
        let diff = desired - rotation.angle;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        const withinArc = Math.abs(diff) < 0.35; // ~20 degrees
        if (!withinArc) return;

        if (ranged.remaining <= 0) {
          const jitter = (Math.random() * 2 - 1) * ranged.spread;
          const angle = rotation.angle + jitter;
          const dirX = Math.cos(angle);
          const dirY = Math.sin(angle);

          const spawnDistance = 22 + playerCollider.radius * 0.1;
          const speed = ranged.projectileSpeed;
          const projColor = ranged.color ?? "#ff5555";
          const faction = new ECSEntity(entity, world).getComponent(Faction)?.team ?? "enemy";

          world
            .createEntity()
            .addComponent(Position, {
              x: position.x + dirX * spawnDistance,
              y: position.y + dirY * spawnDistance,
            })
            .addComponent(Velocity, { dx: dirX * speed, dy: dirY * speed })
            .addComponent(Projectile)
            .addComponent(TimeToLive, { remaining: 1.6, initial: 1.6 })
            .addComponent(Damage, { amount: ranged.damage })
            .addComponent(Collider, { radius: 2 })
            .addComponent(Sprite, { color: projColor, scale: 0.5 })
            .addComponent(Faction, { team: faction });

          ranged.remaining = ranged.cooldown;
        }
      });
    });
}
