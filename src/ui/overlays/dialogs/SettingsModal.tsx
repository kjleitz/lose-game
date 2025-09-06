import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";

import type { Action } from "../../../application/input/ActionTypes";
import {
  getBindingsForAction,
  loadKeyBindingsFromStorage,
  resetKeyBindings,
  setKeyBinding,
} from "../../../application/input/KeyBindings";
import {
  getDefaultSettings,
  loadSettings,
  type Settings,
  type SpriteTheme,
  updateSettings,
} from "../../../application/settings/settingsStorage";
import { getSpriteUrlForKey, setSpriteConfig } from "../../../domain/render/sprites";
import { setVisualConfig } from "../../../domain/render/VisualConfig";
import { Panel, Button } from "../../controls";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  speed: number;
  onChangeSpeed: (nextSpeed: number) => void;
  onGrantPerkPoints?: (amount: number) => void;
}

const ACTION_LABELS: Record<Action, string> = {
  thrust: "Thrust",
  turnLeft: "Turn Left",
  turnRight: "Turn Right",
  fire: "Fire",
  interact: "Interact",
  moveDown: "Move Down",
  boost: "Boost",
  speedUp: "Speed Up",
  speedDown: "Speed Down",
  land: "Land on Planet",
  takeoff: "Take Off",
  inventory: "Toggle Inventory",
};

const ACTION_LIST: Action[] = [
  "thrust",
  "turnLeft",
  "turnRight",
  "fire",
  "interact",
  "moveDown",
  "boost",
  "speedUp",
  "speedDown",
  "land",
  "takeoff",
  "inventory",
];

export function SettingsModal({
  open,
  onClose,
  speed,
  onChangeSpeed,
  onGrantPerkPoints,
}: SettingsModalProps): JSX.Element | null {
  const [listeningAction, setListeningAction] = useState<Action | null>(null);
  // Sprite theme state is sourced from storage on open and written back immediately on change
  const [spriteTheme, setSpriteTheme] = useState<SpriteTheme>("classic");
  const [spriteOverrides, setSpriteOverrides] = useState<Settings["spriteOverrides"]>({});
  const [cloudDensity, setCloudDensity] = useState<number>(1);
  const [birdDensity, setBirdDensity] = useState<number>(1);
  const [foamDensity, setFoamDensity] = useState<number>(1);
  // No nested choosers/groups yet; keep state minimal and explicit.

  // Discover available sprite keys and variants from the filesystem (Vite glob)
  const RAW_SPRITES = import.meta.glob("/src/assets/sprites/*/*.svg", {
    eager: true,
    query: "?url",
    import: "default",
  });
  const SPRITE_FILES: Record<string, string> = useMemo((): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const [keyPath, urlValue] of Object.entries(RAW_SPRITES))
      if (typeof urlValue === "string") out[keyPath] = urlValue;
    return out;
  }, [RAW_SPRITES]);

  interface SpriteCatalog {
    keys: string[];
    variants: Map<string, string[]>; // key -> variant names
  }

  const catalog: SpriteCatalog = useMemo(() => {
    const variantMap = new Map<string, Set<string>>();
    const pathRe = /\/src\/assets\/sprites\/([^/]+)\/([^/]+)\.svg$/;
    Object.keys(SPRITE_FILES).forEach((path) => {
      const matchResult = path.match(pathRe);
      if (!matchResult) return;
      const key = matchResult[1];
      const variant = matchResult[2];
      if (!variantMap.has(key)) variantMap.set(key, new Set<string>());
      variantMap.get(key)!.add(variant);
    });
    const keys = Array.from(variantMap.keys()).sort();
    const variants = new Map<string, string[]>();
    variantMap.forEach((set, k) => variants.set(k, Array.from(set.values()).sort()));
    return { keys, variants };
  }, [SPRITE_FILES]);

  useEffect(() => {
    // Ensure persisted keymap is loaded before reading bindings below.
    loadKeyBindingsFromStorage();
    if (!open) return;
    const settings = loadSettings() ?? getDefaultSettings();
    setSpriteTheme(settings.spriteTheme);
    setSpriteOverrides(settings.spriteOverrides);
    setCloudDensity(settings.cloudDensity ?? 1);
    setBirdDensity(settings.birdDensity ?? 1);
    setFoamDensity(settings.foamDensity ?? 1);
  }, [open]);

  useEffect(() => {
    setSpriteConfig({ defaultVariant: spriteTheme, overrides: spriteOverrides });
  }, [spriteTheme, spriteOverrides]);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70">
      <Panel className="w-[720px] max-w-[90vw] max-h-[80vh] p-4 flex flex-col">
        <header className="flex items-center justify-between">
          <h2 className="hud-text text-sm">Settings</h2>
          <Button onClick={onClose}>Close</Button>
        </header>

        <div className="space-y-4 overflow-y-auto pr-1 flex-1">
          <section className="space-y-2">
            <h3 className="hud-text text-xs opacity-80">Game Speed</h3>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0.25}
                max={5}
                step={0.25}
                value={speed}
                onChange={(evt): void => onChangeSpeed(parseFloat(evt.target.value))}
              />
              <span className="hud-text text-xs opacity-80">{speed.toFixed(2)}x</span>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="hud-text text-xs opacity-80">Debug</h3>
            <div className="flex items-center gap-2">
              <Button
                onClick={(): void => {
                  if (onGrantPerkPoints) onGrantPerkPoints(999);
                }}
              >
                Grant 999 Perk Points
              </Button>
              <span className="text-[11px] text-gray-400">For testing perks quickly.</span>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="hud-text text-xs opacity-80">Key Bindings</h3>
            <div className="grid grid-cols-2 gap-2">
              {ACTION_LIST.map((action) => {
                const bindings = getBindingsForAction(action);
                return (
                  <Button
                    key={action}
                    className={
                      listeningAction === action ? "border-hud-accent bg-hud-bg" : undefined
                    }
                    onClick={(): void => setListeningAction(action)}
                    onKeyDown={(evt): void => {
                      if (listeningAction !== action) return;
                      setKeyBinding(action, evt.code);
                      setListeningAction(null);
                    }}
                  >
                    <div className="hud-text text-left">
                      <div className="text-[11px] opacity-80">{ACTION_LABELS[action]}</div>
                      <div className="text-xs">{bindings.join(", ") || "(none)"}</div>
                    </div>
                  </Button>
                );
              })}
            </div>
            <div>
              <Button onClick={(): void => resetKeyBindings()}>Reset Bindings</Button>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="hud-text text-xs opacity-80">Sprites</h3>
            <div className="grid grid-cols-3 gap-3">
              {catalog.keys.map((key) => (
                <div key={key} className="border border-hud-accent/20 rounded p-2">
                  <div className="hud-text text-xs mb-1">{key}</div>
                  <div className="flex flex-wrap gap-2">
                    {catalog.variants.get(key)?.map((variant) => {
                      const url = getSpriteUrlForKey(key, variant);
                      return (
                        <Button
                          key={`${key}-${variant}`}
                          className={
                            spriteOverrides[key] === variant
                              ? "border-hud-accent bg-hud-bg"
                              : undefined
                          }
                          onClick={(): void => {
                            const nextVariant: SpriteTheme =
                              variant === "art-deco" ? "art-deco" : "classic";
                            setSpriteOverrides((prev) => ({ ...prev, [key]: nextVariant }));
                          }}
                        >
                          <img
                            src={url}
                            alt={`${key}-${variant}`}
                            className="w-6 h-6 inline mr-1"
                          />
                          {variant}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="hud-text text-xs opacity-80">Visuals</h3>
            <div className="grid grid-cols-3 gap-3">
              <label className="hud-text text-xs flex items-center gap-2">
                Cloud density
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={cloudDensity}
                  onChange={(evt): void => {
                    const value = parseFloat(evt.target.value);
                    setCloudDensity(value);
                    updateSettings({ cloudDensity: value });
                    setVisualConfig({ cloudDensity: value });
                  }}
                />
              </label>
              <label className="hud-text text-xs flex items-center gap-2">
                Bird density
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={birdDensity}
                  onChange={(evt): void => {
                    const value = parseFloat(evt.target.value);
                    setBirdDensity(value);
                    updateSettings({ birdDensity: value });
                  }}
                />
              </label>
              <label className="hud-text text-xs flex items-center gap-2">
                Foam density
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={foamDensity}
                  onChange={(evt): void => {
                    const value = parseFloat(evt.target.value);
                    setFoamDensity(value);
                    updateSettings({ foamDensity: value });
                  }}
                />
              </label>
            </div>
          </section>
        </div>

        <footer className="flex items-center justify-between">
          <Button
            onClick={(): void => {
              const defaults = getDefaultSettings();
              setSpriteTheme(defaults.spriteTheme);
              setSpriteOverrides(defaults.spriteOverrides);
              setCloudDensity(defaults.cloudDensity ?? 1);
              setBirdDensity(defaults.birdDensity ?? 1);
              setFoamDensity(defaults.foamDensity ?? 1);
              updateSettings(defaults);
            }}
          >
            Reset All
          </Button>
          <div />
        </footer>
      </Panel>
    </div>
  );
}
