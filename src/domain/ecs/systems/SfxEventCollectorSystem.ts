import type { System, World } from "../../../lib/ecs";
import { defineSystem, Entity } from "../../../lib/ecs";
import {
  JustFired,
  Faction,
  ImpactEvent,
  Position,
  Projectile,
  ProjectileAmmo,
} from "../components";
import type { AmmoType } from "../../../shared/types/combat";

export type SfxEvent =
  | { type: "shoot"; team: "player" | "enemy" | "neutral"; ammo?: AmmoType }
  | { type: "hit"; x: number; y: number }
  | { type: "playerHit"; x: number; y: number }
  // Emitted by pickup/attraction logic (not collected here)
  | { type: "pickup" }
  | { type: "attract"; strength: number };

export function createSfxEventCollectorSystem(
  world: World,
  onEvent: (ev: SfxEvent) => void,
): System {
  const fired = world.query({ projectile: Projectile, fired: JustFired, faction: Faction });
  fired.forEach(({ entity, components }) => {
    const team = components.faction.team;
    // Attempt to read ammo tag from the projectile entity
    const ammoComp = new Entity(entity, world).getComponent(ProjectileAmmo);
    onEvent({ type: "shoot", team, ammo: ammoComp?.type });
    world.removeComponentFromEntity(entity, JustFired);
  });

  const impacts = world.query({ position: Position, impact: ImpactEvent });
  impacts.forEach(({ entity, components }) => {
    const { position, impact } = components;
    if (impact.kind === "player") onEvent({ type: "playerHit", x: position.x, y: position.y });
    else onEvent({ type: "hit", x: position.x, y: position.y });
    world.removeEntity(entity);
  });

  return defineSystem(world)
    .withComponents({})
    .execute((): void => {});
}
