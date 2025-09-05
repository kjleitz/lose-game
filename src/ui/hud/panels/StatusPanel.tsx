import type { JSX } from "react";
import { HealthBar } from "../widgets/HealthBar";
import { ExperienceBar } from "../widgets/ExperienceBar";
import { Panel } from "../../controls";

export function StatusPanel({
  health,
  healthMax = 100,
  experience,
  level = 1,
  xpToNextLevel = 100,
  perkPoints = 0,
  onOpenPerks,
}: {
  health: number;
  healthMax?: number;
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
    <Panel className="px-4 py-3 flex flex-col space-y-3" style={{ minWidth: 160 }}>
      <HealthBar current={health} max={healthMax} />
      <div className="flex items-center justify-between">
        <span className="hud-text text-xs opacity-80">Lv {level}</span>
        {perkPoints > 0 ? (
          <button
            type="button"
            className="ml-2 text-[10px] px-1.5 py-0.5 rounded border border-hud-accent/40 text-hud-accent bg-hud-bg/70 hover:bg-hud-bg/90"
            onClick={onOpenPerks}
          >
            {perkPoints} perk
          </button>
        ) : (
          <button
            type="button"
            className="ml-2 text-[10px] px-1.5 py-0.5 hud-btn"
            onClick={onOpenPerks}
          >
            Perks
          </button>
        )}
      </div>
      <ExperienceBar value={pct} />
    </Panel>
  );
}
