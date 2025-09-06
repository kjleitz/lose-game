import type { JSX } from "react";
import type { AmmoType } from "../../../shared/types/combat";
import { ammoLabel } from "../../../shared/types/combat";

interface AmmoSelectorProps {
  current: AmmoType;
  options: ReadonlyArray<AmmoType>;
  onSelect?: (type: AmmoType) => void;
}

export function AmmoSelector({ current, options, onSelect }: AmmoSelectorProps): JSX.Element {
  const all: ReadonlyArray<AmmoType> = ["standard", "kinetic", "plasma", "ion"];
  return (
    <div className="space-y-1" data-testid="hud-ammo-selector">
      <div className="hud-text text-xs opacity-80">Ammo</div>
      <div className="flex gap-1">
        {all.map((typeId) => {
          const available = options.includes(typeId);
          const isActive = current === typeId;
          const base = "font-hud text-[10px] px-2 py-0.5 rounded border transition-colors";
          const activeCls = isActive
            ? "border-hud-accent/60 text-black bg-hud-accent"
            : "border-hud-accent/30 text-slate-100 bg-hud-bg/70 hover:bg-hud-bg/90";
          const disabledCls = available ? "" : "opacity-40 cursor-not-allowed";
          return (
            <button
              key={typeId}
              type="button"
              className={`${base} ${activeCls} ${disabledCls}`}
              title={available ? ammoLabel(typeId) : `${ammoLabel(typeId)} (locked)`}
              onClick={(): void => {
                if (!available || !onSelect) return;
                onSelect(typeId);
              }}
              data-testid={`ammo-btn-${typeId}`}
            >
              {ammoLabel(typeId)}
            </button>
          );
        })}
      </div>
      <div className="hud-text text-[11px] opacity-70" data-testid="hud-ammo-current">
        Current: {ammoLabel(current)}
      </div>
    </div>
  );
}
