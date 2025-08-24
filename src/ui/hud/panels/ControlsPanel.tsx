import SpeedControl from "../../components/SpeedControl";
import { SettingsButton } from "../components/SettingsButton";
import { ActionReadout } from "../components/ActionReadout";
import { PauseIndicator } from "../components/PauseIndicator";

interface ControlsPanelProps {
  actions: Set<string>;
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
}: ControlsPanelProps) {
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
