import {
  createActionQueue,
  createActionState,
  enqueueKeyEvent,
  consumeQueue,
} from "./ActionManager";
import type { ActionState } from "./ActionTypes";

export class InputManager {
  public actions = createActionState();
  public actionQueue = createActionQueue();

  enqueueKeyDown(code: string): void {
    enqueueKeyEvent(this.actionQueue, code, true);
  }

  enqueueKeyUp(code: string): void {
    enqueueKeyEvent(this.actionQueue, code, false);
  }

  updateActions(): ActionState {
    const prev = this.actions;
    const next = consumeQueue(prev, this.actionQueue);
    if (next !== prev) {
      this.actions = next;
    }
    return this.actions;
  }
}
