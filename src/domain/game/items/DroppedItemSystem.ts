import type { Item } from "./Item";
import { BaseItemType, ItemQuality, ItemRarity } from "./Item";
import { TIME } from "../../../config/time";
import type { DamageableEntity, DropTable } from "../damage/DamageableEntity";
import type { Player } from "../player";
import type { Point2D } from "../../../shared/types/geometry";

export interface DroppedItem {
  id: string;
  item: Item;
  quantity: number;
  x: number;
  y: number;
  ageSeconds: number;
  sourceEntity?: string;
}

export interface PickupResult {
  success: boolean;
  item?: Item;
  quantity?: number;
  reason?: string;
}

export class DroppedItemSystem {
  private droppedItems: Map<string, DroppedItem> = new Map();
  private nextId = 1;
  private readonly PICKUP_RANGE = 40; // pixels
  private readonly ITEM_DESPAWN_SEC = TIME.DROPPED_ITEM_DESPAWN_SEC;

  dropItemsFromEntity(entity: DamageableEntity, position: Point2D): DroppedItem[] {
    const droppedItems: DroppedItem[] = [];

    // Roll for drops based on entity's drop table
    const drops = this.rollDrops(entity.dropTable);

    for (const drop of drops) {
      const droppedItem = this.createDroppedItem(
        drop.item,
        drop.quantity,
        position.x + this.randomOffset(),
        position.y + this.randomOffset(),
        entity.id,
      );

      this.droppedItems.set(droppedItem.id, droppedItem);
      droppedItems.push(droppedItem);
    }

    return droppedItems;
  }

  dropItemFromPlayer(item: Item, quantity: number, position: Point2D): DroppedItem {
    const droppedItem = this.createDroppedItem(
      item,
      quantity,
      position.x + this.randomOffset(),
      position.y + this.randomOffset(),
      "player",
    );

    this.droppedItems.set(droppedItem.id, droppedItem);
    return droppedItem;
  }

  tryPickupItem(player: Player, droppedItemId: string): PickupResult {
    const droppedItem = this.droppedItems.get(droppedItemId);
    if (!droppedItem) {
      return { success: false, reason: "Item not found" };
    }

    // Check distance
    const distance = Math.hypot(droppedItem.x - player.state.x, droppedItem.y - player.state.y);

    if (distance > this.PICKUP_RANGE) {
      return { success: false, reason: "Too far away" };
    }

    // Try to add to inventory
    const addResult = player.inventory.addItem(droppedItem.item, droppedItem.quantity);
    if (!addResult.success) {
      return { success: false, reason: addResult.reason };
    }

    // Remove from world
    this.droppedItems.delete(droppedItemId);

    return {
      success: true,
      item: droppedItem.item,
      quantity: droppedItem.quantity,
    };
  }

  tryPickupNearbyItems(player: Player): PickupResult[] {
    const results: PickupResult[] = [];
    const playerPos = { x: player.state.x, y: player.state.y };

    // Take a snapshot of candidate IDs first to avoid skipping items
    const candidateIds = Array.from(this.droppedItems.values())
      .filter((item) => Math.hypot(item.x - playerPos.x, item.y - playerPos.y) <= this.PICKUP_RANGE)
      .map((item) => item.id);

    for (const id of candidateIds) {
      const result = this.tryPickupItem(player, id);
      if (result.success) results.push(result);
    }

    return results;
  }

  update(dt: number): void {
    const itemsToRemove: string[] = [];

    // Remove despawned items
    for (const [id, droppedItem] of this.droppedItems) {
      droppedItem.ageSeconds += dt;
      if (droppedItem.ageSeconds > this.ITEM_DESPAWN_SEC) itemsToRemove.push(id);
    }

    for (const id of itemsToRemove) {
      this.droppedItems.delete(id);
    }
  }

  getAllDroppedItems(): DroppedItem[] {
    return Array.from(this.droppedItems.values());
  }

  getDroppedItemsNear(x: number, y: number, range: number): DroppedItem[] {
    return Array.from(this.droppedItems.values()).filter((item) => {
      const distance = Math.hypot(item.x - x, item.y - y);
      return distance <= range;
    });
  }

  private createDroppedItem(
    item: Item,
    quantity: number,
    x: number,
    y: number,
    sourceEntity?: string,
  ): DroppedItem {
    return {
      id: `dropped_${this.nextId++}`,
      item,
      quantity,
      x,
      y,
      ageSeconds: 0,
      sourceEntity,
    };
  }

  private rollDrops(dropTable: DropTable): Array<{ item: Item; quantity: number }> {
    const drops: Array<{ item: Item; quantity: number }> = [];

    const noEntries =
      (dropTable.guaranteed == null || dropTable.guaranteed.length === 0) &&
      (dropTable.possible == null || dropTable.possible.length === 0) &&
      (dropTable.rare == null || dropTable.rare.length === 0);
    if (noEntries) return drops;

    // Guaranteed drops
    if (dropTable.guaranteed != null) {
      for (const drop of dropTable.guaranteed) {
        if (
          typeof drop.itemType === "string" &&
          drop.itemType.length > 0 &&
          Math.random() < drop.probability
        ) {
          const quantity =
            Math.floor(Math.random() * (drop.maxQuantity - drop.minQuantity + 1)) +
            drop.minQuantity;

          const item = this.createItemFromType(drop.itemType);
          if (item != null && quantity > 0) {
            drops.push({ item, quantity });
          }
        }
      }
    }

    // Possible drops (chance-based)
    if (dropTable.possible != null) {
      for (const drop of dropTable.possible) {
        if (
          typeof drop.itemType === "string" &&
          drop.itemType.length > 0 &&
          Math.random() < drop.probability
        ) {
          const quantity =
            Math.floor(Math.random() * (drop.maxQuantity - drop.minQuantity + 1)) +
            drop.minQuantity;

          const item = this.createItemFromType(drop.itemType);
          if (item != null && quantity > 0) {
            drops.push({ item, quantity });
          }
        }
      }
    }

    // Rare drops (low chance but high value)
    if (dropTable.rare != null) {
      for (const drop of dropTable.rare) {
        if (
          typeof drop.itemType === "string" &&
          drop.itemType.length > 0 &&
          Math.random() < drop.probability
        ) {
          const quantity =
            Math.floor(Math.random() * (drop.maxQuantity - drop.minQuantity + 1)) +
            drop.minQuantity;

          const item = this.createItemFromType(drop.itemType);
          if (item != null && quantity > 0) {
            drops.push({ item, quantity });
          }
        }
      }
    }

    return drops;
  }

  private createItemFromType(itemType: string): Item | null {
    // Create basic items for common drop types
    switch (itemType) {
      case "organic_matter":
        return {
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
          stats: {
            value: 2,
          },
          requirements: {},
          effects: [],
          metadata: {
            discoveredAt: Date.now(),
            icon: "/items/body_parts.svg",
            category: "materials",
          },
          implemented: false,
        };

      case "alien_hide":
        return {
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
          stats: {
            value: 15,
          },
          requirements: {},
          effects: [],
          metadata: {
            discoveredAt: Date.now(),
            icon: "/items/placeholder.svg",
            category: "materials",
          },
          implemented: false,
        };

      case "rare_essence":
        return {
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
          stats: {
            value: 100,
          },
          requirements: {},
          effects: [],
          metadata: {
            discoveredAt: Date.now(),
            icon: "/items/placeholder.svg",
            category: "materials",
          },
          implemented: false,
        };

      default:
        console.warn(`Unknown item type: ${itemType}`);
        return null;
    }
  }

  private randomOffset(): number {
    // Keep drops reasonably close to the source to reduce pickup flakiness in gameplay
    return (Math.random() - 0.5) * 20; // Random offset within 10 pixels
  }
}
