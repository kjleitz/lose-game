import type { Action } from "../../../application/input/ActionTypes";
import { TIME } from "../../../config/time";
import type { System, World } from "../../../lib/ecs";
import { defineSystem } from "../../../lib/ecs";
import type { Item } from "../../game/items/Item";
import { DroppedItem, Player, Position } from "../components";

export interface PickupEvent {
  item: Item;
  quantity: number;
}

export function createDroppedItemAgingSystem(world: World, dt: number): System {
  const DESPAWN = TIME.DROPPED_ITEM_DESPAWN_SEC;
  return defineSystem(world)
    .withComponents({ dropped: DroppedItem })
    .execute((entities): void => {
      entities.forEach(({ components, entity }) => {
        const { dropped } = components;
        dropped.ageSeconds += dt;
        if (dropped.ageSeconds > DESPAWN) {
          world.removeEntity(entity);
        }
      });
    });
}

export function createPickupSystem(
  world: World,
  actions: Set<Action>,
  onPickedUp: (ev: PickupEvent) => void,
  range = 40,
): System {
  return defineSystem(world)
    .withComponents({ position: Position, dropped: DroppedItem })
    .execute((drops): void => {
      if (!actions.has("interact")) return;
      const players = world.query({ position: Position, player: Player });
      if (players.length === 0) return;
      const playerPos = players[0].components.position;

      drops.forEach(({ components, entity }) => {
        const { position, dropped } = components;
        const dx = position.x - playerPos.x;
        const dy = position.y - playerPos.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= range) {
          onPickedUp({ item: dropped.item, quantity: dropped.quantity });
          world.removeEntity(entity);
        }
      });
    });
}
