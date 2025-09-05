import type { JSX } from "react";

import type { Action } from "../../../application/input/ActionTypes";
import { SpeedControl } from "../../controls/composites/SpeedControl";
import { Panel } from "../../controls";
import { ActionReadout } from "../widgets/ActionReadout";
import { PauseIndicator } from "../widgets/PauseIndicator";
import { SettingsButton } from "../widgets/SettingsButton";
import { SpeedometerGauge } from "../widgets/SpeedometerGauge";

interface ControlsPanelProps {
  actions: Set<Action>;
  paused: boolean;
  speedMultiplier?: number;
  playerSpeed?: number;
  onChangeSpeed?: (n: number) => void;
  onOpenSettings?: () => void;
}

export function ControlsPanel({
  actions,
  paused,
  speedMultiplier,
  playerSpeed,
  onChangeSpeed,
  onOpenSettings,
}: ControlsPanelProps): JSX.Element {
  return (
    <Panel className="px-3 py-2 space-y-2 pointer-events-auto" data-testid="hud-root">
      <div className="flex items-center justify-end">
        <SettingsButton onClick={onOpenSettings} />
      </div>
      {typeof speedMultiplier === "number" && onChangeSpeed && (
        <SpeedControl value={speedMultiplier} onChange={onChangeSpeed} />
      )}
      {typeof playerSpeed === "number" ? (
        <div className="pt-1">
          <SpeedometerGauge speed={playerSpeed} />
        </div>
      ) : null}
      <ActionReadout actions={actions} />
      <PauseIndicator paused={paused} />
    </Panel>
  );
}
