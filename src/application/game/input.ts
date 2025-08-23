export type Action =
  | "thrust"
  | "turnLeft"
  | "turnRight"
  | "fire"
  | "interact"
  | "boost"
  | "speedUp"
  | "speedDown";

// Default key bindings
const DEFAULT_KEY_TO_ACTION: Record<string, Action | undefined> = {
  ArrowUp: "thrust",
  KeyW: "thrust",
  ArrowLeft: "turnLeft",
  KeyA: "turnLeft",
  ArrowRight: "turnRight",
  KeyD: "turnRight",
  Space: "fire",
  KeyE: "interact",
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

export function resetKeyBindings() {
  KEY_TO_ACTION = { ...DEFAULT_KEY_TO_ACTION };
  saveKeyBindingsToStorage();
}

export function setKeyBinding(action: Action, code: string) {
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

export function loadKeyBindingsFromStorage() {
  try {
    if (typeof window === "undefined") return; // tests
    const raw = window.localStorage.getItem("lose.keyBindings");
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, Action>;
    const next: Record<string, Action | undefined> = {};
    for (const [code, action] of Object.entries(parsed)) {
      next[code] = action;
    }
    // Preserve speed controls if missing
    KEY_TO_ACTION = { ...DEFAULT_KEY_TO_ACTION, ...next };
  } catch {
    // ignore
  }
}

export function saveKeyBindingsToStorage() {
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

export type ActionState = Set<Action>;

export function createActionState(): ActionState {
  return new Set();
}

export function applyKeyEvent(state: ActionState, code: string, pressed: boolean): ActionState {
  const action = mapKeyToAction(code);
  if (!action) return state;
  const next = new Set(state);
  if (pressed) next.add(action);
  else next.delete(action);
  return next;
}

// Action queue for deterministic per-tick consumption
export interface ActionEvent {
  action: Action;
  pressed: boolean;
}

export type ActionQueue = ActionEvent[];

export function createActionQueue(): ActionQueue {
  return [];
}

export function enqueueKeyEvent(queue: ActionQueue, code: string, pressed: boolean) {
  const a = mapKeyToAction(code);
  if (!a) return;
  queue.push({ action: a, pressed });
}

export function consumeQueue(state: ActionState, queue: ActionQueue): ActionState {
  if (queue.length === 0) return state;
  const next = new Set(state);
  for (const evt of queue) {
    if (evt.pressed) next.add(evt.action);
    else next.delete(evt.action);
  }
  // empty the queue in-place
  queue.length = 0;
  return next;
}
