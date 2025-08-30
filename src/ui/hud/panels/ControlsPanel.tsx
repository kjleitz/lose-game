import type { JSX } from "react";

import type { Action } from "../../../application/input/ActionTypes";
import { SpeedControl } from "../../components/SpeedControl";
import { ActionReadout } from "../components/ActionReadout";
import { PauseIndicator } from "../components/PauseIndicator";
import { SettingsButton } from "../components/SettingsButton";

interface ControlsPanelProps {
  actions: Set<Action>;
  paused: boolean;
  speedMultiplier?: number;
  onChangeSpeed?: (n: number) => void;
  onOpenSettings?: () => void;
}

export function ControlsPanel({
  actions,
  paused,
  speedMultiplier,
  onChangeSpeed,
  onOpenSettings,
}: ControlsPanelProps): JSX.Element {
  return (
    <div className="hud-panel px-3 py-2 space-y-2 pointer-events-auto" data-testid="hud-root">
      <div className="flex items-center justify-end">
        <SettingsButton onClick={onOpenSettings} />
      </div>
      {typeof speedMultiplier === "number" && onChangeSpeed && (
        <SpeedControl value={speedMultiplier} onChange={onChangeSpeed} />
      )}
      <ActionReadout actions={actions} />
      <PauseIndicator paused={paused} />
    </div>
  );
}
