import Radar from "./components/Radar";
import Notification from "./components/Notification";
import InventoryPanel from "./components/InventoryPanel";
import type { Planet } from "../../domain/game/planets";
import type { PlayerInventory } from "../../domain/game/inventory/PlayerInventory";
import type { Item } from "../../domain/game/items/Item";
import { StatusPanel } from "./panels/StatusPanel";
import { ControlsPanel } from "./panels/ControlsPanel";

interface HudProps {
  player: { x: number; y: number };
  experience?: number;
  health?: number;
  planets: Planet[];
  screenW: number;
  screenH: number;
  notification?: string | null;
  actions: Set<string>;
  paused: boolean;
  speedMultiplier?: number;
  inventory?: PlayerInventory;
  inventoryVisible?: boolean;
  onChangeSpeed?: (n: number) => void;
  onOpenSettings?: () => void;
  onToggleInventory?: () => void;
  onItemUse?: (item: Item) => void;
  onItemDrop?: (item: Item, quantity: number) => void;
}

export default function Hud({
  player,
  experience = 0,
  health = 100,
  planets,
  screenW,
  screenH,
  notification,
  actions,
  paused,
  speedMultiplier,
  inventory,
  inventoryVisible = false,
  onChangeSpeed,
  onOpenSettings,
  onToggleInventory,
  onItemUse,
  onItemDrop,
}: HudProps) {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      <Radar player={player} planets={planets} screenW={screenW} screenH={screenH} />
      <Notification message={notification} />
      <div className="absolute left-4 bottom-4 pointer-events-auto z-20" style={{ minWidth: 180 }}>
        <StatusPanel health={health} experience={experience} />
      </div>
      <div className="absolute right-4 top-4 z-20">
        <ControlsPanel
          actions={actions}
          paused={paused}
          speedMultiplier={speedMultiplier}
          onChangeSpeed={onChangeSpeed}
          onOpenSettings={onOpenSettings}
        />
      </div>
      <div className="pointer-events-auto">
        <InventoryPanel
          inventory={inventory}
          visible={inventoryVisible}
          onToggle={onToggleInventory}
          onItemUse={onItemUse}
          onItemDrop={onItemDrop}
        />
      </div>
    </div>
  );
}
