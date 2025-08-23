export type Action = "thrust" | "turnLeft" | "turnRight" | "fire" | "interact";

const KEY_TO_ACTION: Record<string, Action | undefined> = {
  ArrowUp: "thrust",
  KeyW: "thrust",
  ArrowLeft: "turnLeft",
  KeyA: "turnLeft",
  ArrowRight: "turnRight",
  KeyD: "turnRight",
  Space: "fire",
  KeyE: "interact",
};

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
