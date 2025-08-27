import type { System, World } from "../../../lib/ecs";
import { defineSystem } from "../../../lib/ecs";
import { Position, Velocity } from "../components";

export function createMovementSystem(world: World, dt: number): System {
  return defineSystem(world)
    .withComponents({ position: Position, velocity: Velocity })
    .execute((entities): void => {
      entities.forEach(({ components }) => {
        const { position, velocity } = components;
        position.x += velocity.dx * dt;
        position.y += velocity.dy * dt;
      });
    });
}
