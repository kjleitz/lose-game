import { createActionQueue, createActionState, enqueueKeyEvent, consumeQueue } from "./input";

export class InputManager {
  public actions = createActionState();
  public actionQueue = createActionQueue();

  enqueueKeyDown(code: string) {
    enqueueKeyEvent(this.actionQueue, code, true);
  }

  enqueueKeyUp(code: string) {
    enqueueKeyEvent(this.actionQueue, code, false);
  }

  updateActions() {
    const prev = this.actions;
    const next = consumeQueue(prev, this.actionQueue);
    if (next !== prev) {
      this.actions = next;
    }
    return this.actions;
  }
}
