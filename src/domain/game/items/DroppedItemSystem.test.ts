import { describe, it, expect, beforeEach } from "vitest";
import { DroppedItemSystem } from "./DroppedItemSystem";
import { Player } from "../player";
import { BaseDamageableEntity } from "../damage/DamageableEntity";
// no item enum imports needed here

class TestDamageableEntity extends BaseDamageableEntity {
  onDestruction(): void {}
}

describe("DroppedItemSystem", () => {
  let droppedItemSystem: DroppedItemSystem;
  let player: Player;

  beforeEach(() => {
    droppedItemSystem = new DroppedItemSystem();
    player = new Player({ x: 100, y: 100, vx: 0, vy: 0, angle: 0 });
  });

  describe("item dropping from entities", () => {
    it("should drop items when entity is destroyed", () => {
      const entity = new TestDamageableEntity(
        "test-creature",
        { x: 100, y: 100 },
        {
          maxHealth: 50,
          currentHealth: 0, // Already dead
          resistances: new Map(),
          vulnerabilities: new Map(),
          regeneration: 0,
          invulnerabilityPeriod: 0,
          lastDamageTime: 0,
        },
        {
          guaranteed: [
            { itemType: "organic_matter", minQuantity: 1, maxQuantity: 3, probability: 1.0 },
          ],
          possible: [{ itemType: "alien_hide", minQuantity: 1, maxQuantity: 2, probability: 0.6 }],
          rare: [],
          modifiers: [],
        },
      );

      const droppedItems = droppedItemSystem.dropItemsFromEntity(entity, { x: 100, y: 100 });

      expect(droppedItems.length).toBeGreaterThan(0);
      expect(droppedItems[0].item.name).toBe("Organic Matter");
      expect(droppedItems[0].quantity).toBeGreaterThan(0);
    });

    it("should create dropped items with correct properties", () => {
      const entity = new TestDamageableEntity(
        "test-creature-2",
        { x: 200, y: 200 },
        {
          maxHealth: 50,
          currentHealth: 0,
          resistances: new Map(),
          vulnerabilities: new Map(),
          regeneration: 0,
          invulnerabilityPeriod: 0,
          lastDamageTime: 0,
        },
        {
          guaranteed: [
            { itemType: "organic_matter", minQuantity: 2, maxQuantity: 2, probability: 1.0 },
          ],
          possible: [],
          rare: [],
          modifiers: [],
        },
      );

      const droppedItems = droppedItemSystem.dropItemsFromEntity(entity, { x: 200, y: 200 });

      expect(droppedItems).toHaveLength(1);
      const droppedItem = droppedItems[0];

      expect(droppedItem.item.baseType).toBe("material");
      expect(droppedItem.quantity).toBe(2);
      expect(droppedItem.sourceEntity).toBe("test-creature-2");
      // Items have random offset so just check they're reasonably close
      expect(Math.abs(droppedItem.x - 200)).toBeLessThan(20);
      expect(Math.abs(droppedItem.y - 200)).toBeLessThan(20);
      expect(droppedItem.ageSeconds).toBeGreaterThanOrEqual(0);
    });

    it("should handle rare drops with low probability", () => {
      const entity = new TestDamageableEntity(
        "test-creature-rare",
        { x: 150, y: 150 },
        {
          maxHealth: 50,
          currentHealth: 0,
          resistances: new Map(),
          vulnerabilities: new Map(),
          regeneration: 0,
          invulnerabilityPeriod: 0,
          lastDamageTime: 0,
        },
        {
          guaranteed: [],
          possible: [],
          rare: [
            { itemType: "rare_essence", minQuantity: 1, maxQuantity: 1, probability: 1.0 }, // 100% for testing
          ],
          modifiers: [],
        },
      );

      const droppedItems = droppedItemSystem.dropItemsFromEntity(entity, { x: 150, y: 150 });

      expect(droppedItems).toHaveLength(1);
      expect(droppedItems[0].item.name).toBe("Rare Essence");
      expect(droppedItems[0].item.stats.value).toBe(100);
    });
  });

  describe("item pickup", () => {
    it("should allow player to pick up nearby items", () => {
      // Create a dropped item near the player
      const testItem = droppedItemSystem["createItemFromType"]("organic_matter")!;
      const droppedItem = droppedItemSystem.dropItemFromPlayer(testItem, 2, { x: 105, y: 105 });

      const result = droppedItemSystem.tryPickupItem(player, droppedItem.id);

      expect(result.success).toBe(true);
      expect(result.item?.name).toBe("Organic Matter");
      expect(result.quantity).toBe(2);

      // Item should be removed from world
      const remainingItems = droppedItemSystem.getAllDroppedItems();
      expect(remainingItems).toHaveLength(0);
    });

    it("should fail to pick up items that are too far away", () => {
      const testItem = droppedItemSystem["createItemFromType"]("organic_matter")!;
      const droppedItem = droppedItemSystem.dropItemFromPlayer(testItem, 1, { x: 200, y: 200 });

      const result = droppedItemSystem.tryPickupItem(player, droppedItem.id);

      expect(result.success).toBe(false);
      expect(result.reason).toBe("Too far away");

      // Item should still be in world
      const remainingItems = droppedItemSystem.getAllDroppedItems();
      expect(remainingItems).toHaveLength(1);
    });

    it("should fail to pick up items when inventory is full", () => {
      // Fill player inventory first
      const heavyItem = droppedItemSystem["createItemFromType"]("alien_hide")!;
      // Add many items to exceed weight limit
      player.inventory.addItem(heavyItem, 100);

      // Now try to pick up another item
      const testItem = droppedItemSystem["createItemFromType"]("organic_matter")!;
      const droppedItem = droppedItemSystem.dropItemFromPlayer(testItem, 1, { x: 105, y: 105 });

      const result = droppedItemSystem.tryPickupItem(player, droppedItem.id);

      expect(result.success).toBe(false);
      expect(result.reason).toBe("Too heavy");
    });

    it("should pick up multiple nearby items at once", () => {
      // Drop several items near the player
      const item1 = droppedItemSystem["createItemFromType"]("organic_matter")!;
      const item2 = droppedItemSystem["createItemFromType"]("alien_hide")!;

      droppedItemSystem.dropItemFromPlayer(item1, 1, { x: 110, y: 110 });
      droppedItemSystem.dropItemFromPlayer(item2, 1, { x: 115, y: 115 });

      const results = droppedItemSystem.tryPickupNearbyItems(player);

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.success)).toBe(true);

      // All items should be removed
      expect(droppedItemSystem.getAllDroppedItems()).toHaveLength(0);
    });
  });

  describe("item system updates", () => {
    it("should remove despawned items after timeout", () => {
      const testItem = droppedItemSystem["createItemFromType"]("organic_matter")!;
      droppedItemSystem.dropItemFromPlayer(testItem, 1, { x: 100, y: 100 });

      // Advance simulated time beyond despawn threshold (5 minutes)
      droppedItemSystem.update(301);

      expect(droppedItemSystem.getAllDroppedItems()).toHaveLength(0);
    });

    it("should keep recent items during update", () => {
      const testItem = droppedItemSystem["createItemFromType"]("organic_matter")!;
      droppedItemSystem.dropItemFromPlayer(testItem, 1, { x: 100, y: 100 });

      droppedItemSystem.update(1.0);

      expect(droppedItemSystem.getAllDroppedItems()).toHaveLength(1);
    });

    it("should find items within range", () => {
      const testItem = droppedItemSystem["createItemFromType"]("organic_matter")!;

      // Drop items at different distances
      droppedItemSystem.dropItemFromPlayer(testItem, 1, { x: 110, y: 110 });
      droppedItemSystem.dropItemFromPlayer(testItem, 1, { x: 200, y: 200 });
      droppedItemSystem.dropItemFromPlayer(testItem, 1, { x: 120, y: 120 });

      const nearbyItems = droppedItemSystem.getDroppedItemsNear(100, 100, 50);

      expect(nearbyItems.length).toBeGreaterThanOrEqual(2); // At least two items within 50 units
    });
  });
});
