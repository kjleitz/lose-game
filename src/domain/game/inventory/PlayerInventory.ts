import type { Item } from "../items/Item";

export interface PlayerInventory {
  getSlots(): InventorySlot[];
  readonly maxSlots: number;
  readonly maxWeight: number;
  readonly categories: InventoryCategory[];
  getQuickslots(): QuickSlot[];
  getCurrentWeight(): number;
  readonly filters: InventoryFilter[];
  addItem(item: Item, quantity?: number): AddItemResult;
  sortInventory(mode: SortMode): void;
}

export interface InventorySlot {
  readonly id: string;
  item: Item | null;
  quantity: number;
  readonly position: SlotPosition;
  readonly locked: boolean; // prevents accidental actions
  readonly category?: InventoryCategory;
}

export interface SlotPosition {
  readonly x: number;
  readonly y: number;
}

export interface QuickSlot {
  readonly id: string;
  item: Item | null;
  readonly hotkey: string; // keyboard shortcut
  readonly autoRefill: boolean; // auto-refill from inventory
}

export type InventoryCategory =
  | "tools"
  | "weapons"
  | "materials"
  | "food"
  | "medicine"
  | "seeds"
  | "artifacts"
  | "misc";

export interface InventoryFilter {
  readonly category?: InventoryCategory;
  readonly searchTerm?: string;
  readonly minQuality?: string;
  readonly showBroken?: boolean;
}

export interface InventoryOperation {
  readonly type: OperationType;
  readonly source: string;
  readonly target: string;
  readonly quantity?: number;
  readonly validation: ValidationResult;
}

export type OperationType = "move" | "split" | "combine" | "drop" | "use" | "craft" | "sort";

export interface ValidationResult {
  readonly valid: boolean;
  readonly reason?: string;
  readonly suggestions?: string[];
}

export interface AddItemResult {
  readonly success: boolean;
  readonly slot?: InventorySlot;
  readonly reason?: string;
}

export interface RemoveItemResult {
  readonly success: boolean;
  readonly removed?: { item: Item; quantity: number };
  readonly reason?: string;
}

export interface MoveItemResult {
  readonly success: boolean;
  readonly reason?: string;
}

export class PlayerInventoryManager implements PlayerInventory {
  private _slots: Map<string, InventorySlot> = new Map();
  private _quickSlots: Map<string, QuickSlot> = new Map();

  readonly maxSlots: number;
  readonly maxWeight: number;
  readonly categories: InventoryCategory[] = [
    "tools",
    "weapons",
    "materials",
    "food",
    "medicine",
    "seeds",
    "artifacts",
    "misc",
  ];
  readonly filters: InventoryFilter[] = [];

  constructor(maxSlots: number = 40, maxWeight: number = 100) {
    this.maxSlots = maxSlots;
    this.maxWeight = maxWeight;
    this.initializeSlots();
    this.initializeQuickSlots();
  }

  getSlots(): InventorySlot[] {
    return Array.from(this._slots.values());
  }

  getQuickslots(): QuickSlot[] {
    return Array.from(this._quickSlots.values());
  }

  getCurrentWeight(): number {
    let totalWeight = 0;
    for (const slot of this._slots.values()) {
      if (slot.item) {
        totalWeight += slot.item.properties.weight * slot.quantity;
      }
    }
    return totalWeight;
  }

  addItem(item: Item, quantity: number = 1): AddItemResult {
    // 1. Check weight limit first
    const totalWeight = this.getCurrentWeight() + item.properties.weight * quantity;
    if (totalWeight > this.maxWeight) {
      return { success: false, reason: "Too heavy" };
    }

    // 2. Try to stack with existing items
    const stackableSlot = this.findStackableSlot(item);
    if (stackableSlot && this.canAddToStack(stackableSlot, quantity)) {
      return this.addToStack(stackableSlot, quantity);
    }

    // 3. Find empty slot
    const emptySlot = this.findEmptySlot();
    if (!emptySlot) {
      return { success: false, reason: "Inventory full" };
    }

    // 4. Add to empty slot
    emptySlot.item = item;
    emptySlot.quantity = quantity;

    return { success: true, slot: emptySlot };
  }

  removeItem(slotId: string, quantity: number = 1): RemoveItemResult {
    const slot = this._slots.get(slotId);
    if (!slot || !slot.item) {
      return { success: false, reason: "Slot is empty" };
    }

    if (quantity >= slot.quantity) {
      // Remove entire stack
      const removedItem = { item: slot.item, quantity: slot.quantity };
      slot.item = null;
      slot.quantity = 0;
      return { success: true, removed: removedItem };
    } else {
      // Reduce stack size
      slot.quantity -= quantity;
      const removedItem = { item: slot.item, quantity };
      return { success: true, removed: removedItem };
    }
  }

  moveItem(fromSlotId: string, toSlotId: string, quantity?: number): MoveItemResult {
    const source = this._slots.get(fromSlotId);
    const target = this._slots.get(toSlotId);

    if (!source || !source.item) {
      return { success: false, reason: "Source slot is empty" };
    }

    if (!target) {
      return { success: false, reason: "Target slot not found" };
    }

    // Validate move
    const validation = this.validateMove(source, target, quantity);
    if (!validation.valid) {
      return { success: false, reason: validation.reason };
    }

    const moveQuantity = quantity || source.quantity;

    if (target.item && this.canStack(source.item, target.item)) {
      // Stack items
      return this.stackItems(source, target, moveQuantity);
    } else if (!target.item) {
      // Move to empty slot
      return this.moveToEmptySlot(source, target, moveQuantity);
    } else {
      // Swap items
      return this.swapItems(source, target);
    }
  }

  findItems(predicate: (item: Item) => boolean): InventorySlot[] {
    const results: InventorySlot[] = [];
    for (const slot of this._slots.values()) {
      if (slot.item && predicate(slot.item)) {
        results.push(slot);
      }
    }
    return results;
  }

  findItemByType(itemType: string): InventorySlot | null {
    for (const slot of this._slots.values()) {
      if (slot.item && slot.item.type === itemType) {
        return slot;
      }
    }
    return null;
  }

  getItemCount(itemType: string): number {
    let count = 0;
    for (const slot of this._slots.values()) {
      if (slot.item && slot.item.type === itemType) {
        count += slot.quantity;
      }
    }
    return count;
  }

  sortInventory(mode: SortMode): void {
    const itemSlots = this.getSlots().filter((slot) => slot.item !== null);

    // Sort based on mode
    switch (mode) {
      case "category":
        itemSlots.sort((a, b) => this.compareByCategory(a, b));
        break;
      case "name":
        itemSlots.sort((a, b) => a.item!.name.localeCompare(b.item!.name));
        break;
      case "value":
        itemSlots.sort((a, b) => b.item!.stats.value - a.item!.stats.value);
        break;
      case "weight":
        itemSlots.sort((a, b) => a.item!.properties.weight - b.item!.properties.weight);
        break;
    }

    // Reassign items to slots in sorted order
    this.reassignSortedItems(itemSlots);
  }

  private initializeSlots(): void {
    const slotsPerRow = 8;

    for (let i = 0; i < this.maxSlots; i++) {
      const x = i % slotsPerRow;
      const y = Math.floor(i / slotsPerRow);

      this._slots.set(`slot_${i}`, {
        id: `slot_${i}`,
        item: null,
        quantity: 0,
        position: { x, y },
        locked: false,
      });
    }
  }

  private initializeQuickSlots(): void {
    for (let i = 0; i < 10; i++) {
      const hotkey = i === 9 ? "0" : (i + 1).toString();
      this._quickSlots.set(`quick_${i}`, {
        id: `quick_${i}`,
        item: null,
        hotkey,
        autoRefill: true,
      });
    }
  }

  private findStackableSlot(item: Item): InventorySlot | null {
    if (!item.properties.stackable) {
      return null;
    }

    for (const slot of this._slots.values()) {
      if (slot.item && this.canStack(slot.item, item)) {
        return slot;
      }
    }
    return null;
  }

  private canStack(item1: Item, item2: Item): boolean {
    return (
      item1.type === item2.type &&
      item1.properties.stackable &&
      item2.properties.stackable &&
      item1.properties.quality === item2.properties.quality &&
      this.itemsHaveSameCondition(item1, item2)
    );
  }

  private itemsHaveSameCondition(item1: Item, item2: Item): boolean {
    // Items must have the same durability percentage and condition to stack
    if (item1.properties.durability && item2.properties.durability) {
      const durability1 =
        item1.properties.durability.currentDurability / item1.properties.durability.maxDurability;
      const durability2 =
        item2.properties.durability.currentDurability / item2.properties.durability.maxDurability;
      return Math.abs(durability1 - durability2) < 0.05; // 5% tolerance
    }
    return true; // No durability requirements
  }

  private canAddToStack(slot: InventorySlot, quantity: number): boolean {
    if (!slot.item) return false;
    return slot.quantity + quantity <= slot.item.properties.maxStackSize;
  }

  private addToStack(slot: InventorySlot, quantity: number): AddItemResult {
    slot.quantity += quantity;
    return { success: true, slot };
  }

  private findEmptySlot(): InventorySlot | null {
    for (const slot of this._slots.values()) {
      if (!slot.item) {
        return slot;
      }
    }
    return null;
  }

  private validateMove(
    source: InventorySlot,
    target: InventorySlot,
    quantity?: number,
  ): ValidationResult {
    if (source.locked || target.locked) {
      return { valid: false, reason: "Slot is locked" };
    }

    if (quantity && quantity > source.quantity) {
      return { valid: false, reason: "Not enough items in source slot" };
    }

    return { valid: true };
  }

  private stackItems(
    source: InventorySlot,
    target: InventorySlot,
    quantity: number,
  ): MoveItemResult {
    if (!target.item || !this.canAddToStack(target, quantity)) {
      return { success: false, reason: "Cannot stack items" };
    }

    target.quantity += quantity;
    source.quantity -= quantity;

    if (source.quantity === 0) {
      source.item = null;
    }

    return { success: true };
  }

  private moveToEmptySlot(
    source: InventorySlot,
    target: InventorySlot,
    quantity: number,
  ): MoveItemResult {
    if (quantity === source.quantity) {
      // Move entire stack
      target.item = source.item;
      target.quantity = source.quantity;
      source.item = null;
      source.quantity = 0;
    } else {
      // Split stack
      target.item = source.item;
      target.quantity = quantity;
      source.quantity -= quantity;
    }

    return { success: true };
  }

  private swapItems(source: InventorySlot, target: InventorySlot): MoveItemResult {
    const tempItem = source.item;
    const tempQuantity = source.quantity;

    source.item = target.item;
    source.quantity = target.quantity;

    target.item = tempItem;
    target.quantity = tempQuantity;

    return { success: true };
  }

  private compareByCategory(a: InventorySlot, b: InventorySlot): number {
    if (!a.item || !b.item) return 0;

    const categoryOrder = [
      "tools",
      "weapons",
      "materials",
      "food",
      "medicine",
      "seeds",
      "artifacts",
      "misc",
    ];

    const categoryA = this.getItemCategory(a.item);
    const categoryB = this.getItemCategory(b.item);

    const indexA = categoryOrder.indexOf(categoryA);
    const indexB = categoryOrder.indexOf(categoryB);

    return indexA - indexB;
  }

  private getItemCategory(item: Item): InventoryCategory {
    switch (item.baseType) {
      case "tool":
        return "tools";
      case "weapon":
        return "weapons";
      case "material":
        return "materials";
      case "consumable":
        if (item.type.includes("food")) {
          return "food";
        } else if (item.type.includes("medicine")) {
          return "medicine";
        }
        return "misc";
      case "seed":
        return "seeds";
      case "artifact":
        return "artifacts";
      default:
        return "misc";
    }
  }

  private reassignSortedItems(sortedSlots: InventorySlot[]): void {
    // Store the items and quantities we need to reassign
    const itemsToReassign = sortedSlots.map((slot) => ({
      item: slot.item,
      quantity: slot.quantity,
    }));

    // Clear all slots first
    for (const slot of this._slots.values()) {
      slot.item = null;
      slot.quantity = 0;
    }

    // Get slots in order by their ID (slot_0, slot_1, etc.)
    const orderedSlots = Array.from(this._slots.values()).sort((a, b) => {
      const aNum = parseInt(a.id.split("_")[1]);
      const bNum = parseInt(b.id.split("_")[1]);
      return aNum - bNum;
    });

    // Reassign items to slots in order
    for (let i = 0; i < itemsToReassign.length && i < orderedSlots.length; i++) {
      orderedSlots[i].item = itemsToReassign[i].item;
      orderedSlots[i].quantity = itemsToReassign[i].quantity;
    }
  }
}

export type SortMode = "category" | "name" | "value" | "weight";
