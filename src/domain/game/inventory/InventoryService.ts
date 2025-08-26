import type { Item, ItemCondition } from "../items/Item";
import type { PlayerInventoryManager, InventorySlot } from "./PlayerInventory";

export class InventoryService {
  private inventory: PlayerInventoryManager;

  constructor(inventory: PlayerInventoryManager) {
    this.inventory = inventory;
  }

  // Item condition management
  updateItemCondition(slotId: string, newCondition: ItemCondition): boolean {
    const slot = this.inventory.slots.find((s) => s.id === slotId);
    if (!slot || !slot.item) {
      return false;
    }

    // Update item condition based on durability or freshness
    if (slot.item.properties.durability) {
      this.updateDurabilityBasedCondition(slot.item, newCondition);
    } else if (slot.item.properties.perishable) {
      this.updatePerishableCondition(slot.item, newCondition);
    }

    return true;
  }

  // Perishable item management
  updatePerishableItems(dt: number): void {
    for (const slot of this.inventory.slots) {
      if (slot.item?.properties.perishable) {
        this.updateItemFreshness(slot.item, dt);
      }
    }
  }

  private updateItemFreshness(item: Item, dt: number): void {
    const perishable = item.properties.perishable!;

    // Calculate spoilage rate based on current conditions
    const spoilageRate = perishable.spoilageRate;

    // TODO: Add temperature and preservation effects
    // Temperature affects spoilage (hot = faster, cold = slower)
    // Preservation methods slow spoilage

    // Update freshness
    const freshnessLoss = spoilageRate * dt;
    perishable.currentFreshness = Math.max(0, perishable.currentFreshness - freshnessLoss);

    // Update item condition based on freshness
    const freshnessPercent = perishable.currentFreshness / perishable.maxFreshness;
    const newCondition = this.calculateConditionFromFreshness(freshnessPercent);

    if (newCondition === "spoiled") {
      this.handleFoodSpoilage(item);
    }
  }

  private calculateConditionFromFreshness(freshnessPercent: number): ItemCondition {
    if (freshnessPercent === 0) return "spoiled";
    if (freshnessPercent < 0.2) return "damaged";
    if (freshnessPercent < 0.5) return "worn";
    if (freshnessPercent < 0.8) return "good";
    return "pristine";
  }

  private handleFoodSpoilage(item: Item): void {
    // TODO: Implement spoilage effects
    // - Reduce nutritional value
    // - Add negative effects if consumed
    // - Change item appearance
    console.log(`${item.name} has spoiled!`);
  }

  // Tool durability management
  damageItem(slotId: string, damage: number): boolean {
    const slot = this.inventory.slots.find((s) => s.id === slotId);
    if (!slot?.item?.properties.durability) {
      return false;
    }

    const durability = slot.item.properties.durability;
    durability.currentDurability = Math.max(0, durability.currentDurability - damage);

    // Update condition based on durability
    const durabilityPercent = durability.currentDurability / durability.maxDurability;
    const newCondition = this.calculateConditionFromDurability(durabilityPercent);

    if (newCondition === "broken" || newCondition === "destroyed") {
      this.handleItemBreaking(slot.item);
    }

    return true;
  }

  repairItem(slotId: string, repairAmount: number): boolean {
    const slot = this.inventory.slots.find((s) => s.id === slotId);
    if (!slot?.item?.properties.durability) {
      return false;
    }

    const durability = slot.item.properties.durability;
    durability.currentDurability = Math.min(
      durability.maxDurability,
      durability.currentDurability + repairAmount,
    );

    return true;
  }

  private calculateConditionFromDurability(durabilityPercent: number): ItemCondition {
    if (durabilityPercent === 0) return "destroyed";
    if (durabilityPercent < 0.25) return "broken";
    if (durabilityPercent < 0.5) return "damaged";
    if (durabilityPercent < 0.7) return "worn";
    if (durabilityPercent < 0.9) return "good";
    return "pristine";
  }

  private handleItemBreaking(item: Item): void {
    // TODO: Implement item breaking effects
    // - Reduce effectiveness
    // - Prevent usage
    // - Show visual indicators
    console.log(`${item.name} is broken and needs repair!`);
  }

  private updateDurabilityBasedCondition(_item: Item, _newCondition: ItemCondition): void {
    // This method would update the item's condition based on external factors
    // For now, it's a placeholder for future enhancements
  }

  private updatePerishableCondition(_item: Item, _newCondition: ItemCondition): void {
    // This method would update the item's condition based on external factors
    // For now, it's a placeholder for future enhancements
  }

  // Inventory querying and filtering
  getItemsByCategory(category: string): InventorySlot[] {
    return this.inventory.findItems((item) => {
      switch (category) {
        case "tools":
          return item.baseType === "tool";
        case "weapons":
          return item.baseType === "weapon";
        case "materials":
          return item.baseType === "material";
        case "food":
          return item.baseType === "consumable" && item.type.includes("food");
        default:
          return false;
      }
    });
  }

  getUsableItems(): InventorySlot[] {
    return this.inventory.findItems((item) => {
      // Check if item is in usable condition
      if (item.properties.durability) {
        return item.properties.durability.currentDurability > 0;
      }
      if (item.properties.perishable) {
        return item.properties.perishable.currentFreshness > 0;
      }
      return true;
    });
  }

  getBrokenItems(): InventorySlot[] {
    return this.inventory.findItems((item) => {
      if (item.properties.durability) {
        const durabilityPercent =
          item.properties.durability.currentDurability / item.properties.durability.maxDurability;
        return durabilityPercent <= 0.25;
      }
      return false;
    });
  }

  getSpoiledItems(): InventorySlot[] {
    return this.inventory.findItems((item) => {
      if (item.properties.perishable) {
        const freshnessPercent =
          item.properties.perishable.currentFreshness / item.properties.perishable.maxFreshness;
        return freshnessPercent <= 0.2;
      }
      return false;
    });
  }

  // Weight and capacity management
  canAddWeight(additionalWeight: number): boolean {
    return this.inventory.currentWeight + additionalWeight <= this.inventory.maxWeight;
  }

  getWeightCapacityInfo(): { current: number; max: number; percent: number } {
    const current = this.inventory.currentWeight;
    const max = this.inventory.maxWeight;
    const percent = (current / max) * 100;

    return { current, max, percent };
  }

  getSpaceInfo(): { used: number; max: number; available: number } {
    const usedSlots = this.inventory.slots.filter((slot) => slot.item !== null).length;
    const maxSlots = this.inventory.maxSlots;
    const available = maxSlots - usedSlots;

    return { used: usedSlots, max: maxSlots, available };
  }

  // Quick slot management
  assignToQuickSlot(slotId: string, quickSlotId: string): boolean {
    const slot = this.inventory.slots.find((s) => s.id === slotId);
    const quickSlot = this.inventory.quickslots.find((qs) => qs.id === quickSlotId);

    if (!slot?.item || !quickSlot) {
      return false;
    }

    quickSlot.item = slot.item;
    return true;
  }

  useQuickSlot(quickSlotId: string): { success: boolean; item?: Item; reason?: string } {
    const quickSlot = this.inventory.quickslots.find((qs) => qs.id === quickSlotId);

    if (!quickSlot?.item) {
      return { success: false, reason: "Quick slot is empty" };
    }

    const item = quickSlot.item;

    // Check if item is usable
    if (!this.isItemUsable(item)) {
      return { success: false, reason: "Item is not usable in current condition" };
    }

    // TODO: Implement item usage logic
    // This would depend on the item type and context

    // Auto-refill logic
    if (quickSlot.autoRefill) {
      const replacement = this.inventory.findItemByType(item.type);
      if (replacement) {
        quickSlot.item = replacement.item;
        this.inventory.removeItem(replacement.id, 1);
      } else {
        quickSlot.item = null;
      }
    }

    return { success: true, item };
  }

  private isItemUsable(item: Item): boolean {
    // Check durability
    if (item.properties.durability) {
      return item.properties.durability.currentDurability > 0;
    }

    // Check freshness for perishable items
    if (item.properties.perishable) {
      return item.properties.perishable.currentFreshness > 0;
    }

    return true;
  }
}
