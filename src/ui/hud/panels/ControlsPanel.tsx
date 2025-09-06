import type { JSX } from "react";

import type { Action } from "../../../application/input/ActionTypes";
import { SpeedControl } from "../../controls/composites/SpeedControl";
import { Panel, Button } from "../../controls";
import { ActionReadout } from "../widgets/ActionReadout";
import { PauseIndicator } from "../widgets/PauseIndicator";
import { SettingsButton } from "../widgets/SettingsButton";
import { SpeedometerGauge } from "../widgets/SpeedometerGauge";
import { AmmoSelector } from "../widgets/AmmoSelector";
import type { AmmoType } from "../../../shared/types/combat";

interface ControlsPanelProps {
  actions: Set<Action>;
  paused: boolean;
  speedMultiplier?: number;
  playerSpeed?: number;
  onChangeSpeed?: (n: number) => void;
  onOpenSettings?: () => void;
  onGrantPerkPoints?: (amount: number) => void;
  selectedAmmo?: AmmoType;
  ammoOptions?: ReadonlyArray<AmmoType>;
  onSelectAmmo?: (type: AmmoType) => void;
}

export function ControlsPanel({
  actions,
  paused,
  speedMultiplier,
  playerSpeed,
  onChangeSpeed,
  onOpenSettings,
  onGrantPerkPoints,
  selectedAmmo,
  ammoOptions,
  onSelectAmmo,
}: ControlsPanelProps): JSX.Element {
  return (
    <Panel className="px-3 py-2 space-y-2 pointer-events-auto" data-testid="hud-root">
      <div className="flex items-center justify-end">
        <SettingsButton onClick={onOpenSettings} />
      </div>
      {typeof speedMultiplier === "number" && onChangeSpeed ? (
        <div className="flex items-center justify-between gap-2">
          <SpeedControl value={speedMultiplier} onChange={onChangeSpeed} />
          {onGrantPerkPoints ? (
            <Button
              size="xs"
              title="Grant 999 Perk Points"
              onClick={(): void => onGrantPerkPoints(999)}
            >
              +999 PP
            </Button>
          ) : null}
        </div>
      ) : null}
      {typeof playerSpeed === "number" ? (
        <div className="pt-1">
          <SpeedometerGauge speed={playerSpeed} />
        </div>
      ) : null}
      {selectedAmmo && ammoOptions && onSelectAmmo ? (
        <AmmoSelector current={selectedAmmo} options={ammoOptions} onSelect={onSelectAmmo} />
      ) : null}
      <ActionReadout actions={actions} />
      <PauseIndicator paused={paused} />
    </Panel>
  );
}
