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
      <Panel
        className="p-3 w-[640px] max-w-[90vw] max-h-[80vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-white text-base">Perks</h2>
          <Button size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="text-xs text-gray-300 mb-2">
          Level {level} · Perk Points: {perkPoints}
        </div>
        <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1 flex-1">
          {groups.map((group) => (
            <div key={group.category} className="border border-hud-accent/20 rounded p-2">
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
                    <li
                      key={def.id}
                      className={
                        "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 text-left py-1 border-t border-hud-accent/10 first:border-t-0" +
                        (def.implemented ? "" : " opacity-40 select-none")
                      }
                    >
                      <div className="min-w-0">
                        <div className="text-white text-sm leading-tight font-medium">
                          {def.name}
                        </div>
                        <div className="text-gray-400 text-[11px] leading-snug whitespace-normal break-words">
                          {def.description}
                        </div>
                        {!def.implemented ? (
                          <div className="mt-1 flex items-center space-x-1 text-[10px] text-amber-300">
                            <UnderDevelopmentIcon />
                            <span>under development</span>
                          </div>
                        ) : null}
                        <div className="text-gray-500 text-[10px] leading-tight mt-0.5">
                          Tier: {currentTier}/{def.tiers.length}
                        </div>
                        {nextTier ? (
                          <div className="text-[10px] text-gray-400 mt-0.5 space-y-0.5">
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
                              <div>
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
                      <div className="flex items-center justify-end space-x-2">
                        {locked ? (
                          <span className="text-[10px] text-gray-400">
                            Cost {nextTier?.cost ?? 0}
                          </span>
                        ) : null}
                        <Button
                          size="sm"
                          className={
                            canUnlock && def.implemented
                              ? "bg-hud-warning text-black border border-hud-warning"
                              : undefined
                          }
                          disabled={!canUnlock || !def.implemented}
                          onClick={(): void => onUnlock(def.id)}
                        >
                          {locked ? "Unlock" : currentTier < def.tiers.length ? "Upgrade" : "Maxed"}
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
import { Panel, Button } from "../../controls";

function UnderDevelopmentIcon(): JSX.Element {
  // Inline SVG: yellow/black diamond road-work sign with a simple two-frame shovel animation
  // Uses discrete keyframes to emulate a GIF-like two-frame toggle
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 32 32"
      aria-hidden="true"
      role="img"
      focusable="false"
      className="shrink-0"
    >
      {/* Diamond sign */}
      <rect
        x="5"
        y="5"
        width="22"
        height="22"
        transform="rotate(45 16 16)"
        fill="#FACC15"
        stroke="#111827"
        strokeWidth="2"
        rx="2"
        ry="2"
      />
      {/* Simple worker */}
      <g transform="translate(8,9)" stroke="#111827" strokeWidth="1.5" strokeLinecap="round">
        {/* head */}
        <circle cx="6" cy="4" r="2" fill="#111827" />
        {/* body */}
        <path d="M6 6 L6 11 M6 8 L3 10 M6 8 L9 10" fill="none" />
        {/* shovel group with tiny two-frame tilt */}
        <g id="shovel" transform="translate(10,11)">
          <g>
            <path d="M0 0 L4 -4" />
            <path d="M4 -4 L6 -2 L4 0 Z" fill="#111827" />
          </g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="-10 2 -2;10 2 -2;-10 2 -2"
            keyTimes="0;0.5;1"
            dur="0.8s"
            repeatCount="indefinite"
            calcMode="discrete"
          />
        </g>
      </g>
    </svg>
  );
}
