import type { JSX } from "react";
import { HealthBar } from "../widgets/HealthBar";
import { ExperienceBar } from "../widgets/ExperienceBar";

export function StatusPanel({
  health,
  experience,
}: {
  health: number;
  experience: number;
}): JSX.Element {
  return (
    <div
      className="hud-panel px-4 py-3 rounded border border-gray-600 bg-black bg-opacity-80 shadow flex flex-col space-y-3"
      style={{ minWidth: 160 }}
    >
      <HealthBar value={health} />
      <ExperienceBar value={experience} />
    </div>
  );
}
