import { defineSystem } from "../../../lib/ecs/dist";
import type { World } from "../../../lib/ecs/dist";
import { Position, Velocity, TimeToLive, Projectile } from "../components";

export function createProjectileSystem(world: World, dt: number) {
  return defineSystem(world)
    .withComponents({
      position: Position,
      velocity: Velocity,
      timeToLive: TimeToLive,
      projectile: Projectile,
    })
    .execute((entities) => {
      entities.forEach(({ entity, components }) => {
        const { timeToLive } = components;

        timeToLive.remaining -= dt;

        if (timeToLive.remaining <= 0) {
          world.removeEntity(entity);
        }
      });
    });
}
