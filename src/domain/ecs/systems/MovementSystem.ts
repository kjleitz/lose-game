import { defineSystem } from "../../../lib/ecs/dist";
import type { World } from "../../../lib/ecs/dist";
import { Position, Velocity } from "../components";

export function createMovementSystem(world: World, dt: number) {
  return defineSystem(world)
    .withComponents({ position: Position, velocity: Velocity })
    .execute((entities) => {
      entities.forEach(({ components }) => {
        const { position, velocity } = components;
        position.x += velocity.dx * dt;
        position.y += velocity.dy * dt;
      });
    });
}
