import type { GameBus, GameEvent, Unsubscribe } from "./GameAPI";

function isEventOfType<T extends GameEvent["type"]>(
  e: GameEvent,
  type: T,
): e is Extract<GameEvent, { type: T }> {
  return e.type === type;
}

export class SimpleGameBus implements GameBus {
  private handlers: Map<GameEvent["type"], Set<(e: GameEvent) => void>> = new Map();
  private anyHandlers: Set<(e: GameEvent) => void> = new Set();

  subscribe<T extends GameEvent["type"]>(
    type: T,
    handler: (e: Extract<GameEvent, { type: T }>) => void,
  ): Unsubscribe {
    let set = this.handlers.get(type);
    if (!set) {
      set = new Set();
      this.handlers.set(type, set);
    }
    const wrapped = (e: GameEvent): void => {
      if (isEventOfType(e, type)) handler(e);
    };
    set.add(wrapped);
    return (): void => {
      set?.delete(wrapped);
    };
  }

  onAny(handler: (e: GameEvent) => void): Unsubscribe {
    this.anyHandlers.add(handler);
    return (): void => {
      this.anyHandlers.delete(handler);
    };
  }

  publish(e: GameEvent): void {
    const set = this.handlers.get(e.type);
    if (set) {
      for (const h of set) h(e);
    }
    if (this.anyHandlers.size > 0) {
      for (const h of this.anyHandlers) h(e);
    }
  }
}
