import { createStore, detectBackend, createJsonCodec } from "..";

interface Settings { music: boolean; sfx: boolean; volume: number }

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

const settingsCodec = createJsonCodec<Settings>((u) => {
  if (!isRecord(u)) throw new Error("Invalid settings");
  const music = u["music"];
  const sfx = u["sfx"];
  const volume = u["volume"];
  if (typeof music === "boolean" && typeof sfx === "boolean" && typeof volume === "number") {
    return { music, sfx, volume };
  }
  throw new Error("Invalid settings");
});

const store = createStore<Settings>({
  namespace: "settings",
  backend: detectBackend(),
  codec: settingsCodec,
});

store.set("audio", { music: true, sfx: true, volume: 0.8 });
const current = store.get("audio");
console.log("Loaded settings:", current);
