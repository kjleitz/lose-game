import type { World } from "../../../lib/ecs";
import * as Components from "../components";

export function createOrbitSystem(world: World, dt: number): { run(): void } {
  return {
    run(): void {
      const orbiters = world.query({ position: Components.Position, orbit: Components.Orbit });
      if (orbiters.length === 0) return;

      for (const ent of orbiters) {
        const { position, orbit } = ent.components;
        // Look up the center entity position each tick for correctness
        const centerPos = world.getComponent(orbit.centerId, Components.Position);
        if (!centerPos) continue;

        const nextAngle = orbit.angle + orbit.speed * dt;
        orbit.angle = nextAngle;
        position.x = centerPos.__data.x + Math.cos(nextAngle) * orbit.radius;
        position.y = centerPos.__data.y + Math.sin(nextAngle) * orbit.radius;
      }
    },
  };
}
