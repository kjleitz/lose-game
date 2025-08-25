import { describe, it, expect, beforeEach } from "vitest";
import { ItemFactory } from "./ItemFactory";
import { ItemQuality, ToolType, BaseItemType } from "./Item";

describe("ItemFactory", () => {
  let factory: ItemFactory;

  beforeEach(() => {
    factory = new ItemFactory();
  });

  describe("basic item creation", () => {
    it("should create a basic item from template", () => {
      const item = factory.createItem("wood");

      expect(item.id).toBeDefined();
      expect(item.type).toBe("wood");
      expect(item.baseType).toBe(BaseItemType.MATERIAL);
      expect(item.name).toBe("Wood");
      expect(item.properties.quality).toBe(ItemQuality.COMMON);
      expect(item.metadata.discoveredAt).toBeDefined();
    });

    it("should throw error for unknown template", () => {
      expect(() => factory.createItem("unknown_item")).toThrow("Template unknown_item not found");
    });
  });

  describe("quality modifiers", () => {
    it("should apply quality modifiers correctly", () => {
      const commonAxe = factory.createItem("iron_axe", ItemQuality.COMMON);
      const excellentAxe = factory.createItem("iron_axe", ItemQuality.EXCELLENT);

      expect(excellentAxe.properties.quality).toBe(ItemQuality.EXCELLENT);
      expect(excellentAxe.name).toBe("Superior Iron Axe");
      
      // Excellent quality should have 25% better stats
      if (commonAxe.stats.effectiveness && excellentAxe.stats.effectiveness) {
        expect(excellentAxe.stats.effectiveness).toBeCloseTo(
          commonAxe.stats.effectiveness * 1.25
        );
      }

      if (commonAxe.stats.value && excellentAxe.stats.value) {
        expect(excellentAxe.stats.value).toBeCloseTo(commonAxe.stats.value * 1.25);
      }
    });

    it("should handle legendary quality items", () => {
      const legendaryAxe = factory.createItem("iron_axe", ItemQuality.LEGENDARY);

      expect(legendaryAxe.name).toBe("Legendary Iron Axe");
      expect(legendaryAxe.properties.quality).toBe(ItemQuality.LEGENDARY);

      // Legendary quality should double the effectiveness
      if (legendaryAxe.stats.effectiveness) {
        expect(legendaryAxe.stats.effectiveness).toBeCloseTo(4.0); // base 2.0 * 2.0
      }
    });

    it("should enhance durability for quality items", () => {
      const commonAxe = factory.createItem("iron_axe", ItemQuality.COMMON);
      const masterworkAxe = factory.createItem("iron_axe", ItemQuality.MASTERWORK);

      expect(commonAxe.properties.durability?.maxDurability).toBe(200);
      expect(masterworkAxe.properties.durability?.maxDurability).toBe(300); // 200 * 1.5
    });
  });

  describe("specialized item creation", () => {
    it("should create tools with proper tool-specific properties", () => {
      const axe = factory.createTool(ToolType.AXE);

      expect(axe.toolType).toBe(ToolType.AXE);
      expect(axe.effectiveness.get("chop_wood")).toBe(2.0);
      expect(axe.effectiveness.get("combat_melee")).toBe(1.5);
      expect(axe.energyCost).toBeDefined();
      expect(axe.specialAbilities).toBeDefined();
    });

    it("should create materials with stacking properties", () => {
      const wood = factory.createMaterial("wood", 10);

      expect(wood.properties.stackable).toBe(true);
      expect(wood.properties.maxStackSize).toBe(50);
      expect(wood.materialType).toBe("wood");
      expect(wood.processingMethods).toContain("machining");
      expect(wood.derivatives).toContain("wooden_planks");
    });

    it("should create consumables with effects", () => {
      const meat = factory.createConsumable("food");

      expect(meat.consumableType).toBe("food");
      expect(meat.effects).toHaveLength(2);
      
      const healthEffect = meat.effects.find(e => e.type === "restore_health");
      expect(healthEffect).toBeDefined();
      expect(healthEffect!.amount).toBe(25);
    });
  });

  describe("item modifiers", () => {
    it("should apply modifiers to items", () => {
      const modifiedAxe = factory.createItem("iron_axe", ItemQuality.COMMON, ["sharp"]);

      expect(modifiedAxe.metadata.modifications).toHaveLength(1);
      expect(modifiedAxe.metadata.modifications![0].type).toBe("Sharp");
      
      // Should have increased effectiveness from sharp modifier
      expect(modifiedAxe.stats.effectiveness).toBeCloseTo(2.2); // 2.0 + 0.2
    });
  });

  describe("item durability", () => {
    it("should set durability properties correctly", () => {
      const axe = factory.createItem("iron_axe");

      expect(axe.properties.durability).toBeDefined();
      expect(axe.properties.durability!.maxDurability).toBe(200);
      expect(axe.properties.durability!.currentDurability).toBe(200);
      expect(axe.properties.durability!.repairability.canRepair).toBe(true);
      expect(axe.properties.durability!.repairability.requiredMaterials).toContain("iron_ingot");
    });

    it("should handle items without durability", () => {
      const wood = factory.createItem("wood");

      expect(wood.properties.durability).toBeUndefined();
    });
  });

  describe("perishable items", () => {
    it("should set perishable properties for food", () => {
      const meat = factory.createItem("cooked_meat");

      expect(meat.properties.perishable).toBeDefined();
      expect(meat.properties.perishable!.maxFreshness).toBe(72);
      expect(meat.properties.perishable!.currentFreshness).toBe(72);
      expect(meat.properties.perishable!.spoilageRate).toBe(1.0);
    });
  });
});