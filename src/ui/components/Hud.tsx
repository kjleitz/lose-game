import Radar from "./Radar";
import Notification from "./Notification";
import type { Planet } from "../../domain/game/planets";

interface HudProps {
  player: { x: number; y: number };
  score?: number;
  health?: number;
  planets: Planet[];
  screenW: number;
  screenH: number;
  notification?: string | null;
}

export default function Hud({
  player,
  score = 0,
  health = 100,
  planets,
  screenW,
  screenH,
  notification,
}: HudProps) {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Radar in bottom-right */}
      <Radar player={player} planets={planets} screenW={screenW} screenH={screenH} />
      {/* Notification at top-center */}
      <Notification message={notification} />
      {/* HUD Health and Experience Bars - bottom left, styled HUD panel */}
      <div className="absolute left-4 bottom-4 pointer-events-auto z-20" style={{ minWidth: 180 }}>
        <div
          className="hud-panel px-4 py-3 rounded border border-gray-600 bg-black bg-opacity-80 shadow flex flex-col space-y-3"
          style={{ minWidth: 160 }}
        >
          {/* Health Bar (top) */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-white">HP</span>
            <div
              data-testid="hud-health-panel"
              className="relative flex-1 h-4 bg-gray-900 rounded"
              style={{ minWidth: 100 }}
            >
              <div
                className="absolute left-0 top-0 h-4 rounded"
                style={{
                  width: `${Math.min(100, health)}%`,
                  background: "#e74c3c",
                  transition: "width 0.3s",
                }}
              />
              <span
                className="absolute left-2 top-0 text-xs text-white"
                style={{ lineHeight: "1rem" }}
              >
                {health}
              </span>
            </div>
          </div>
          {/* Experience Bar (bottom) */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-white">XP</span>
            <div
              data-testid="hud-experience-panel"
              className="relative flex-1 h-4 bg-gray-900 rounded"
              style={{ minWidth: 100 }}
            >
              <div
                className="absolute left-0 top-0 h-4 rounded"
                style={{
                  width: `${Math.min(100, score)}%`,
                  background: "#3498db",
                  transition: "width 0.3s",
                }}
              />
              <span
                className="absolute left-2 top-0 text-xs text-white"
                style={{ lineHeight: "1rem" }}
              >
                {score}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
