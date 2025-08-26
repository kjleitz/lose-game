import type { Component, ComponentConstructor } from "./types.js";

export function defineComponent<T = {}>(defaultFactory?: () => T): ComponentConstructor<T> {
  const componentType = Symbol("component");

  class ComponentClass implements Component<T> {
    readonly __componentType = componentType;
    readonly __data: T;

    constructor(data: T) {
      this.__data = data;
    }

    static readonly __componentType = componentType;

    static create(data: T): Component<T> {
      return new ComponentClass(data);
    }

    static get defaultFactory() {
      return defaultFactory;
    }
  }

  return ComponentClass;
}

export function isComponent<T>(
  value: unknown,
  componentConstructor: ComponentConstructor<T>,
): value is Component<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "__componentType" in (value as Record<string, unknown>) &&
    (value as { __componentType?: unknown }).__componentType ===
      componentConstructor.__componentType
  );
}
