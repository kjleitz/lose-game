import type { JSX } from "react";

import type { PlayerInventory } from "../../domain/game/inventory/PlayerInventory";
import type { Item } from "../../domain/game/items/Item";
import type { Planet } from "../../domain/game/planets";
import type { Action } from "../../application/input/ActionTypes";
import type { Point2D } from "../../shared/types/geometry";
import { InventoryPanel } from "./panels/InventoryPanel";
import { Notification } from "./widgets/Notification";
import { Radar } from "./widgets/Radar";
import { ControlsPanel } from "./panels/ControlsPanel";
import { StatusPanel } from "./panels/StatusPanel";

interface HudProps {
  player: Point2D;
  experience?: number;
  level?: number;
  xpToNextLevel?: number;
  perkPoints?: number;
  health?: number;
  planets: Planet[];
  screenW: number;
  screenH: number;
  notification?: string | null;
  actions: Set<Action>;
  paused: boolean;
  speedMultiplier?: number;
  inventory?: PlayerInventory;
  inventoryVisible?: boolean;
  onChangeSpeed?: (n: number) => void;
  onOpenSettings?: () => void;
  onToggleInventory?: () => void;
  onOpenPerks?: () => void;
  onItemUse?: (item: Item) => void;
  onItemDrop?: (item: Item, quantity: number) => void;
}

export function Hud({
  player,
  experience = 0,
  level = 1,
  xpToNextLevel = 100,
  perkPoints = 0,
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
  onOpenPerks,
  onItemUse,
  onItemDrop,
}: HudProps): JSX.Element {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      <Radar player={player} planets={planets} screenW={screenW} screenH={screenH} />
      <Notification message={notification} />
      <div className="absolute left-4 bottom-4 pointer-events-auto z-20" style={{ minWidth: 180 }}>
        <StatusPanel
          health={health}
          experience={experience}
          level={level}
          xpToNextLevel={xpToNextLevel}
          perkPoints={perkPoints}
          onOpenPerks={onOpenPerks}
        />
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
