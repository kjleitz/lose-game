import type { System, World } from "../../../lib/ecs";
import { defineSystem } from "../../../lib/ecs";
import { Enemy, Position, Collider, MeleeWeapon, Player, Health } from "../components";

export function createEnemyMeleeSystem(world: World, dt: number): System {
  return defineSystem(world)
    .withComponents({ enemy: Enemy, position: Position, collider: Collider, melee: MeleeWeapon })
    .execute((entities): void => {
      const players = world.query({
        position: Position,
        collider: Collider,
        player: Player,
        health: Health,
      });
      if (players.length === 0) return;
      const player = players[0];
      const playerPos = player.components.position;
      const playerCollider = player.components.collider;
      const playerHealth = player.components.health;

      entities.forEach(({ components }) => {
        const { position, collider, melee } = components;

        // Tick cooldown
        if (melee.remaining > 0) melee.remaining -= dt;

        const dx = playerPos.x - position.x;
        const dy = playerPos.y - position.y;
        const dist = Math.hypot(dx, dy);
        const reach = melee.range + collider.radius + playerCollider.radius;

        if (dist <= reach && melee.remaining <= 0) {
          playerHealth.current = Math.max(0, playerHealth.current - melee.damage);
          melee.remaining = melee.cooldown;
        }
      });
    });
}
