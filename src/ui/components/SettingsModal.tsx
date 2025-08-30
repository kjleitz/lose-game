import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";

import type { Action } from "../../application/input/ActionTypes";
import {
  getBindingsForAction,
  loadKeyBindingsFromStorage,
  resetKeyBindings,
  setKeyBinding,
} from "../../application/input/KeyBindings";
import {
  getDefaultSettings,
  loadSettings,
  type Settings,
  type SpriteTheme,
  updateSettings,
} from "../../application/settings/settingsStorage";
import { getSpriteUrlForKey, setSpriteConfig } from "../../domain/render/sprites";
import { setVisualConfig } from "../../domain/render/VisualConfig";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  speed: number;
  onChangeSpeed: (nextSpeed: number) => void;
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
}: SettingsModalProps): JSX.Element | null {
  const [listeningAction, setListeningAction] = useState<Action | null>(null);
  // Sprite theme state is sourced from storage on open and written back immediately on change
  const [spriteTheme, setSpriteTheme] = useState<SpriteTheme>("classic");
  const [spriteOverrides, setSpriteOverrides] = useState<Settings["spriteOverrides"]>({});
  const [cloudDensity, setCloudDensity] = useState<number>(1);
  const [birdDensity, setBirdDensity] = useState<number>(1);
  const [foamDensity, setFoamDensity] = useState<number>(1);
  const [openChooserKey, setOpenChooserKey] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Discover available sprite keys and variants from the filesystem (Vite glob)
  const RAW_SPRITES = import.meta.glob("/src/assets/sprites/*/*.svg", {
    eager: true,
    query: "?url",
    import: "default",
  });
  const SPRITE_FILES: Record<string, string> = useMemo(() => {
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
      const rawVariant = matchResult[2];
      // Collapse numbered frames e.g. art-deco-1 -> art-deco
      const variant = rawVariant.replace(/-\d+$/, "");
      if (!variantMap.has(key)) variantMap.set(key, new Set<string>());
      variantMap.get(key)!.add(variant);
    });
    const keys = Array.from(variantMap.keys()).sort((left, right) => left.localeCompare(right));
    const variants = new Map<string, string[]>();
    for (const key of keys) {
      variants.set(
        key,
        Array.from(variantMap.get(key)!).sort((left, right) => left.localeCompare(right)),
      );
    }
    return { keys, variants };
  }, [SPRITE_FILES]);

  interface Group {
    id: string;
    label: string;
    keys: string[];
  }

  const groups: Group[] = useMemo(() => {
    const pick = (pred: (k: string) => boolean): string[] => catalog.keys.filter(pred);
    const groupList: Group[] = [];
    const used = new Set<string>();
    const addGroup = (id: string, label: string, keys: string[]): void => {
      const unique = keys.filter((k) => catalog.keys.includes(k));
      unique.forEach((k) => used.add(k));
      if (unique.length > 0) groupList.push({ id, label, keys: unique });
    };
    addGroup(
      "core",
      "Core",
      ["character", "projectile"].filter((k) => catalog.keys.includes(k)),
    );
    addGroup(
      "ships",
      "Ships",
      pick((k) => ["ship", "thruster", "enemy-ship", "enemy-thruster"].includes(k)),
    );
    addGroup(
      "creatures",
      "Creatures",
      pick((k) => k.startsWith("creature-")),
    );
    addGroup(
      "terrain",
      "Terrain",
      pick((k) => k.startsWith("terrain-")),
    );
    addGroup(
      "resources",
      "Resources",
      pick((k) => k.startsWith("resource-")),
    );
    addGroup(
      "items",
      "Items",
      pick((k) => k.startsWith("item-")),
    );
    const leftovers = catalog.keys.filter((k) => !used.has(k));
    if (leftovers.length) groupList.push({ id: "other", label: "Other", keys: leftovers });
    return groupList;
  }, [catalog.keys]);

  useEffect((): void => {
    loadKeyBindingsFromStorage();
  }, []);

  useEffect(() => {
    if (!open || !listeningAction) return;
    const onKey = (event: KeyboardEvent): void => {
      event.preventDefault();
      event.stopPropagation();
      setKeyBinding(listeningAction, event.code);
      setListeningAction(null);
    };
    window.addEventListener("keydown", onKey, { once: true });
    return (): void => window.removeEventListener("keydown", onKey);
  }, [open, listeningAction]);

  useEffect(() => {
    if (!open) return;
    const loaded = loadSettings() ?? getDefaultSettings();
    setSpriteTheme(loaded.spriteTheme);
    setSpriteOverrides(loaded.spriteOverrides);
    setCloudDensity(loaded.cloudDensity ?? 1);
    setBirdDensity(loaded.birdDensity ?? 1);
    setFoamDensity(loaded.foamDensity ?? 1);
    setVisualConfig({
      cloudDensity: loaded.cloudDensity ?? 1,
      birdDensity: loaded.birdDensity ?? 1,
      foamDensity: loaded.foamDensity ?? 1,
    });
    // initialize groups open state if not set
    if (Object.keys(openGroups).length === 0) {
      const initialGroups: Record<string, boolean> = {};
      for (const group of groups) initialGroups[group.id] = true;
      setOpenGroups(initialGroups);
    }
  }, [open, groups, openGroups]);

  function applySpriteChange(
    next: Partial<Pick<Settings, "spriteTheme" | "spriteOverrides">>,
  ): void {
    const updated = updateSettings(next);
    setSpriteConfig({ defaultVariant: updated.spriteTheme, overrides: updated.spriteOverrides });
  }

  function applyVisualChange(
    next: Partial<Pick<Settings, "cloudDensity" | "birdDensity" | "foamDensity">>,
  ): void {
    const updated = updateSettings(next);
    setVisualConfig({
      cloudDensity: updated.cloudDensity ?? 1,
      birdDensity: updated.birdDensity ?? 1,
      foamDensity: updated.foamDensity ?? 1,
    });
  }

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#0b0b0b] border border-gray-700 rounded shadow-xl w-[520px] p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="hud-text text-sm">Settings</h2>
          <button
            type="button"
            className="px-2 py-1 text-xs bg-gray-800 text-white rounded border border-gray-600 hover:bg-gray-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <section className="space-y-2">
          <h3 className="hud-text text-xs opacity-70">Speed</h3>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0.25}
              max={5}
              step={0.25}
              value={speed}
              onChange={(event: React.ChangeEvent<HTMLInputElement>): void =>
                onChangeSpeed(parseFloat(event.target.value))
              }
              className="w-full"
            />
            <div className="hud-text text-xs w-12 text-right">{speed.toFixed(2)}x</div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="hud-text text-xs opacity-70">Planet Visuals</h3>
          <div className="grid gap-3">
            <div className="flex items-center gap-3">
              <label className="hud-text text-xs opacity-70 min-w-[120px]">Cloud Density</label>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={cloudDensity}
                onChange={(event: React.ChangeEvent<HTMLInputElement>): void => {
                  const value = parseFloat(event.target.value);
                  setCloudDensity(value);
                  applyVisualChange({ cloudDensity: value });
                }}
                className="w-full"
              />
              <div className="hud-text text-xs w-10 text-right">{cloudDensity.toFixed(1)}</div>
            </div>
            <div className="flex items-center gap-3">
              <label className="hud-text text-xs opacity-70 min-w-[120px]">Bird Density</label>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={birdDensity}
                onChange={(event: React.ChangeEvent<HTMLInputElement>): void => {
                  const value = parseFloat(event.target.value);
                  setBirdDensity(value);
                  applyVisualChange({ birdDensity: value });
                }}
                className="w-full"
              />
              <div className="hud-text text-xs w-10 text-right">{birdDensity.toFixed(1)}</div>
            </div>
            <div className="flex items-center gap-3">
              <label className="hud-text text-xs opacity-70 min-w-[120px]">Foam Density</label>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={foamDensity}
                onChange={(event: React.ChangeEvent<HTMLInputElement>): void => {
                  const value = parseFloat(event.target.value);
                  setFoamDensity(value);
                  applyVisualChange({ foamDensity: value });
                }}
                className="w-full"
              />
              <div className="hud-text text-xs w-10 text-right">{foamDensity.toFixed(1)}</div>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="hud-text text-xs opacity-70">Sprites</h3>
          <div className="flex items-center gap-3">
            <label className="hud-text text-xs opacity-70 min-w-[80px]">Global</label>
            <select
              className="bg-gray-900 text-xs text-white border border-gray-700 rounded px-2 py-1"
              value={spriteTheme}
              onChange={(event): void => {
                const value = event.target.value === "art-deco" ? "art-deco" : "classic";
                setSpriteTheme(value);
                applySpriteChange({ spriteTheme: value });
              }}
            >
              <option value="classic">Classic</option>
              <option value="art-deco">Art Deco</option>
            </select>
          </div>
          <div className="mt-2 max-h-64 overflow-y-auto pr-1 space-y-3">
            {groups.map((group) => (
              <div key={group.id} className="border border-gray-700 rounded">
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-2 py-2 bg-gray-900 hover:bg-gray-800"
                  onClick={(): void =>
                    setOpenGroups((prev) => ({ ...prev, [group.id]: !prev[group.id] }))
                  }
                >
                  <span className="hud-text text-xs">{group.label}</span>
                  <span className="hud-text text-[10px] opacity-60">
                    {openGroups[group.id] ? "▾" : "▸"}
                  </span>
                </button>
                {openGroups[group.id] ? (
                  <div className="divide-y divide-gray-800">
                    {group.keys.map((key) => {
                      const resolvedTheme: SpriteTheme = spriteOverrides[key] ?? spriteTheme;
                      const previewUrl = getSpriteUrlForKey(key, resolvedTheme);
                      const isOpen = openChooserKey === key;
                      const pretty = key
                        .replace(/^item-/, "Item: ")
                        .replace(/^terrain-/, "Terrain: ")
                        .replace(/^resource-/, "Resource: ")
                        .replace(/^creature-/, "Creature: ")
                        .replace(/-/g, " ")
                        .replace(/\b\w/g, (letter) => letter.toUpperCase());
                      const effectiveLabel = spriteOverrides[key]
                        ? `${resolvedTheme === "art-deco" ? "Art Deco" : "Classic"} (override)`
                        : `${resolvedTheme === "art-deco" ? "Art Deco" : "Classic"} (global)`;
                      const variants = catalog.variants.get(key) ?? ["classic", "art-deco"];
                      return (
                        <div key={key} className="px-2" title={`Effective: ${effectiveLabel}`}>
                          <div className="flex items-center justify-between gap-3 py-2">
                            <div className="hud-text text-xs">{pretty}</div>
                            <div className="flex items-center gap-3">
                              <img
                                src={previewUrl}
                                alt={`${pretty} preview`}
                                width={28}
                                height={28}
                                className="w-7 h-7 bg-gray-800 rounded"
                              />
                              <button
                                type="button"
                                className="px-2 py-1 text-[10px] bg-gray-800 text-white rounded border border-gray-600 hover:bg-gray-700"
                                onClick={(): void => setOpenChooserKey(isOpen ? null : key)}
                              >
                                {isOpen ? "Choose…" : "Change"}
                              </button>
                            </div>
                          </div>
                          {isOpen ? (
                            <div className="pb-2">
                              <div className="grid grid-cols-3 gap-2">
                                {/* Inherit */}
                                <button
                                  type="button"
                                  className="flex flex-col items-center gap-1 p-2 bg-gray-900 border border-gray-700 rounded hover:bg-gray-800"
                                  onClick={(): void => {
                                    const next = { ...spriteOverrides };
                                    delete next[key];
                                    setSpriteOverrides(next);
                                    applySpriteChange({ spriteOverrides: next });
                                    setOpenChooserKey(null);
                                  }}
                                >
                                  <img
                                    src={getSpriteUrlForKey(key, spriteTheme)}
                                    alt={`${pretty} inherit preview`}
                                    width={36}
                                    height={36}
                                    className="w-9 h-9 bg-gray-800 rounded"
                                  />
                                  <span className="hud-text text-[10px] opacity-80">Inherit</span>
                                </button>
                                {variants.map((variantName) => (
                                  <button
                                    key={variantName}
                                    type="button"
                                    className="flex flex-col items-center gap-1 p-2 bg-gray-900 border border-gray-700 rounded hover:bg-gray-800"
                                    onClick={(): void => {
                                      const value: SpriteTheme =
                                        variantName === "art-deco" ? "art-deco" : "classic";
                                      const next: Record<string, SpriteTheme> = {
                                        ...spriteOverrides,
                                      };
                                      next[key] = value;
                                      setSpriteOverrides(next);
                                      applySpriteChange({ spriteOverrides: next });
                                      setOpenChooserKey(null);
                                    }}
                                  >
                                    <img
                                      src={getSpriteUrlForKey(key, variantName)}
                                      alt={`${pretty} ${variantName} preview`}
                                      width={36}
                                      height={36}
                                      className="w-9 h-9 bg-gray-800 rounded"
                                    />
                                    <span className="hud-text text-[10px] opacity-80">
                                      {variantName.replace(/-/g, " ")}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="hud-text text-xs opacity-70">Key Bindings</h3>
            <button
              type="button"
              className="px-2 py-1 text-[10px] bg-gray-800 text-white rounded border border-gray-600 hover:bg-gray-700"
              onClick={(): void => {
                resetKeyBindings();
              }}
            >
              Reset Defaults
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {ACTION_LIST.map((action): JSX.Element => {
              const codes = getBindingsForAction(action);
              const label = ACTION_LABELS[action];
              const listening = listeningAction === action;
              return (
                <div
                  key={action}
                  className="flex items-center justify-between gap-2 border border-gray-700 rounded px-2 py-2"
                >
                  <div className="hud-text text-xs">{label}</div>
                  <div className="flex items-center gap-2">
                    <div className="hud-text text-[10px] opacity-70 min-w-[140px] text-right">
                      {listening ? "Press any key…" : (codes[0] ?? "(none)")}
                    </div>
                    <button
                      type="button"
                      className="px-2 py-1 text-[10px] bg-gray-800 text-white rounded border border-gray-600 hover:bg-gray-700"
                      onClick={(): void => setListeningAction(action)}
                    >
                      Rebind
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
