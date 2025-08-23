import Hud from "./Hud";
import SpeedControl from "./SpeedControl";
import type { Planet } from "../../domain/game/planets";

export function HudPanel({
  player,
  score = 0,
  health = 100,
  planets,
  screenW,
  screenH,
  notification,
  actions,
  paused,
  speedMultiplier,
  onChangeSpeed,
  onOpenSettings,
}: {
  player: { x: number; y: number };
  score?: number;
  health?: number;
  planets: Planet[];
  screenW: number;
  screenH: number;
  notification: string | null;
  actions: Set<string>;
  paused: boolean;
  speedMultiplier?: number;
  onChangeSpeed?: (n: number) => void;
  onOpenSettings?: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 p-4 flex items-start justify-between">
      <Hud
        player={player}
        score={score}
        health={health}
        planets={planets}
        screenW={screenW}
        screenH={screenH}
        notification={notification}
      />
      <div className="hud-panel px-3 py-2 space-y-2 pointer-events-auto">
        <div className="flex items-center justify-end">
          <button
            type="button"
            className="px-2 py-1 text-xs bg-gray-800 text-white rounded border border-gray-600 hover:bg-gray-700"
            onClick={onOpenSettings}
          >
            Settings
          </button>
        </div>
        {typeof speedMultiplier === "number" && onChangeSpeed && (
          <SpeedControl value={speedMultiplier} onChange={onChangeSpeed} />
        )}
        <div className="hud-text text-xs opacity-80">
          {Array.from(actions).join(", ") || "idle"}
        </div>
        {paused && <div className="hud-text text-xs">paused</div>}
      </div>
    </div>
  );
}
