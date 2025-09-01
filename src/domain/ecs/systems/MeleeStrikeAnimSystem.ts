import type { System, World } from "../../../lib/ecs";
import { defineSystem } from "../../../lib/ecs";
import { MeleeStrikeAnim } from "../components";

export function createMeleeStrikeAnimSystem(world: World, dt: number): System {
  return defineSystem(world)
    .withComponents({ anim: MeleeStrikeAnim })
    .execute((entities): void => {
      entities.forEach(({ entity, components }) => {
        const { anim } = components;
        anim.remaining -= dt;
        if (anim.remaining <= 0) {
          // Remove by simply setting to tiny positive? Better: remove component
          world.removeComponentFromEntity(entity, MeleeStrikeAnim);
        }
      });
    });
}
