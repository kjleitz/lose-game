import Hud from "./Hud";
import type { Planet } from "../../domain/game/planets";

export function HudPanel({
  player,
  planets,
  screenW,
  screenH,
  notification,
  actions,
  paused,
}: {
  player: { x: number; y: number };
  planets: Planet[];
  screenW: number;
  screenH: number;
  notification: string | null;
  actions: Set<string>;
  paused: boolean;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 p-4 flex items-start justify-between">
      <Hud
        player={player}
        planets={planets}
        screenW={screenW}
        screenH={screenH}
        notification={notification}
      />
      <div className="hud-panel px-3 py-2 space-y-1 pointer-events-auto">
        <div className="hud-text text-xs opacity-80">
          {Array.from(actions).join(", ") || "idle"}
        </div>
        {paused && <div className="hud-text text-xs">paused</div>}
      </div>
    </div>
  );
}
