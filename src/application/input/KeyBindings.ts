import type { Action } from "./ActionTypes";
import { createJsonCodec, createStore, detectBackend } from "../../lib/storage";

// Default key bindings
const DEFAULT_KEY_TO_ACTION: Record<string, Action | undefined> = {
  ArrowUp: "thrust",
  KeyW: "thrust",
  ArrowLeft: "turnLeft",
  KeyA: "turnLeft",
  ArrowRight: "turnRight",
  KeyD: "turnRight",
  ArrowDown: "moveDown",
  KeyS: "moveDown",
  Space: "fire",
  KeyC: "interact",
  KeyL: "land",
  KeyT: "takeoff",
  KeyI: "inventory",
  // Optional speed controls
  ShiftLeft: "boost",
  ShiftRight: "boost",
  Equal: "speedUp", // '=' key (often with '+')
  Minus: "speedDown", // '-' key
};

// Mutable key map so we can customize at runtime
let KEY_TO_ACTION: Record<string, Action | undefined> = { ...DEFAULT_KEY_TO_ACTION };

export function getKeyBindings(): Record<string, Action | undefined> {
  return { ...KEY_TO_ACTION };
}

export function resetKeyBindings(): void {
  KEY_TO_ACTION = { ...DEFAULT_KEY_TO_ACTION };
  saveKeyBindingsToStorage();
}

export function setKeyBinding(action: Action, code: string): void {
  // Remove existing bindings for this action
  for (const k of Object.keys(KEY_TO_ACTION)) {
    if (KEY_TO_ACTION[k] === action) delete KEY_TO_ACTION[k];
  }
  KEY_TO_ACTION[code] = action;
  saveKeyBindingsToStorage();
}

export function getBindingsForAction(action: Action): string[] {
  const out: string[] = [];
  for (const [code, mappedAction] of Object.entries(KEY_TO_ACTION))
    if (mappedAction === action) out.push(code);
  return out;
}

const ACTIONS = {
  thrust: true,
  turnLeft: true,
  turnRight: true,
  fire: true,
  interact: true,
  moveDown: true,
  boost: true,
  speedUp: true,
  speedDown: true,
  land: true,
  takeoff: true,
  inventory: true,
} as const;

function isAction(x: string): x is Action {
  return x in ACTIONS;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const keyMapCodec = createJsonCodec<Record<string, Action>>((raw) => {
  if (!isRecord(raw)) throw new Error("Invalid key bindings map");
  const out: Record<string, Action> = {};
  for (const [code, act] of Object.entries(raw)) {
    if (typeof act !== "string" || !isAction(act)) throw new Error("Invalid binding value");
    out[code] = act;
  }
  return out;
});

export function loadKeyBindingsFromStorage(): void {
  try {
    const store = createStore<Record<string, Action>>({
      namespace: "lose.keybindings",
      backend: detectBackend(),
      codec: keyMapCodec,
    });
    const value = store.get("map");
    if (!value) return;
    const next: Record<string, Action | undefined> = {};
    for (const [code, act] of Object.entries(value)) next[code] = act;

    // Migration: if ArrowDown/KeyS were previously bound to "interact",
    // rebind them to the new "moveDown" action so players can still walk down.
    let migrated = false;
    for (const code of ["ArrowDown", "KeyS"]) {
      if (next[code] === "interact") {
        next[code] = "moveDown";
        migrated = true;
      }
    }
    KEY_TO_ACTION = { ...DEFAULT_KEY_TO_ACTION, ...next };
    if (migrated) saveKeyBindingsToStorage();
  } catch {
    // ignore
  }
}

export function saveKeyBindingsToStorage(): void {
  try {
    const toSave: Record<string, Action> = {};
    for (const [code, action] of Object.entries(KEY_TO_ACTION)) if (action) toSave[code] = action;
    const store = createStore<Record<string, Action>>({
      namespace: "lose.keybindings",
      backend: detectBackend(),
      codec: keyMapCodec,
    });
    store.set("map", toSave);
  } catch {
    // ignore
  }
}

export function mapKeyToAction(code: string): Action | undefined {
  return KEY_TO_ACTION[code];
}
