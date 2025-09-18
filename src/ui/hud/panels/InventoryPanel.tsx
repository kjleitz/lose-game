import type { JSX } from "react";
import { useState } from "react";
import type {
  PlayerInventory,
  InventorySlot,
} from "../../../domain/game/inventory/PlayerInventory";
import type { Item } from "../../../domain/game/items/Item";
import { Panel, Button } from "../../controls";

interface InventoryPanelProps {
  inventory?: PlayerInventory;
  visible?: boolean;
  onToggle?: () => void;
  onItemUse?: (item: Item) => void;
  onItemDrop?: (item: Item, quantity: number) => void;
  mobileLayout?: boolean;
}

function ItemIcon({ item }: { item: Item }): JSX.Element {
  return (
    <img
      src={`items/${item.type}.svg`}
      alt={item.name}
      className="w-8 h-8 rounded border-2 border-gray-400 object-contain bg-black/30"
      title={`${item.name} - ${item.description}`}
    />
  );
}

function InventorySlotComponent({
  slot,
  onItemUse,
  onItemDrop,
}: {
  slot: InventorySlot;
  onItemUse?: (item: Item) => void;
  onItemDrop?: (item: Item, quantity: number) => void;
}): JSX.Element {
  const [showActions, setShowActions] = useState(false);

  if (!slot.item) {
    return (
      <div
        className="w-12 h-12 border-2 border-gray-600 rounded bg-gray-800 flex items-center justify-center"
        data-testid="inventory-slot-empty"
      >
        <span className="text-gray-500 text-xs">—</span>
      </div>
    );
  }

  return (
    <div
      className="relative w-12 h-12 border-2 border-gray-400 rounded bg-gray-700 p-1 cursor-pointer hover:border-white transition-colors"
      onMouseEnter={(): void => setShowActions(true)}
      onMouseLeave={(): void => setShowActions(false)}
      data-testid={`inventory-slot-${slot.item.id}`}
    >
      <ItemIcon item={slot.item} />

      {slot.quantity > 1 && (
        <span className="absolute -top-1 -right-1 bg-hud-accent text-black text-xs px-1 rounded-full min-w-4 h-4 flex items-center justify-center font-bold">
          {slot.quantity}
        </span>
      )}

      {showActions && (
        <div className="absolute top-full left-0 mt-1 bg-hud-bg/90 border border-hud-accent/30 rounded p-2 min-w-32 z-50 shadow-lg">
          <div className="text-white text-sm mb-2">
            <div className="font-bold">{slot.item.name}</div>
            <div className="text-gray-400 text-xs">{slot.item.description}</div>
            {slot.item.properties.durability && (
              <div className="text-xs mt-1">
                Durability: {slot.item.properties.durability.currentDurability}/
                {slot.item.properties.durability.maxDurability}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            {onItemUse && (
              <Button
                onClick={(): void => onItemUse(slot.item!)}
                data-testid="use-item-button"
                disabled={slot.item.implemented !== true}
                title={slot.item.implemented === true ? "Use" : "Not implemented yet"}
              >
                Use
              </Button>
            )}

            {onItemDrop && (
              <Button
                variant="danger"
                onClick={(): void => onItemDrop(slot.item!, 1)}
                data-testid="drop-item-button"
              >
                Drop
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function InventoryPanel({
  inventory,
  visible = false,
  onToggle,
  onItemUse,
  onItemDrop,
  mobileLayout = false,
}: InventoryPanelProps): JSX.Element | null {
  if (!inventory) {
    return null;
  }

  const slots = inventory.getSlots();
  const totalWeight = inventory.getCurrentWeight();
  const maxWeight = inventory.maxWeight;
  const maxSlots = inventory.maxSlots;

  const columns = 4;
  const rows = Math.ceil(maxSlots / columns);
  const slotGrid: (InventorySlot | null)[] = [];

  for (let i = 0; i < rows * columns; i++) {
    const slot = slots.find((slotEntry) => slotEntry.id === `slot_${i}`);
    slotGrid.push(slot || null);
  }
  const positionClass = mobileLayout
    ? "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(20rem,calc(100vw-2rem))] max-h-[70vh]"
    : "fixed left-4 top-4";
  const visibilityClass = visible
    ? "opacity-100 transform scale-100"
    : "opacity-0 transform scale-95 pointer-events-none";

  return (
    <Panel className={`${positionClass} p-4 transition-all duration-300 ${visibilityClass} z-40`}>
      <header className="flex justify-between items-center mb-3">
        <h3 className="hud-text text-sm">Inventory</h3>

        {onToggle && (
          <Button
            className="px-2 py-0.5 text-sm"
            onClick={onToggle}
            data-testid="inventory-close-button"
          >
            ×
          </Button>
        )}
      </header>

      <div className="mb-3 text-sm">
        <div className="flex justify-between text-gray-300">
          <span>Weight:</span>
          <span className={totalWeight > maxWeight * 0.8 ? "text-hud-warning" : "text-white"}>
            {totalWeight.toFixed(1)} / {maxWeight}
          </span>
        </div>

        <div className="flex justify-between text-gray-300">
          <span>Slots:</span>
          <span className={slots.length > maxSlots * 0.8 ? "text-hud-warning" : "text-white"}>
            {slots.length} / {maxSlots}
          </span>
        </div>
      </div>

      <div
        className="grid gap-2 max-h-64 overflow-y-auto"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        data-testid="inventory-grid"
      >
        {slotGrid.map(
          (slot, index): JSX.Element => (
            <div key={index}>
              {slot ? (
                <InventorySlotComponent slot={slot} onItemUse={onItemUse} onItemDrop={onItemDrop} />
              ) : (
                <div
                  className="w-12 h-12 border-2 border-gray-600 rounded bg-gray-800 flex items-center justify-center"
                  data-testid="inventory-slot-empty"
                >
                  <span className="text-gray-500 text-xs">—</span>
                </div>
              )}
            </div>
          ),
        )}
      </div>

      <div className="mt-3 pt-3 hud-divider">
        <div className="flex gap-2 text-xs items-center">
          <Button
            onClick={(): void => inventory.sortInventory("category")}
            data-testid="sort-items-button"
          >
            Sort
          </Button>

          {mobileLayout ? null : (
            <div className="hud-text text-[11px] opacity-70 flex items-center">
              Press I to toggle
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
