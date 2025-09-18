import type { JSX } from "react";

import type { Action } from "../../application/input/ActionTypes";
import type { PlayerInventory } from "../../domain/game/inventory/PlayerInventory";
import type { Item } from "../../domain/game/items/Item";
import type { Planet } from "../../domain/game/planets";
import type { Point2D } from "../../shared/types/geometry";
import { ControlsPanel } from "./panels/ControlsPanel";
import { InventoryPanel } from "./panels/InventoryPanel";
import { StatusPanel } from "./panels/StatusPanel";
import { Notification } from "./widgets/Notification";
import { Radar } from "./widgets/Radar";
import { Button } from "../controls";
import type { AmmoType } from "../../shared/types/combat";

interface HudProps {
  mode?: "space" | "planet" | "ship";
  planet?: { inShip: boolean; ship: { x: number; y: number; angle: number } | null };
  player: Point2D;
  playerAngle?: number;
  experience?: number;
  level?: number;
  xpToNextLevel?: number;
  perkPoints?: number;
  health?: number;
  healthMax?: number;
  planets: Planet[];
  stars?: Array<{ id: string; x: number; y: number; radius: number; color: string }>;
  enemies?: Array<{ id: string; x: number; y: number; radius: number }>;
  screenW: number;
  screenH: number;
  notification?: string | null;
  actions: Set<Action>;
  paused: boolean;
  speedMultiplier?: number;
  playerSpeed?: number;
  inventory?: PlayerInventory;
  inventoryVisible?: boolean;
  mobileLayout?: boolean;
  onChangeSpeed?: (n: number) => void;
  onOpenSettings?: () => void;
  onToggleInventory?: () => void;
  onOpenPerks?: () => void;
  onItemUse?: (item: Item) => void;
  onItemDrop?: (item: Item, quantity: number) => void;
  onGrantPerkPoints?: (amount: number) => void;
  selectedAmmo?: AmmoType;
  ammoOptions?: ReadonlyArray<AmmoType>;
  onSelectAmmo?: (type: AmmoType) => void;
}

export function Hud({
  mode = "space",
  planet,
  player,
  playerAngle,
  experience = 0,
  level = 1,
  xpToNextLevel = 100,
  perkPoints = 0,
  health = 100,
  healthMax = 100,
  planets,
  stars = [],
  enemies = [],
  screenW,
  screenH,
  notification,
  actions,
  paused,
  speedMultiplier,
  playerSpeed,
  inventory,
  inventoryVisible = false,
  mobileLayout = false,
  onChangeSpeed,
  onOpenSettings,
  onToggleInventory,
  onOpenPerks,
  onItemUse,
  onItemDrop,
  onGrantPerkPoints,
  selectedAmmo,
  ammoOptions,
  onSelectAmmo,
}: HudProps): JSX.Element {
  const statusAnchorClass = mobileLayout ? "left-4 top-4" : "left-4 bottom-4";

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {mobileLayout ? null : (
        <Radar
          mode={mode}
          planet={planet}
          player={player}
          playerAngle={playerAngle}
          planets={planets}
          stars={stars}
          enemies={enemies}
          screenW={screenW}
          screenH={screenH}
        />
      )}
      {mobileLayout ? null : <Notification message={notification} />}
      <div
        className={`absolute ${statusAnchorClass} pointer-events-auto z-20`}
        style={{ minWidth: 180 }}
      >
        <StatusPanel
          health={health}
          healthMax={healthMax}
          experience={experience}
          level={level}
          xpToNextLevel={xpToNextLevel}
          perkPoints={perkPoints}
          onOpenPerks={onOpenPerks}
        />
        {mobileLayout ? (
          <div className="mt-2 space-y-2 text-right">
            <Notification message={notification} mobileLayout />
            {onToggleInventory ? (
              <Button size="xs" onClick={onToggleInventory}>
                {inventoryVisible ? "Hide Inv" : "Inventory"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
      {mobileLayout ? (
        <div className="absolute right-4 top-4 z-20 flex flex-col items-end gap-2 pointer-events-none">
          <div className="pointer-events-auto">
            <Radar
              mode={mode}
              planet={planet}
              player={player}
              playerAngle={playerAngle}
              planets={planets}
              stars={stars}
              enemies={enemies}
              screenW={screenW}
              screenH={screenH}
              mobileLayout
            />
          </div>
          <div className="pointer-events-auto">
            <ControlsPanel
              actions={actions}
              paused={paused}
              playerSpeed={playerSpeed}
              onOpenSettings={onOpenSettings}
              mobileLayout
            />
          </div>
        </div>
      ) : (
        <div className="absolute right-4 top-4 z-20">
          <ControlsPanel
            actions={actions}
            paused={paused}
            speedMultiplier={speedMultiplier}
            playerSpeed={playerSpeed}
            onChangeSpeed={onChangeSpeed}
            onOpenSettings={onOpenSettings}
            onGrantPerkPoints={onGrantPerkPoints}
            onToggleInventory={onToggleInventory}
            inventoryVisible={inventoryVisible}
            showInventoryToggle={false}
            selectedAmmo={selectedAmmo}
            ammoOptions={ammoOptions}
            onSelectAmmo={onSelectAmmo}
          />
        </div>
      )}
      {/* Speedometer moved into ControlsPanel (top-right) */}
      <div className="pointer-events-auto">
        <InventoryPanel
          inventory={inventory}
          visible={inventoryVisible}
          onToggle={mobileLayout ? onToggleInventory : undefined}
          onItemUse={onItemUse}
          onItemDrop={onItemDrop}
          mobileLayout={mobileLayout}
        />
      </div>
    </div>
  );
}
