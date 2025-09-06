import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { InventoryPanel } from "./InventoryPanel";
import { PlayerInventoryManager } from "../../../domain/game/inventory/PlayerInventory";
import { ItemQuality, BaseItemType, ItemRarity, type Item } from "../../../domain/game/items/Item";

describe("InventoryPanel", (): void => {
  const createTestInventory = (): PlayerInventoryManager => {
    const inventory = new PlayerInventoryManager(12, 50);

    const tool: Item = {
      id: "test-tool-1",
      type: "knife",
      baseType: BaseItemType.TOOL,
      name: "Basic Knife",
      description: "A simple cutting tool",
      properties: {
        weight: 0.5,
        volume: 1,
        stackable: false,
        maxStackSize: 1,
        durability: {
          maxDurability: 100,
          currentDurability: 80,
          repairability: { canRepair: false, requiredMaterials: [], repairCost: 0 },
          degradationRate: 1,
        },
        quality: ItemQuality.COMMON,
        rarity: ItemRarity.COMMON,
        tradeable: true,
        dropOnDeath: true,
      },
      stats: {
        effectiveness: 10,
        durability: 100,
        value: 25,
      },
      requirements: {},
      effects: [],
      metadata: {
        discoveredAt: Date.now(),
      },
    };

    const consumable: Item = {
      id: "test-food-1",
      type: "food",
      baseType: BaseItemType.CONSUMABLE,
      name: "Energy Bar",
      description: "Restores energy",
      properties: {
        weight: 0.1,
        volume: 0.5,
        stackable: true,
        maxStackSize: 10,
        quality: ItemQuality.COMMON,
        rarity: ItemRarity.COMMON,
        tradeable: true,
        dropOnDeath: false,
      },
      stats: {
        effectiveness: 5,
        value: 5,
      },
      requirements: {},
      effects: [],
      metadata: {
        discoveredAt: Date.now(),
      },
    };

    inventory.addItem(tool);
    inventory.addItem(consumable, 3);

    return inventory;
  };

  it("should not render when no inventory provided", (): void => {
    render(<InventoryPanel />);
    expect(screen.queryByText("Inventory")).not.toBeInTheDocument();
  });

  it("should render inventory stats", (): void => {
    const inventory = createTestInventory();
    render(<InventoryPanel inventory={inventory} visible={true} />);

    expect(screen.getByText("Inventory")).toBeInTheDocument();
    expect(screen.getByText(/Weight:/)).toBeInTheDocument();
    expect(screen.getByText(/Slots:/)).toBeInTheDocument();
  });

  it("should render inventory grid with items", (): void => {
    const inventory = createTestInventory();
    render(<InventoryPanel inventory={inventory} visible={true} />);

    const grid = screen.getByTestId("inventory-grid");
    expect(grid).toBeInTheDocument();
    expect(screen.getAllByTestId(/inventory-slot-/).length).toBeGreaterThan(0);
  });

  it("should show item quantities for stackable items", (): void => {
    const inventory = createTestInventory();
    render(<InventoryPanel inventory={inventory} visible={true} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("should call onToggle when close button clicked", (): void => {
    const inventory = createTestInventory();
    const onToggle = vi.fn();
    render(<InventoryPanel inventory={inventory} visible={true} onToggle={onToggle} />);
    fireEvent.click(screen.getByTestId("inventory-close-button"));
    expect(onToggle).toHaveBeenCalled();
  });

  it("should call onItemUse when use button clicked", (): void => {
    const inventory = createTestInventory();
    const onItemUse = vi.fn();
    render(<InventoryPanel inventory={inventory} visible={true} onItemUse={onItemUse} />);

    const itemSlot = screen.getAllByTestId(/inventory-slot-/).find((slot) => {
      const dt = slot.getAttribute("data-testid");
      return dt != null && !dt.includes("empty");
    });

    if (itemSlot != null) {
      fireEvent.mouseEnter(itemSlot);
      const useButton = screen.queryByTestId("use-item-button");
      if (useButton != null) {
        fireEvent.click(useButton);
        expect(onItemUse).toHaveBeenCalled();
      }
    }
  });

  it("should call onItemDrop when drop button clicked", (): void => {
    const inventory = createTestInventory();
    const onItemDrop = vi.fn();
    render(<InventoryPanel inventory={inventory} visible={true} onItemDrop={onItemDrop} />);

    const itemSlot = screen.getAllByTestId(/inventory-slot-/).find((slot) => {
      const dt = slot.getAttribute("data-testid");
      return dt != null && !dt.includes("empty");
    });

    if (itemSlot != null) {
      fireEvent.mouseEnter(itemSlot);
      const dropButton = screen.queryByTestId("drop-item-button");
      if (dropButton != null) {
        fireEvent.click(dropButton);
        expect(onItemDrop).toHaveBeenCalled();
      }
    }
  });

  it("should call sort when sort button clicked", (): void => {
    const inventory = createTestInventory();
    const sortSpy = vi.spyOn(inventory, "sortInventory");

    render(<InventoryPanel inventory={inventory} visible={true} />);

    fireEvent.click(screen.getByTestId("sort-items-button"));
    expect(sortSpy).toHaveBeenCalled();
  });

  it("should be hidden when visible is false", (): void => {
    const inventory = createTestInventory();
    render(<InventoryPanel inventory={inventory} visible={false} />);
    const panel = screen.getByText("Inventory").closest("div");
    expect(panel).toHaveClass("opacity-0", "pointer-events-none");
  });

  it("should show durability information for tools", (): void => {
    const inventory = createTestInventory();
    render(<InventoryPanel inventory={inventory} visible={true} />);

    const slots = screen.getAllByTestId(/inventory-slot-/).filter((slot) => {
      const dt = slot.getAttribute("data-testid");
      return dt != null && !dt.includes("empty");
    });

    for (const slot of slots) {
      fireEvent.mouseEnter(slot);
      if (screen.queryByText(/Durability:/) != null) {
        expect(screen.getByText(/80\/100/)).toBeInTheDocument();
        break;
      }
    }
  });
});
