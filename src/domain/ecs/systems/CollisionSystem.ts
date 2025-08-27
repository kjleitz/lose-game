import type { System, World } from "../../../lib/ecs";
import { defineSystem } from "../../../lib/ecs";
import { Collider, Damage, Enemy, Health, Player, Position, Projectile } from "../components";

export function createCollisionSystem(world: World): System {
  // Create separate systems for different collision types
  const projectileEntities = world.query({
    position: Position,
    collider: Collider,
    projectile: Projectile,
    damage: Damage,
  });
  const playerEntities = world.query({
    position: Position,
    collider: Collider,
    health: Health,
    player: Player,
  });
  const enemyEntities = world.query({
    position: Position,
    collider: Collider,
    health: Health,
    enemy: Enemy,
  });

  const targets = [...playerEntities, ...enemyEntities];

  // Check projectile vs target collisions
  projectileEntities.forEach((projectile) => {
    const { position: projPos, collider: projCollider, damage: projDamage } = projectile.components;

    targets.forEach((target) => {
      if (projectile.entity === target.entity) return; // Can't hit self

      const {
        position: targetPos,
        collider: targetCollider,
        health: targetHealth,
      } = target.components;
      const dx = projPos.x - targetPos.x;
      const dy = projPos.y - targetPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const combinedRadius = projCollider.radius + targetCollider.radius;

      if (distance < combinedRadius) {
        // Hit!
        targetHealth.current -= projDamage.amount;

        if (targetHealth.current <= 0) {
          world.removeEntity(target.entity);
        }

        // Remove projectile on hit
        world.removeEntity(projectile.entity);
      }
    });
  });

  // Return a no-op system since we executed immediately
  return defineSystem(world)
    .withComponents({})
    .execute((): void => {});
}
