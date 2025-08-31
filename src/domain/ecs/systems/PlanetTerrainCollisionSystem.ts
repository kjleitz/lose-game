import type { System, World } from "../../../lib/ecs";
import { defineSystem } from "../../../lib/ecs";
import { Collider, Player, Position } from "../components";
import type { PlanetSurface } from "../../game/planet-surface/types";
import { getTerrainColliders } from "../collision/terrain-colliders";

export function createPlanetTerrainCollisionSystem(
  world: World,
  getSurface: () => PlanetSurface | undefined,
  playerRadiusOverride?: number,
): System {
  return defineSystem(world)
    .withComponents({ position: Position, collider: Collider, player: Player })
    .execute((players): void => {
      const surface = getSurface();
      if (!surface) return;
      if (players.length === 0) return;
      const player = players[0];
      const { position, collider } = player.components;
      const playerRadius = playerRadiusOverride ?? collider.radius ?? 16;

      for (const feature of surface.terrain) {
        // Only block on solid-ish terrain types
        if (
          feature.type !== "rock" &&
          feature.type !== "vegetation" &&
          feature.type !== "structure"
        )
          continue;

        const colliders = getTerrainColliders(feature);
        for (const circle of colliders) {
          const dx = position.x - circle.cx;
          const dy = position.y - circle.cy;
          const dist = Math.hypot(dx, dy);
          const combinedRadius = playerRadius + circle.r;
          if (dist < combinedRadius) {
            // Handle perfect overlap by choosing an arbitrary normal
            const nx = dist > 0 ? dx / dist : 1;
            const ny = dist > 0 ? dy / dist : 0;
            const overlap = combinedRadius - (dist > 0 ? dist : 0);
            position.x += nx * overlap;
            position.y += ny * overlap;
          }
        }
      }
    });
}
