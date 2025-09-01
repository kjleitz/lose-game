import type { JSX } from "react";
import { HealthBar } from "../widgets/HealthBar";
import { ExperienceBar } from "../widgets/ExperienceBar";

export function StatusPanel({
  health,
  experience,
  level = 1,
  xpToNextLevel = 100,
  perkPoints = 0,
  onOpenPerks,
}: {
  health: number;
  experience: number;
  level?: number;
  xpToNextLevel?: number;
  perkPoints?: number;
  onOpenPerks?: () => void;
}): JSX.Element {
  const pct =
    xpToNextLevel > 0
      ? Math.min(100, Math.max(0, Math.floor((experience / xpToNextLevel) * 100)))
      : 0;
  return (
    <div
      className="hud-panel px-4 py-3 rounded border border-gray-600 bg-black bg-opacity-80 shadow flex flex-col space-y-3"
      style={{ minWidth: 160 }}
    >
      <HealthBar value={health} />
      <div className="flex items-center justify-between">
        <span className="text-xs text-white">Lv {level}</span>
        {perkPoints > 0 ? (
          <button
            type="button"
            className="ml-2 text-[10px] px-1.5 py-0.5 bg-yellow-600 text-black rounded"
            onClick={onOpenPerks}
          >
            {perkPoints} perk
          </button>
        ) : (
          <button
            type="button"
            className="ml-2 text-[10px] px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded"
            onClick={onOpenPerks}
          >
            Perks
          </button>
        )}
      </div>
      <ExperienceBar value={pct} />
    </div>
  );
}
