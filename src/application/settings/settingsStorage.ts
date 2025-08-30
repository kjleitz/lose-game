import {
  createJsonCodec,
  createStore,
  detectBackend,
  type NamespacedStore,
} from "../../lib/storage";

export type SpriteTheme = "classic" | "art-deco";

export interface Settings {
  speed: number;
  spriteTheme: SpriteTheme;
  spriteOverrides: Record<string, SpriteTheme>;
  cloudDensity?: number; // 0..2
  birdDensity?: number; // 0..2
  foamDensity?: number; // 0..2
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const settingsCodec = createJsonCodec<Settings>((raw) => {
  if (!isRecord(raw)) throw new Error("Invalid Settings");
  const rec = raw;
  const speedVal = rec["speed"];
  if (typeof speedVal !== "number" || !Number.isFinite(speedVal)) throw new Error("Invalid speed");
  const themeRaw = rec["spriteTheme"];
  const overridesRaw = rec["spriteOverrides"];

  const spriteTheme: SpriteTheme = themeRaw === "art-deco" ? "art-deco" : "classic";
  const spriteOverrides: Record<string, SpriteTheme> = {};
  if (isRecord(overridesRaw)) {
    for (const [key, theme] of Object.entries(overridesRaw)) {
      spriteOverrides[key] = theme === "art-deco" ? "art-deco" : "classic";
    }
  }
  let cloud: number | undefined;
  if (typeof rec["cloudDensity"] === "number") cloud = clamp(rec["cloudDensity"], 0, 2);
  let bird: number | undefined;
  if (typeof rec["birdDensity"] === "number") bird = clamp(rec["birdDensity"], 0, 2);
  let foam: number | undefined;
  if (typeof rec["foamDensity"] === "number") foam = clamp(rec["foamDensity"], 0, 2);
  const base: Settings = { speed: speedVal, spriteTheme, spriteOverrides };
  const withCloud = cloud !== undefined ? { ...base, cloudDensity: cloud } : base;
  const withBird = bird !== undefined ? { ...withCloud, birdDensity: bird } : withCloud;
  const withFoam = foam !== undefined ? { ...withBird, foamDensity: foam } : withBird;
  return withFoam;
});

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getStore(): NamespacedStore<Settings> {
  const backend = detectBackend();
  return createStore<Settings>({ namespace: "lose.settings", backend, codec: settingsCodec });
}

export function getDefaultSettings(): Settings {
  return {
    speed: 1,
    spriteTheme: "classic",
    spriteOverrides: {},
    cloudDensity: 1,
    birdDensity: 1,
    foamDensity: 1,
  };
}

export function loadSettings(): Settings | null {
  const store = getStore();
  return store.get("app");
}

export function saveSettings(settings: Settings): void {
  const store = getStore();
  store.set("app", settings);
}

export function updateSettings(patch: Partial<Settings>): Settings {
  const store = getStore();
  const current = store.get("app") ?? getDefaultSettings();
  const next: Settings = { ...current, ...patch };
  store.set("app", next);
  return next;
}
