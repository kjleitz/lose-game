import type { ActionState, ActionQueue } from "./ActionTypes";
import { mapKeyToAction } from "./KeyBindings";

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

export function createActionQueue(): ActionQueue {
  return [];
}

export function enqueueKeyEvent(queue: ActionQueue, code: string, pressed: boolean): void {
  const action = mapKeyToAction(code);
  if (!action) return;
  queue.push({ action, pressed });
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
