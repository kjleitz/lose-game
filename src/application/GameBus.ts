import type { GameBus, GameEvent, Unsubscribe } from "./GameAPI";

function isEventOfType<T extends GameEvent["type"]>(
  event: GameEvent,
  type: T,
): event is Extract<GameEvent, { type: T }> {
  return event.type === type;
}

export class SimpleGameBus implements GameBus {
  private handlers: Map<GameEvent["type"], Set<(event: GameEvent) => void>> = new Map();
  private anyHandlers: Set<(event: GameEvent) => void> = new Set();

  subscribe<T extends GameEvent["type"]>(
    type: T,
    handler: (event: Extract<GameEvent, { type: T }>) => void,
  ): Unsubscribe {
    let handlerSet = this.handlers.get(type);
    if (!handlerSet) {
      handlerSet = new Set();
      this.handlers.set(type, handlerSet);
    }
    const wrapped = (event: GameEvent): void => {
      if (isEventOfType(event, type)) handler(event);
    };
    handlerSet.add(wrapped);
    return (): void => {
      handlerSet?.delete(wrapped);
    };
  }

  onAny(handler: (event: GameEvent) => void): Unsubscribe {
    this.anyHandlers.add(handler);
    return (): void => {
      this.anyHandlers.delete(handler);
    };
  }

  publish(event: GameEvent): void {
    const handlerSet = this.handlers.get(event.type);
    if (handlerSet) {
      for (const handler of handlerSet) handler(event);
    }
    if (this.anyHandlers.size > 0) {
      for (const handler of this.anyHandlers) handler(event);
    }
  }
}
