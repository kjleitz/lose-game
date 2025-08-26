export { World } from "./World.js";
export { Entity } from "./Entity.js";
export { defineComponent, isComponent } from "./Component.js";
export { defineSystem } from "./System.js";

export type {
  EntityId,
  Component,
  ComponentData,
  ComponentConstructor,
  EntityComponents,
  SystemDefinition,
  System,
  EntityBuilder,
  ComponentMap,
  ComponentDataMap,
  QueryResultNamed,
  QueryResultNamedWithOptional,
} from "./types.js";
