import type { JSX } from "react";
import { useMemo } from "react";
import type { PerkDefinition, PerkId } from "../../../domain/leveling/types";
import { perkDefinitions } from "../../../domain/leveling/perksConfig";

interface PerkModalProps {
  open: boolean;
  onClose: () => void;
  level: number;
  perkPoints: number;
  unlocked: Record<string, number>;
  onUnlock: (perkId: PerkId) => void;
}

export function PerkModal({
  open,
  onClose,
  level,
  perkPoints,
  unlocked,
  onUnlock,
}: PerkModalProps): JSX.Element | null {
  const groups = useMemo(() => {
    const byCategory = new Map<string, PerkDefinition[]>();
    for (const defn of perkDefinitions) {
      const list = byCategory.get(defn.category) ?? [];
      list.push(defn);
      byCategory.set(defn.category, list);
    }
    return Array.from(byCategory.entries()).map(([category, defs]) => ({ category, defs }));
  }, []);

  const nameById = useMemo(() => {
    const nameMap = new Map<PerkId, string>();
    for (const defn of perkDefinitions) nameMap.set(defn.id, defn.name);
    return nameMap;
  }, []);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-30 pointer-events-auto flex items-center justify-center bg-black bg-opacity-50">
      <div
        className="bg-gray-900 border border-gray-700 rounded p-3 w-[640px] max-w-[90vw] max-h-[80vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-white text-base">Perks</h2>
          <button className="text-white text-xs px-2 py-1 bg-gray-700 rounded" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="text-xs text-gray-300 mb-2">
          Level {level} · Perk Points: {perkPoints}
        </div>
        <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1 flex-1">
          {groups.map((group) => (
            <div key={group.category} className="border border-gray-700 rounded p-2">
              <div className="text-white text-xs font-semibold mb-1 capitalize">
                {group.category}
              </div>
              <ul className="space-y-1">
                {group.defs.map((def) => {
                  const currentTier = unlocked[def.id] ?? 0;
                  const nextTier = def.tiers[currentTier];
                  const locked = currentTier === 0;
                  const canUnlock = Boolean(
                    nextTier &&
                      (nextTier.requiresLevel ? level >= nextTier.requiresLevel : true) &&
                      perkPoints >= (nextTier?.cost ?? Infinity),
                  );
                  return (
                    <li key={def.id} className="flex items-start justify-between">
                      <div>
                        <div className="text-white text-sm leading-tight">{def.name}</div>
                        <div className="text-gray-400 text-[11px] leading-tight">
                          {def.description}
                        </div>
                        <div className="text-gray-500 text-[10px] leading-tight">
                          Tier: {currentTier}/{def.tiers.length}
                        </div>
                        {nextTier ? (
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            <div>
                              Cost {nextTier.cost}
                              {nextTier.requiresLevel ? ` · Lv ${nextTier.requiresLevel}` : ""}
                            </div>
                            {nextTier.requires && nextTier.requires.length > 0 ? (
                              <div>
                                Requires:{" "}
                                {nextTier.requires
                                  .map((rid) => nameById.get(rid) ?? rid)
                                  .join(", ")}
                              </div>
                            ) : null}
                            {nextTier.excludes && nextTier.excludes.length > 0 ? (
                              <div>
                                Conflicts:{" "}
                                {nextTier.excludes
                                  .map((eid) => nameById.get(eid) ?? eid)
                                  .join(", ")}
                              </div>
                            ) : null}
                            {nextTier.effects && nextTier.effects.length > 0 ? (
                              <div className="mt-0.5">
                                Effects:
                                <ul className="list-disc ml-4">
                                  {nextTier.effects.map((eff, idx) => (
                                    <li key={idx} className="text-gray-400 leading-tight">
                                      {eff.kind}: {eff.target} {eff.value >= 0 ? "+" : ""}
                                      {eff.value}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <div className="text-[10px] text-gray-500 mt-1">Maxed</div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {locked ? (
                          <span className="text-[10px] text-gray-400">
                            Cost {nextTier?.cost ?? 0}
                          </span>
                        ) : null}
                        <button
                          className={`text-xs px-2 py-0.5 rounded ${
                            canUnlock ? "bg-yellow-500 text-black" : "bg-gray-700 text-gray-400"
                          }`}
                          disabled={!canUnlock}
                          onClick={(): void => onUnlock(def.id)}
                        >
                          {locked ? "Unlock" : currentTier < def.tiers.length ? "Upgrade" : "Maxed"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
