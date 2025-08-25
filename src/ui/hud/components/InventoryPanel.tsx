import { useState } from "react";
import type { PlayerInventory, InventorySlot, SortMode } from "../../../domain/game/inventory/PlayerInventory";
import type { Item } from "../../../domain/game/items/Item";

interface InventoryPanelProps {
  inventory?: PlayerInventory;
  visible?: boolean;
  onToggle?: () => void;
  onItemUse?: (item: Item) => void;
  onItemDrop?: (item: Item, quantity: number) => void;
}

function ItemIcon({ item }: { item: Item }) {
  // Simple colored squares based on item type for now
  const getItemColor = (item: Item) => {
    switch (item.baseType) {
      case "tool": return "#4ECDC4";
      case "consumable": return "#FFD93D";
      case "material": return "#A8A8A8";
      case "valuable": return "#FFD700";
      default: return "#666";
    }
  };

  return (
    <div 
      className="w-8 h-8 rounded border-2 border-gray-400 flex items-center justify-center text-xs font-bold"
      style={{ backgroundColor: getItemColor(item) }}
      title={`${item.name} - ${item.description}`}
    >
      {item.name.charAt(0).toUpperCase()}
    </div>
  );
}

function InventorySlotComponent({ slot, onItemUse, onItemDrop }: {
  slot: InventorySlot;
  onItemUse?: (item: Item) => void;
  onItemDrop?: (item: Item, quantity: number) => void;
}) {
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
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      data-testid={`inventory-slot-${slot.item.id}`}
    >
      <ItemIcon item={slot.item} />
      
      {slot.quantity > 1 && (
        <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs px-1 rounded-full min-w-4 h-4 flex items-center justify-center font-bold">
          {slot.quantity}
        </span>
      )}

      {showActions && (
        <div className="absolute top-full left-0 mt-1 bg-gray-900 border border-gray-600 rounded p-2 min-w-32 z-50 shadow-lg">
          <div className="text-white text-sm mb-2">
            <div className="font-bold">{slot.item.name}</div>
            <div className="text-gray-400 text-xs">{slot.item.description}</div>
            {slot.item.properties.durability && (
              <div className="text-xs mt-1">
                Durability: {slot.item.properties.durability.currentDurability}/{slot.item.properties.durability.maxDurability}
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-1">
            {onItemUse && (
              <button 
                className="bg-green-600 hover:bg-green-500 px-2 py-1 rounded text-xs text-white transition-colors"
                onClick={() => onItemUse(slot.item!)}
                data-testid="use-item-button"
              >
                Use
              </button>
            )}
            
            {onItemDrop && (
              <button 
                className="bg-red-600 hover:bg-red-500 px-2 py-1 rounded text-xs text-white transition-colors"
                onClick={() => onItemDrop(slot.item!, 1)}
                data-testid="drop-item-button"
              >
                Drop
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function InventoryPanel({
  inventory,
  visible = false,
  onToggle,
  onItemUse,
  onItemDrop,
}: InventoryPanelProps) {
  if (!inventory) {
    return null;
  }

  const slots = inventory.slots;
  const totalWeight = inventory.currentWeight;
  const maxWeight = inventory.maxWeight;
  const maxSlots = inventory.maxSlots;

  // Organize slots into a grid (4 columns)
  const columns = 4;
  const rows = Math.ceil(maxSlots / columns);
  const slotGrid: (InventorySlot | null)[] = [];
  
  // Fill grid with slots or null for empty positions
  for (let i = 0; i < rows * columns; i++) {
    const slot = slots.find(s => s.id === `slot_${i}`);
    slotGrid.push(slot || null);
  }

  return (
    <div className={`fixed right-4 bottom-20 bg-gray-900 border-2 border-gray-600 rounded-lg p-4 shadow-xl transition-all duration-300 ${visible ? 'opacity-100 transform scale-100' : 'opacity-0 transform scale-95 pointer-events-none'}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white font-bold text-lg">Inventory</h3>
        
        {onToggle && (
          <button 
            className="text-gray-400 hover:text-white text-xl"
            onClick={onToggle}
            data-testid="inventory-close-button"
          >
            ×
          </button>
        )}
      </div>

      {/* Inventory Stats */}
      <div className="mb-3 text-sm">
        <div className="flex justify-between text-gray-300">
          <span>Weight:</span>
          <span className={totalWeight > maxWeight * 0.8 ? 'text-yellow-400' : 'text-white'}>
            {totalWeight.toFixed(1)} / {maxWeight}
          </span>
        </div>
        
        <div className="flex justify-between text-gray-300">
          <span>Slots:</span>
          <span className={slots.length > maxSlots * 0.8 ? 'text-yellow-400' : 'text-white'}>
            {slots.length} / {maxSlots}
          </span>
        </div>
      </div>

      {/* Inventory Grid */}
      <div 
        className="grid gap-2 max-h-64 overflow-y-auto"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        data-testid="inventory-grid"
      >
        {slotGrid.map((slot, index) => (
          <div key={index}>
            {slot ? (
              <InventorySlotComponent 
                slot={slot} 
                onItemUse={onItemUse} 
                onItemDrop={onItemDrop} 
              />
            ) : (
              <div 
                className="w-12 h-12 border-2 border-gray-600 rounded bg-gray-800 flex items-center justify-center"
                data-testid="inventory-slot-empty"
              >
                <span className="text-gray-500 text-xs">—</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-3 pt-3 border-t border-gray-600">
        <div className="flex gap-2 text-xs">
          <button 
            className="bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded text-white transition-colors"
            onClick={() => (inventory as any).sortInventory('category')}
            data-testid="sort-items-button"
          >
            Sort
          </button>
          
          <div className="text-gray-400 flex items-center">
            Press I to toggle
          </div>
        </div>
      </div>
    </div>
  );
}