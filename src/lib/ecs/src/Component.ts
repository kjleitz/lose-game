import type { Component, ComponentConstructor } from "./types.js";

export function defineComponent<T extends object = {}>(
  defaultFactory?: () => T,
): ComponentConstructor<T> {
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

    static getDefaultFactory(): (() => T) | undefined {
      return defaultFactory;
    }
  }

  return ComponentClass;
}

function hasComponentMarker(value: object): value is { __componentType: symbol } {
  return "__componentType" in value;
}

export function isComponent<T extends object>(
  value: object | null | undefined,
  componentConstructor: ComponentConstructor<T>,
): value is Component<T> {
  if (typeof value !== "object" || value === null) return false;
  if (!hasComponentMarker(value)) return false;
  return value.__componentType === componentConstructor.__componentType;
}
