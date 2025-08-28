import {
  createJsonCodec,
  createStore,
  detectBackend,
  type NamespacedStore,
} from "../../lib/storage";

export interface Settings {
  speed: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const settingsCodec = createJsonCodec<Settings>((u) => {
  if (!isRecord(u)) throw new Error("Invalid Settings");
  const rec = u;
  const speedVal = rec["speed"];
  if (typeof speedVal !== "number" || !Number.isFinite(speedVal)) throw new Error("Invalid speed");
  return { speed: speedVal };
});

function getStore(): NamespacedStore<Settings> {
  const backend = detectBackend();
  return createStore<Settings>({ namespace: "lose.settings", backend, codec: settingsCodec });
}

export function getDefaultSettings(): Settings {
  return { speed: 1 };
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
