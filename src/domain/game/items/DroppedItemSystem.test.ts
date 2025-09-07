import { describe, it, expect, beforeEach } from "vitest";
import { DroppedItemSystem } from "./DroppedItemSystem";
import { BaseDamageableEntity } from "../damage/DamageableEntity";

class TestDamageableEntity extends BaseDamageableEntity {
  onDestruction(): void {}
}

describe("DroppedItemSystem", () => {
  let droppedItemSystem: DroppedItemSystem;

  beforeEach(() => {
    droppedItemSystem = new DroppedItemSystem();
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
            { itemTemplateId: "body_parts", minQuantity: 1, maxQuantity: 3, probability: 1.0 },
          ],
          possible: [
            { itemTemplateId: "alien_beer", minQuantity: 1, maxQuantity: 2, probability: 0.6 },
          ],
          rare: [],
          modifiers: [],
        },
      );

      const droppedItems = droppedItemSystem.dropItemsFromEntity(entity, { x: 100, y: 100 });

      expect(droppedItems.length).toBeGreaterThan(0);
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
            { itemTemplateId: "body_parts", minQuantity: 2, maxQuantity: 2, probability: 1.0 },
          ],
          possible: [],
          rare: [],
          modifiers: [],
        },
      );

      const droppedItems = droppedItemSystem.dropItemsFromEntity(entity, { x: 200, y: 200 });

      expect(droppedItems).toHaveLength(1);
      const droppedItem = droppedItems[0];

      expect(droppedItem.item.type).toBe("body_parts");
      expect(droppedItem.quantity).toBe(2);
    });

    it("should handle rare drops", () => {
      const entity = new TestDamageableEntity(
        "test-creature-3",
        { x: 150, y: 150 },
        {
          maxHealth: 100,
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
            { itemTemplateId: "lightsaber", minQuantity: 1, maxQuantity: 1, probability: 1.0 }, // 100% for testing
          ],
          modifiers: [],
        },
      );

      const droppedItems = droppedItemSystem.dropItemsFromEntity(entity, { x: 150, y: 150 });

      expect(droppedItems).toHaveLength(1);
      expect(droppedItems[0].item.type).toBe("lightsaber");
    });
  });
});
