# Player Inventory System Design

## Overview

The inventory system manages all items the player carries, stores, and organizes during planet exploration. It provides intuitive item management, crafting support, and meaningful inventory constraints that drive gameplay decisions about what to carry and what to leave behind.

## Core Requirements

- **Limited capacity**: Weight and slot-based limitations force meaningful decisions
- **Item organization**: Categories, stacking, sorting, and search functionality
- **Crafting integration**: Easy access to materials for crafting recipes
- **Tool management**: Quick access to tools with durability tracking
- **Perishable items**: Food spoilage and item degradation over time
- **Cross-mode persistence**: Inventory works in both space and planet modes

## Domain Model

### Inventory Structure

```typescript
interface PlayerInventory {
  readonly slots: InventorySlot[];
  readonly maxSlots: number;
  readonly maxWeight: number;
  readonly categories: InventoryCategory[];
  readonly quickslots: QuickSlot[];
  readonly currentWeight: number;
  readonly filters: InventoryFilter[];
}

interface InventorySlot {
  readonly id: SlotId;
  readonly item: Item | null;
  readonly quantity: number;
  readonly position: SlotPosition;
  readonly locked: boolean; // prevents accidental actions
  readonly category?: CategoryId;
}

interface QuickSlot {
  readonly id: QuickSlotId;
  readonly item: Item | null;
  readonly hotkey: string; // keyboard shortcut
  readonly autoRefill: boolean; // auto-refill from inventory
}

enum InventoryCategory {
  TOOLS = "tools",
  WEAPONS = "weapons",
  MATERIALS = "materials",
  FOOD = "food",
  MEDICINE = "medicine",
  SEEDS = "seeds",
  ARTIFACTS = "artifacts",
  MISC = "misc",
}
```

### Item Management

```typescript
interface Item {
  readonly id: ItemId;
  readonly type: ItemType;
  readonly name: string;
  readonly description: string;
  readonly category: InventoryCategory;
  readonly properties: ItemProperties;
  readonly condition: ItemCondition;
  readonly metadata: ItemMetadata;
}

interface ItemProperties {
  readonly weight: number;
  readonly stackable: boolean;
  readonly maxStackSize: number;
  readonly durability?: DurabilityInfo;
  readonly perishable?: PerishableInfo;
  readonly value: number; // for trading
  readonly rarity: ItemRarity;
}

interface DurabilityInfo {
  readonly maxDurability: number;
  readonly currentDurability: number;
  readonly repairability: RepairInfo;
  readonly degradationRate: number; // per use
}

interface PerishableInfo {
  readonly maxFreshness: number; // in game hours
  readonly currentFreshness: number;
  readonly spoilageRate: number; // freshness loss per hour
  readonly preservationMethods: PreservationMethod[];
}

enum ItemCondition {
  PRISTINE = "pristine", // 100-90% durability/freshness
  GOOD = "good", // 90-70%
  WORN = "worn", // 70-50%
  DAMAGED = "damaged", // 50-25%
  BROKEN = "broken", // 25-1%
  DESTROYED = "destroyed", // 0%
  SPOILED = "spoiled", // for food items
}
```

### Inventory Operations

```typescript
interface InventoryOperation {
  readonly type: OperationType;
  readonly source: SlotId | "external";
  readonly target: SlotId;
  readonly quantity?: number;
  readonly validation: ValidationResult;
}

enum OperationType {
  MOVE = "move",
  SPLIT = "split",
  COMBINE = "combine",
  DROP = "drop",
  USE = "use",
  CRAFT = "craft",
  SORT = "sort",
}

interface ValidationResult {
  readonly valid: boolean;
  readonly reason?: string;
  readonly suggestions?: string[];
}
```

## System Architecture

### Domain Layer (`src/domain/game/inventory/`)

```
inventory/
├── PlayerInventory.ts      # Main inventory management
├── InventorySlot.ts        # Individual slot logic
├── ItemStack.ts            # Stackable item handling
├── QuickSlotManager.ts     # Quick access slots
├── ItemCondition.ts        # Durability and freshness
├── InventoryOperations.ts  # Move, split, combine operations
├── InventoryConstraints.ts # Weight and size limits
├── services/
│   ├── InventoryService.ts # Inventory management service
│   ├── ItemService.ts      # Item creation and validation
│   └── PerishableService.ts # Food spoilage tracking
└── validators/
    ├── SlotValidator.ts    # Slot placement validation
    ├── WeightValidator.ts  # Weight limit validation
    └── StackValidator.ts   # Stack combination validation
```

### UI Layer (`src/ui/inventory/`)

```
inventory/
├── InventoryPanel.tsx      # Main inventory UI
├── InventoryGrid.tsx       # Grid-based slot layout
├── ItemSlot.tsx           # Individual slot component
├── QuickSlotBar.tsx       # Quick access bar
├── ItemTooltip.tsx        # Item information display
├── InventoryFilters.tsx   # Category and search filters
├── ItemContextMenu.tsx    # Right-click actions
├── CraftingInterface.tsx  # Crafting from inventory
└── InventorySettings.tsx  # Auto-sort, filters, etc.
```

## Implementation Details

### Inventory Management

```typescript
class PlayerInventory {
  private slots: Map<SlotId, InventorySlot> = new Map();
  private quickSlots: Map<QuickSlotId, QuickSlot> = new Map();
  private categoryFilters: Set<InventoryCategory> = new Set();
  private sortMode: SortMode = SortMode.CATEGORY;

  addItem(item: Item, quantity: number = 1): AddItemResult {
    // 1. Try to stack with existing items
    const stackableSlot = this.findStackableSlot(item);
    if (stackableSlot && this.canAddToStack(stackableSlot, quantity)) {
      return this.addToStack(stackableSlot, quantity);
    }

    // 2. Find empty slot
    const emptySlot = this.findEmptySlot();
    if (!emptySlot) {
      return { success: false, reason: "Inventory full" };
    }

    // 3. Check weight limit
    const totalWeight = this.currentWeight + item.properties.weight * quantity;
    if (totalWeight > this.maxWeight) {
      return { success: false, reason: "Too heavy" };
    }

    // 4. Add to empty slot
    emptySlot.item = item;
    emptySlot.quantity = quantity;
    this.updateTotalWeight();

    return { success: true, slot: emptySlot };
  }

  removeItem(slotId: SlotId, quantity: number = 1): RemoveItemResult {
    const slot = this.slots.get(slotId);
    if (!slot || !slot.item) {
      return { success: false, reason: "Slot is empty" };
    }

    if (quantity >= slot.quantity) {
      // Remove entire stack
      const removedItem = { item: slot.item, quantity: slot.quantity };
      slot.item = null;
      slot.quantity = 0;
      this.updateTotalWeight();
      return { success: true, removed: removedItem };
    } else {
      // Reduce stack size
      slot.quantity -= quantity;
      const removedItem = { item: slot.item, quantity };
      this.updateTotalWeight();
      return { success: true, removed: removedItem };
    }
  }

  moveItem(fromSlot: SlotId, toSlot: SlotId, quantity?: number): MoveItemResult {
    const source = this.slots.get(fromSlot);
    const target = this.slots.get(toSlot);

    if (!source || !source.item) {
      return { success: false, reason: "Source slot is empty" };
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
}
```

### Item Durability System

```typescript
class ItemConditionManager {
  updateItemCondition(item: Item, usage: ItemUsage): void {
    if (!item.properties.durability) return;

    const degradation = this.calculateDegradation(item, usage);
    const newDurability = Math.max(0, item.properties.durability.currentDurability - degradation);

    // Update durability
    item.properties.durability.currentDurability = newDurability;

    // Update condition enum
    const conditionPercent = newDurability / item.properties.durability.maxDurability;
    item.condition = this.calculateConditionFromPercent(conditionPercent);

    // Handle item breaking
    if (newDurability === 0) {
      this.handleItemBreaking(item);
    } else if (conditionPercent < 0.25) {
      // Warn player about low durability
      this.notifyLowDurability(item);
    }
  }

  private calculateDegradation(item: Item, usage: ItemUsage): number {
    let baseDegradation = item.properties.durability.degradationRate;

    // Different usage types cause different wear
    switch (usage.type) {
      case "normal_use":
        baseDegradation *= 1.0;
        break;
      case "heavy_use":
        baseDegradation *= 2.0;
        break;
      case "critical_failure":
        baseDegradation *= 5.0;
        break;
    }

    // Environmental factors
    if (usage.environment === "harsh") {
      baseDegradation *= 1.5;
    }

    // Item quality affects durability loss
    const qualityModifier = this.getQualityDurabilityModifier(item.properties.quality);

    return baseDegradation * qualityModifier;
  }

  repairItem(item: Item, repairMaterial: Item, skillLevel: number): RepairResult {
    if (!item.properties.durability?.repairability.canRepair) {
      return { success: false, reason: "Item cannot be repaired" };
    }

    // Check if repair material is suitable
    const suitableMaterials = item.properties.durability.repairability.requiredMaterials;
    if (!suitableMaterials.includes(repairMaterial.type)) {
      return { success: false, reason: "Wrong repair material" };
    }

    // Calculate repair amount based on skill and material quality
    const baseRepair = repairMaterial.properties.repairValue || 20;
    const skillModifier = 1.0 + skillLevel * 0.1;
    const repairAmount = Math.floor(baseRepair * skillModifier);

    // Apply repair
    const maxDurability = item.properties.durability.maxDurability;
    const newDurability = Math.min(
      maxDurability,
      item.properties.durability.currentDurability + repairAmount,
    );

    item.properties.durability.currentDurability = newDurability;
    item.condition = this.calculateConditionFromPercent(newDurability / maxDurability);

    return {
      success: true,
      durabilityRestored: newDurability - item.properties.durability.currentDurability,
      materialConsumed: 1,
    };
  }
}
```

### Perishable Food System

```typescript
class PerishableManager {
  updateFreshness(dt: number): void {
    for (const slot of this.inventory.slots.values()) {
      if (slot.item?.properties.perishable) {
        this.updateItemFreshness(slot.item, dt);
      }
    }
  }

  private updateItemFreshness(item: Item, dt: number): void {
    const perishable = item.properties.perishable!;

    // Calculate spoilage rate based on conditions
    let spoilageRate = perishable.spoilageRate;

    // Temperature affects spoilage (hot = faster, cold = slower)
    const temperature = this.getCurrentTemperature();
    const tempModifier = this.getTemperatureSpoilageModifier(temperature);
    spoilageRate *= tempModifier;

    // Preservation methods slow spoilage
    for (const preservation of perishable.preservationMethods) {
      spoilageRate *= this.getPreservationModifier(preservation);
    }

    // Update freshness
    const freshnessLoss = spoilageRate * dt;
    perishable.currentFreshness = Math.max(0, perishable.currentFreshness - freshnessLoss);

    // Update condition
    const freshnessPercent = perishable.currentFreshness / perishable.maxFreshness;
    if (freshnessPercent === 0) {
      item.condition = ItemCondition.SPOILED;
      this.handleFoodSpoilage(item);
    } else {
      item.condition = this.calculateConditionFromFreshness(freshnessPercent);
    }
  }

  private getPreservationModifier(method: PreservationMethod): number {
    switch (method) {
      case PreservationMethod.REFRIGERATION:
        return 0.3; // 70% slower spoilage
      case PreservationMethod.SALT_CURED:
        return 0.1; // 90% slower spoilage
      case PreservationMethod.DRIED:
        return 0.05; // 95% slower spoilage
      case PreservationMethod.CANNED:
        return 0.01; // 99% slower spoilage
      default:
        return 1.0; // no preservation
    }
  }
}
```

### Quick Slot Management

```typescript
class QuickSlotManager {
  private quickSlots: QuickSlot[] = Array(10)
    .fill(null)
    .map((_, i) => ({
      id: `quick_${i}`,
      item: null,
      hotkey: i === 9 ? "0" : (i + 1).toString(),
      autoRefill: true,
    }));

  assignToQuickSlot(slotId: QuickSlotId, item: Item): void {
    const quickSlot = this.quickSlots.find((qs) => qs.id === slotId);
    if (quickSlot) {
      quickSlot.item = item;
    }
  }

  useQuickSlot(slotId: QuickSlotId): UseItemResult {
    const quickSlot = this.quickSlots.find((qs) => qs.id === slotId);
    if (!quickSlot?.item) {
      return { success: false, reason: "Quick slot is empty" };
    }

    // Use the item
    const result = this.itemService.useItem(quickSlot.item);

    // Auto-refill if enabled and item was consumed
    if (result.consumed && quickSlot.autoRefill) {
      const replacement = this.inventory.findItem(quickSlot.item.type);
      if (replacement) {
        quickSlot.item = replacement.item;
        this.inventory.removeItem(replacement.slotId, 1);
      } else {
        quickSlot.item = null;
      }
    }

    return result;
  }

  handleHotkey(keyPressed: string): boolean {
    const quickSlot = this.quickSlots.find((qs) => qs.hotkey === keyPressed);
    if (quickSlot) {
      this.useQuickSlot(quickSlot.id);
      return true; // handled
    }
    return false; // not handled
  }
}
```

## Item Categories and Examples

### Tools

```typescript
const AXE: Item = {
  id: "iron_axe",
  type: "axe",
  name: "Iron Axe",
  category: InventoryCategory.TOOLS,
  properties: {
    weight: 2.5,
    stackable: false,
    maxStackSize: 1,
    durability: {
      maxDurability: 200,
      currentDurability: 200,
      degradationRate: 1, // loses 1 durability per tree cut
      repairability: {
        canRepair: true,
        requiredMaterials: ["iron_ingot", "wood"],
        skillRequired: "blacksmithing",
      },
    },
    value: 150,
    rarity: ItemRarity.COMMON,
  },
  condition: ItemCondition.PRISTINE,
};
```

### Consumables

```typescript
const COOKED_MEAT: Item = {
  id: "cooked_meat",
  type: "food",
  name: "Cooked Meat",
  category: InventoryCategory.FOOD,
  properties: {
    weight: 0.5,
    stackable: true,
    maxStackSize: 20,
    perishable: {
      maxFreshness: 72, // 72 game hours
      currentFreshness: 72,
      spoilageRate: 1, // loses 1 freshness per hour
      preservationMethods: [], // no preservation applied
    },
    nutritionValue: 40,
    value: 5,
    rarity: ItemRarity.COMMON,
  },
  condition: ItemCondition.PRISTINE,
};
```

### Materials

```typescript
const IRON_ORE: Item = {
  id: "iron_ore",
  type: "material",
  name: "Iron Ore",
  category: InventoryCategory.MATERIALS,
  properties: {
    weight: 1.0,
    stackable: true,
    maxStackSize: 50,
    value: 2,
    rarity: ItemRarity.COMMON,
    craftingIngredient: true,
  },
  condition: ItemCondition.PRISTINE,
};
```

## Integration Points

### With Crafting System

```typescript
interface CraftingIntegration {
  getAvailableMaterials(): Map<ItemType, number>;
  consumeMaterials(recipe: CraftingRecipe): boolean;
  addCraftedItem(item: Item): boolean;
}

class InventoryCraftingBridge implements CraftingIntegration {
  getAvailableMaterials(): Map<ItemType, number> {
    const materials = new Map<ItemType, number>();

    for (const slot of this.inventory.slots.values()) {
      if (slot.item?.category === InventoryCategory.MATERIALS) {
        const existing = materials.get(slot.item.type) || 0;
        materials.set(slot.item.type, existing + slot.quantity);
      }
    }

    return materials;
  }
}
```

### With Combat System

```typescript
interface CombatIntegration {
  getEquippedWeapon(): Item | null;
  consumeAmmo(ammoType: ItemType, quantity: number): boolean;
  damageEquippedItems(damage: number): void;
}

class InventoryCombatBridge implements CombatIntegration {
  getEquippedWeapon(): Item | null {
    const weaponSlot = this.quickSlots.find(
      (slot) => slot.item?.category === InventoryCategory.WEAPONS,
    );
    return weaponSlot?.item || null;
  }

  damageEquippedItems(damage: number): void {
    const equippedItems = this.getEquippedItems();
    for (const item of equippedItems) {
      this.conditionManager.updateItemCondition(item, {
        type: "combat_damage",
        amount: damage,
      });
    }
  }
}
```

## Performance Considerations

### Inventory Caching

```typescript
class InventoryCache {
  private categoryCache: Map<InventoryCategory, InventorySlot[]> = new Map();
  private weightCache: number | null = null;
  private dirty = true;

  invalidateCache(): void {
    this.dirty = true;
    this.categoryCache.clear();
    this.weightCache = null;
  }

  getItemsByCategory(category: InventoryCategory): InventorySlot[] {
    if (this.dirty) {
      this.rebuildCache();
    }

    return this.categoryCache.get(category) || [];
  }

  getTotalWeight(): number {
    if (this.weightCache === null) {
      this.weightCache = this.calculateTotalWeight();
    }
    return this.weightCache;
  }
}
```

## Testing Strategy

### Unit Tests

- **Item Operations**: Test add, remove, move, split, combine operations
- **Durability System**: Test item wear, repair, and breaking mechanics
- **Perishable System**: Test food spoilage under different conditions
- **Weight Limits**: Test inventory constraints and validation

### Integration Tests

- **Cross-Mode Persistence**: Test inventory state across space/planet mode transitions
- **Crafting Integration**: Test material availability and consumption
- **UI Synchronization**: Test inventory UI updates with backend changes

### Performance Tests

- **Large Inventories**: Benchmark operations with 1000+ items
- **Real-time Updates**: Test perishable updates at scale
- **UI Responsiveness**: Ensure UI remains responsive during operations

## Success Metrics

- **Usability**: Players can find and organize items intuitively
- **Performance**: All inventory operations complete in <10ms
- **Balance**: Inventory constraints drive meaningful gameplay decisions
- **Persistence**: 100% data integrity across game sessions
- **Integration**: Seamless interaction with crafting, combat, and trading systems
