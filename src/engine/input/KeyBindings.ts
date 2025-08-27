import type { Action } from "./ActionTypes";

// Default key bindings
const DEFAULT_KEY_TO_ACTION: Record<string, Action | undefined> = {
  ArrowUp: "thrust",
  KeyW: "thrust",
  ArrowLeft: "turnLeft",
  KeyA: "turnLeft",
  ArrowRight: "turnRight",
  KeyD: "turnRight",
  ArrowDown: "interact",
  KeyS: "interact",
  Space: "fire",
  KeyE: "interact",
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
  for (const [code, a] of Object.entries(KEY_TO_ACTION)) if (a === action) out.push(code);
  return out;
}

const ACTIONS = {
  thrust: true,
  turnLeft: true,
  turnRight: true,
  fire: true,
  interact: true,
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

function parseBindingsFromString(raw: string): Record<string, string> | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v !== "string") return null; // fail fast on unexpected types
      out[k] = v;
    }
    return out;
  } catch {
    return null;
  }
}

export function loadKeyBindingsFromStorage(): void {
  try {
    if (typeof window === "undefined") return; // tests
    const raw = window.localStorage.getItem("lose.keyBindings");
    if (!raw) return;
    const asStrings = parseBindingsFromString(raw);
    if (!asStrings) return; // ignore invalid persisted data
    // Ensure all are known actions; otherwise ignore persisted data
    for (const act of Object.values(asStrings)) if (!isAction(act)) return;
    const next: Record<string, Action | undefined> = {};
    for (const [code, act] of Object.entries(asStrings)) {
      if (isAction(act)) next[code] = act;
    }
    // Preserve speed controls if missing
    KEY_TO_ACTION = { ...DEFAULT_KEY_TO_ACTION, ...next };
  } catch {
    // ignore
  }
}

export function saveKeyBindingsToStorage(): void {
  try {
    if (typeof window === "undefined") return;
    const toSave: Record<string, Action> = {};
    for (const [code, action] of Object.entries(KEY_TO_ACTION)) if (action) toSave[code] = action;
    window.localStorage.setItem("lose.keyBindings", JSON.stringify(toSave));
  } catch {
    // ignore
  }
}

export function mapKeyToAction(code: string): Action | undefined {
  return KEY_TO_ACTION[code];
}
