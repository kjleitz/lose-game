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
  perkPoints?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const sessionCodec = createJsonCodec<SessionState>((raw) => {
  if (!isRecord(raw)) throw new Error("Invalid SessionState");
  const record = raw;
  const player = record["player"];
  if (!isRecord(player)) throw new Error("Invalid player");
  const x = player["x"];
  const y = player["y"];
  if (typeof x !== "number" || typeof y !== "number") throw new Error("Invalid player coords");
  const modeVal = record["mode"];
  if (modeVal !== "space" && modeVal !== "planet") throw new Error("Invalid mode");
  const planetId = record["planetId"];
  const inv = record["inventory"];
  const savedPerkPoints = record["perkPoints"];
  let inventory: InventoryEntry[] | undefined;
  if (Array.isArray(inv)) {
    const out: InventoryEntry[] = [];
    for (const entry of inv) {
      if (!isRecord(entry)) continue;
      const typeVal = entry["type"];
      const quantityVal = entry["quantity"];
      if (
        typeof typeVal === "string" &&
        typeof quantityVal === "number" &&
        Number.isFinite(quantityVal)
      ) {
        out.push({ type: typeVal, quantity: quantityVal });
      }
    }
    inventory = out;
  }
  return {
    player: { x, y },
    mode: modeVal,
    planetId: typeof planetId === "string" ? planetId : undefined,
    inventory,
    perkPoints:
      typeof savedPerkPoints === "number" && Number.isFinite(savedPerkPoints)
        ? savedPerkPoints
        : undefined,
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

export function deleteSessionState(): void {
  try {
    const store = getStore();
    // Removing the key effectively clears the saved session
    store.remove("latest");
  } catch {
    // ignore
  }
}
