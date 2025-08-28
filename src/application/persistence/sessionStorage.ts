import {
  createJsonCodec,
  createStore,
  detectBackend,
  type NamespacedStore,
} from "../../lib/storage";

export interface InventoryEntry {
  type: string;
  quantity: number;
}

export interface SessionState {
  player: { x: number; y: number };
  mode: "space" | "planet";
  planetId?: string;
  inventory?: InventoryEntry[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const sessionCodec = createJsonCodec<SessionState>((u) => {
  if (!isRecord(u)) throw new Error("Invalid SessionState");
  const r = u;
  const player = r["player"];
  if (!isRecord(player)) throw new Error("Invalid player");
  const x = player["x"];
  const y = player["y"];
  if (typeof x !== "number" || typeof y !== "number") throw new Error("Invalid player coords");
  const modeVal = r["mode"];
  if (modeVal !== "space" && modeVal !== "planet") throw new Error("Invalid mode");
  const planetId = r["planetId"];
  const inv = r["inventory"];
  let inventory: InventoryEntry[] | undefined;
  if (Array.isArray(inv)) {
    const out: InventoryEntry[] = [];
    for (const entry of inv) {
      if (!isRecord(entry)) continue;
      const t = entry["type"];
      const q = entry["quantity"];
      if (typeof t === "string" && typeof q === "number" && Number.isFinite(q)) {
        out.push({ type: t, quantity: q });
      }
    }
    inventory = out;
  }
  return {
    player: { x, y },
    mode: modeVal,
    planetId: typeof planetId === "string" ? planetId : undefined,
    inventory,
  };
});

function getStore(): NamespacedStore<SessionState> {
  const backend = detectBackend();
  return createStore<SessionState>({ namespace: "lose.session", backend, codec: sessionCodec });
}

export function loadSessionState(): SessionState | null {
  return getStore().get("latest");
}

export function saveSessionState(state: SessionState): void {
  getStore().set("latest", state);
}
