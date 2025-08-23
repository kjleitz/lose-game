import Radar from "./Radar";
import Notification from "./Notification";
import type { Planet } from "../../domain/game/planets";

interface HudProps {
  player: { x: number; y: number };
  planets: Planet[];
  screenW: number;
  screenH: number;
  notification?: string | null;
}

export default function Hud({ player, planets, screenW, screenH, notification }: HudProps) {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Radar in bottom-right */}
      <Radar player={player} planets={planets} screenW={screenW} screenH={screenH} />
      {/* Notification at top-center */}
      <Notification message={notification} />
      {/* Add more HUD elements here, e.g. health, score, etc. */}
    </div>
  );
}
