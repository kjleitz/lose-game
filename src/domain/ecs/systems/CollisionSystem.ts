import type { System, World } from "../../../lib/ecs";
import { defineSystem, Entity as ECSEntity } from "../../../lib/ecs";
import {
  Collider,
  Damage,
  LootDropTable,
  DroppedItem,
  Enemy,
  Health,
  Player,
  Position,
  Projectile,
} from "../components";
import { Faction } from "../components";
import type { DropEntry, DropTable as DropTableType } from "../../game/damage/DamageableEntity";
import type { Item } from "../../game/items/Item";
import { BaseItemType, ItemQuality, ItemRarity } from "../../game/items/Item";

export function createCollisionSystem(world: World): System {
  // Create separate systems for different collision types
  const projectileEntities = world.query({
    position: Position,
    collider: Collider,
    projectile: Projectile,
    damage: Damage,
  });
  const playerEntities = world.query({
    position: Position,
    collider: Collider,
    health: Health,
    player: Player,
  });
  const enemyEntities = world.query({
    position: Position,
    collider: Collider,
    health: Health,
    enemy: Enemy,
  });

  const targets = [...playerEntities, ...enemyEntities];

  // Loot quantity multiplier is read when rolling drops via PlayerModifiers.

  // Check projectile vs target collisions
  projectileEntities.forEach((projectile) => {
    const { position: projPos, collider: projCollider, damage: projDamage } = projectile.components;
    const projFaction =
      new ECSEntity(projectile.entity, world).getComponent(Faction)?.team ?? "neutral";

    targets.forEach((target) => {
      if (projectile.entity === target.entity) return; // Can't hit self

      const {
        position: targetPos,
        collider: targetCollider,
        health: targetHealth,
      } = target.components;
      const targetFaction =
        new ECSEntity(target.entity, world).getComponent(Faction)?.team ?? "neutral";
      // Prevent friendly fire: skip if same faction
      if (projFaction === targetFaction) return;
      const dx = projPos.x - targetPos.x;
      const dy = projPos.y - targetPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const combinedRadius = projCollider.radius + targetCollider.radius;

      if (distance < combinedRadius) {
        // Hit!
        targetHealth.current -= projDamage.amount;

        if (targetHealth.current <= 0) {
          // Spawn drops if entity has a drop table
          if (world.hasComponent(target.entity, LootDropTable)) {
            const ent = new ECSEntity(target.entity, world);
            const dt = ent.getComponent(LootDropTable);
            const drops = dt ? rollDrops(dt, getLootQuantityMult(world, playerEntities)) : [];
            for (const drop of drops) {
              const offsetX = (Math.random() - 0.5) * 20;
              const offsetY = (Math.random() - 0.5) * 20;
              world
                .createEntity()
                .addComponent(Position, { x: targetPos.x + offsetX, y: targetPos.y + offsetY })
                .addComponent(DroppedItem, {
                  item: drop.item,
                  quantity: drop.quantity,
                  ageSeconds: 0,
                });
            }
          }
          world.removeEntity(target.entity);
        }

        // Remove projectile on hit
        world.removeEntity(projectile.entity);
      }
    });
  });

  // Return a no-op system since we executed immediately
  return defineSystem(world)
    .withComponents({})
    .execute((): void => {});
}

function rollDrops(
  dropTable: DropTableType,
  quantityMult = 1,
): Array<{ item: Item; quantity: number }> {
  const drops: Array<{ item: Item; quantity: number }> = [];
  const consider = (entry: DropEntry): void => {
    if (!entry.itemType) return;
    if (Math.random() < entry.probability) {
      const qty =
        Math.floor(Math.random() * (entry.maxQuantity - entry.minQuantity + 1)) + entry.minQuantity;
      const item = createItemFromType(entry.itemType);
      const scaledQty = Math.max(1, Math.floor(qty * quantityMult));
      if (item && scaledQty > 0) drops.push({ item, quantity: scaledQty });
    }
  };
  for (const entry of dropTable.guaranteed || []) consider(entry);
  for (const entry of dropTable.possible || []) consider(entry);
  for (const entry of dropTable.rare || []) consider(entry);
  return drops;
}

// Helper to read PlayerModifiers. Imported here to avoid circular deps, we define a local accessor.
import { PlayerModifiers } from "../components";
function getLootQuantityMult(
  world: World,
  players: Array<ReturnType<World["query"]>[number]>,
): number {
  if (players.length === 0) return 1;
  const pid = players[0].entity;
  const ent = new ECSEntity(pid, world);
  const mods = ent.getComponent(PlayerModifiers);
  return mods ? mods.lootQuantityMult : 1;
}

function createItemFromType(itemType: string): Item | null {
  switch (itemType) {
    case "organic_matter":
      return {
        id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
        type: "organic_matter",
        baseType: BaseItemType.MATERIAL,
        name: "Organic Matter",
        description: "Basic biological material from defeated creatures",
        properties: {
          weight: 0.2,
          volume: 0.3,
          stackable: true,
          maxStackSize: 50,
          quality: ItemQuality.COMMON,
          rarity: ItemRarity.COMMON,
          tradeable: true,
          dropOnDeath: false,
        },
        stats: { value: 2 },
        requirements: {},
        effects: [],
        metadata: { discoveredAt: Date.now() },
      };
    case "alien_hide":
      return {
        id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
        type: "alien_hide",
        baseType: BaseItemType.MATERIAL,
        name: "Alien Hide",
        description: "Tough hide from an alien creature, useful for crafting",
        properties: {
          weight: 1.0,
          volume: 1.0,
          stackable: true,
          maxStackSize: 20,
          quality: ItemQuality.GOOD,
          rarity: ItemRarity.UNCOMMON,
          tradeable: true,
          dropOnDeath: false,
        },
        stats: { value: 15 },
        requirements: {},
        effects: [],
        metadata: { discoveredAt: Date.now() },
      };
    case "rare_essence":
      return {
        id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
        type: "rare_essence",
        baseType: BaseItemType.MATERIAL,
        name: "Rare Essence",
        description: "A mysterious essence with unknown properties",
        properties: {
          weight: 0.1,
          volume: 0.2,
          stackable: true,
          maxStackSize: 10,
          quality: ItemQuality.EXCELLENT,
          rarity: ItemRarity.RARE,
          tradeable: true,
          dropOnDeath: false,
        },
        stats: { value: 100 },
        requirements: {},
        effects: [],
        metadata: { discoveredAt: Date.now() },
      };
    default:
      return null;
  }
}
