import type { System, World } from "../../../lib/ecs";
import { defineSystem } from "../../../lib/ecs";
import { HitFlash } from "../components";

export function createHitFlashSystem(world: World, dt: number): System {
  return defineSystem(world)
    .withComponents({ hit: HitFlash })
    .execute((entities): void => {
      entities.forEach(({ entity, components }) => {
        const { hit } = components;
        hit.remaining -= dt;
        if (hit.remaining <= 0) {
          world.removeComponentFromEntity(entity, HitFlash);
        }
      });
    });
}
