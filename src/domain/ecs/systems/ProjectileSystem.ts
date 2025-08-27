import type { System, World } from "../../../lib/ecs";
import { defineSystem } from "../../../lib/ecs";
import { Position, Projectile, TimeToLive, Velocity } from "../components";

export function createProjectileSystem(world: World, dt: number): System {
  return defineSystem(world)
    .withComponents({
      position: Position,
      velocity: Velocity,
      timeToLive: TimeToLive,
      projectile: Projectile,
    })
    .execute((entities): void => {
      entities.forEach(({ entity, components }) => {
        const { timeToLive } = components;

        timeToLive.remaining -= dt;

        if (timeToLive.remaining <= 0) {
          world.removeEntity(entity);
        }
      });
    });
}
