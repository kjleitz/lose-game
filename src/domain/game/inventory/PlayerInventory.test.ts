import { describe, it, expect, beforeEach } from "vitest";
import { PlayerInventoryManager } from "./PlayerInventory";
import { ItemFactory } from "../items/ItemFactory";

describe("PlayerInventory", () => {
  let inventory: PlayerInventoryManager;
  let itemFactory: ItemFactory;

  beforeEach(() => {
    inventory = new PlayerInventoryManager(20, 50); // 20 slots, 50 weight limit
    itemFactory = new ItemFactory();
  });

  describe("basic inventory operations", () => {
    it("should initialize with empty slots", () => {
      expect(inventory.getSlots()).toHaveLength(20);
      expect(inventory.getCurrentWeight()).toBe(0);
      expect(inventory.getSlots().every((slot) => slot.item === null)).toBe(true);
    });

    it("should add items to inventory", () => {
      const wood = itemFactory.createItem("body_parts");
      const result = inventory.addItem(wood, 5);

      expect(result.success).toBe(true);
      expect(result.slot).toBeDefined();
      expect(result.slot!.item).toBe(wood);
      expect(result.slot!.quantity).toBe(5);
    });

    it("should reject items when over weight limit", () => {
      const heavy = itemFactory.createItem("gun_rifle"); // weighs ~3.2
      const capacity = Math.floor(inventory.maxWeight / heavy.properties.weight);
      for (let i = 0; i < capacity; i++) {
        const res = inventory.addItem(heavy, 1);
        if (!res.success) break;
      }
      const extra = itemFactory.createItem("gun_rifle");
      const result = inventory.addItem(extra, 1);
      expect(result.success).toBe(false);
      expect(result.reason).toBe("Too heavy");
    });

    it("should reject items when inventory is full", () => {
      // Create a light non-stackable item to avoid weight issues
      const lightAxe = itemFactory.createItem("melee_knife");
      // Override the weight to be very light
      Object.defineProperty(lightAxe.properties, "weight", { value: 0.1, writable: true });

      // Fill all slots with light non-stackable items
      for (let i = 0; i < 20; i++) {
        const axe = itemFactory.createItem("melee_knife");
        Object.defineProperty(axe.properties, "weight", { value: 0.1, writable: true });
        inventory.addItem(axe, 1);
      }

      // Try to add another non-stackable item to full inventory
      const extraAxe = itemFactory.createItem("melee_knife");
      Object.defineProperty(extraAxe.properties, "weight", { value: 0.1, writable: true });
      const result = inventory.addItem(extraAxe, 1);
      expect(result.success).toBe(false);
      expect(result.reason).toBe("Inventory full");
    });
  });

  describe("item stacking", () => {
    it("should stack stackable items of the same type", () => {
      const wood = itemFactory.createItem("body_parts");

      inventory.addItem(wood, 5);
      const result = inventory.addItem(wood, 3);

      expect(result.success).toBe(true);

      // Should have stacked in existing slot
      const woodSlots = inventory.findItemByType("body_parts");
      expect(woodSlots?.quantity).toBe(8);
    });

    it("should not stack non-stackable items", () => {
      const axe = itemFactory.createItem("melee_knife");

      inventory.addItem(axe, 1);
      const result = inventory.addItem(axe, 1);

      expect(result.success).toBe(true);

      // Should be in separate slots
      const axeSlots = inventory.findItems((item) => item.type === "melee_knife");
      expect(axeSlots).toHaveLength(2);
    });

    it("should respect max stack size", () => {
      const wood = itemFactory.createItem("body_parts"); // max stack 50

      inventory.addItem(wood, 50);
      const result = inventory.addItem(wood, 1);

      expect(result.success).toBe(true);

      // Should create new stack
      const woodSlots = inventory.findItems((item) => item.type === "body_parts");
      expect(woodSlots).toHaveLength(2);
      expect(woodSlots[0].quantity).toBe(50);
      expect(woodSlots[1].quantity).toBe(1);
    });
  });

  describe("item removal", () => {
    it("should remove items from inventory", () => {
      const wood = itemFactory.createItem("body_parts");
      const addResult = inventory.addItem(wood, 10);

      const removeResult = inventory.removeItem(addResult.slot!.id, 3);

      expect(removeResult.success).toBe(true);
      expect(removeResult.removed?.quantity).toBe(3);
      expect(addResult.slot!.quantity).toBe(7);
    });

    it("should remove entire stack when quantity matches", () => {
      const wood = itemFactory.createItem("body_parts");
      const addResult = inventory.addItem(wood, 5);

      const removeResult = inventory.removeItem(addResult.slot!.id, 5);

      expect(removeResult.success).toBe(true);
      expect(addResult.slot!.item).toBeNull();
      expect(addResult.slot!.quantity).toBe(0);
    });

    it("should handle removal from empty slots", () => {
      const result = inventory.removeItem("slot_0", 1);

      expect(result.success).toBe(false);
      expect(result.reason).toBe("Slot is empty");
    });
  });

  describe("item moving", () => {
    it("should move items between slots", () => {
      const wood = itemFactory.createItem("body_parts");
      const addResult = inventory.addItem(wood, 5);
      const sourceSlotId = addResult.slot!.id;

      // Find an empty slot
      const emptySlot = inventory
        .getSlots()
        .find((slot) => slot.item === null && slot.id !== sourceSlotId);

      const moveResult = inventory.moveItem(sourceSlotId, emptySlot!.id);

      expect(moveResult.success).toBe(true);
      expect(inventory.getSlots().find((s) => s.id === sourceSlotId)?.item).toBeNull();
      expect(emptySlot!.item).toBe(wood);
      expect(emptySlot!.quantity).toBe(5);
    });

    it("should stack compatible items when moving", () => {
      const wood = itemFactory.createItem("body_parts");

      // First, add to different slots manually to simulate the situation
      const slot1 = inventory.addItem(wood, 5).slot!;
      // Create a second slot with wood by splitting
      const emptySlot = inventory.getSlots().find((s) => s.item === null && s.id !== slot1.id)!;
      emptySlot.item = wood;
      emptySlot.quantity = 3;

      const moveResult = inventory.moveItem(emptySlot.id, slot1.id, 3);

      expect(moveResult.success).toBe(true);
      expect(slot1.quantity).toBe(8);
      expect(emptySlot.item).toBeNull();
    });

    it("should swap items when target slot is occupied with incompatible item", () => {
      const wood = itemFactory.createItem("body_parts");
      const axe = itemFactory.createItem("melee_knife");

      const woodSlot = inventory.addItem(wood, 5).slot!;
      const axeSlot = inventory.addItem(axe, 1).slot!;

      const moveResult = inventory.moveItem(woodSlot.id, axeSlot.id);

      expect(moveResult.success).toBe(true);
      expect(woodSlot.item).toBe(axe);
      expect(axeSlot.item).toBe(wood);
    });
  });

  describe("inventory querying", () => {
    it("should find items by predicate", () => {
      const wood = itemFactory.createItem("body_parts");
      const trap = itemFactory.createItem("animal_trap");

      inventory.addItem(wood, 5);
      inventory.addItem(trap, 1);

      const tools = inventory.findItems((item) => item.baseType === "tool");
      expect(tools).toHaveLength(1);
      expect(tools[0].item).toBe(trap);
    });

    it("should count items by type", () => {
      const wood = itemFactory.createItem("body_parts");

      inventory.addItem(wood, 10);
      inventory.addItem(wood, 5);

      const count = inventory.getItemCount("body_parts");
      expect(count).toBe(15);
    });

    it("should find items by type", () => {
      const wood = itemFactory.createItem("body_parts");
      inventory.addItem(wood, 5);

      const foundSlot = inventory.findItemByType("body_parts");
      expect(foundSlot).toBeDefined();
      expect(foundSlot!.item?.type).toBe("body_parts");
    });
  });

  describe("inventory sorting", () => {
    it("should sort by category", () => {
      const material = itemFactory.createItem("body_parts");
      const weapon = itemFactory.createItem("melee_knife");
      const consumable = itemFactory.createItem("alien_beer");

      inventory.addItem(consumable, 1);
      inventory.addItem(material, 5);
      inventory.addItem(weapon, 1);

      inventory.sortInventory("category");

      // Get only non-empty slots after sorting
      const nonEmptySlots = inventory.getSlots().filter((slot) => slot.item != null);

      expect(nonEmptySlots.length).toBe(3);
      // Explosives/boosters/medical/weapons/tools/equipment come first per order; verify weapon before materials before consumables
      expect(nonEmptySlots[0]?.item?.baseType).toBe("weapon");
      expect(nonEmptySlots[1]?.item?.baseType).toBe("material");
      expect(nonEmptySlots[2]?.item?.baseType).toBe("consumable");
    });

    it("should sort by name", () => {
      const wood = itemFactory.createItem("body_parts");
      const axe = itemFactory.createItem("melee_knife");

      inventory.addItem(wood, 5);
      inventory.addItem(axe, 1);

      inventory.sortInventory("name");

      const nonEmptySlots = inventory.getSlots().filter((slot) => slot.item != null);

      // "Body Parts" should come before "Knife" alphabetically
      expect(nonEmptySlots[0].item?.name).toBe("Body Parts");
      expect(nonEmptySlots[1].item?.name).toBe("Knife");
    });

    it("should sort by value", () => {
      const wood = itemFactory.createItem("body_parts"); // value: 3
      const axe = itemFactory.createItem("melee_knife"); // value: 40

      inventory.addItem(wood, 5);
      inventory.addItem(axe, 1);

      inventory.sortInventory("value");

      const nonEmptySlots = inventory.getSlots().filter((slot) => slot.item !== null);

      // Higher value items should come first
      expect(nonEmptySlots[0].item?.stats.value).toBeGreaterThan(
        nonEmptySlots[1].item?.stats.value ?? 0,
      );
    });
  });

  describe("quick slots", () => {
    it("should initialize 10 quick slots", () => {
      expect(inventory.getQuickslots()).toHaveLength(10);
      expect(inventory.getQuickslots()[0].hotkey).toBe("1");
      expect(inventory.getQuickslots()[9].hotkey).toBe("0");
    });

    it("should have auto-refill enabled by default", () => {
      expect(inventory.getQuickslots().every((slot) => slot.autoRefill)).toBe(true);
    });
  });
});
