import type { System, World } from "../../../lib/ecs";
import { defineSystem } from "../../../lib/ecs";
import { JustFired, Faction, ImpactEvent, Position, Projectile } from "../components";

export type SfxEvent =
  | { type: "shoot"; team: "player" | "enemy" | "neutral" }
  | { type: "hit"; x: number; y: number };

export function createSfxEventCollectorSystem(
  world: World,
  onEvent: (ev: SfxEvent) => void,
): System {
  const fired = world.query({ projectile: Projectile, fired: JustFired, faction: Faction });
  fired.forEach(({ entity, components }) => {
    const team = components.faction.team;
    onEvent({ type: "shoot", team });
    world.removeComponentFromEntity(entity, JustFired);
  });

  const impacts = world.query({ position: Position, impact: ImpactEvent });
  impacts.forEach(({ entity, components }) => {
    const { position } = components;
    onEvent({ type: "hit", x: position.x, y: position.y });
    world.removeEntity(entity);
  });

  return defineSystem(world)
    .withComponents({})
    .execute((): void => {});
}
