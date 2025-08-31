import type {
  EntityId,
  ComponentConstructor,
  Component,
  ComponentBase,
  System,
  ComponentMap,
  QueryResultNamed,
  QueryResultNamedWithOptional,
} from "./types.js";
import { Entity } from "./Entity.js";
import { isComponent } from "./Component.js";

function hasAllRequiredKeys<M extends ComponentMap>(
  obj: Record<string, object>,
  required: M,
): obj is QueryResultNamed<M>["components"] {
  for (const key in required) {
    if (!(key in obj)) return false;
  }
  return true;
}

function conformsToOptional<M extends ComponentMap, O extends ComponentMap>(
  obj: Record<string, object>,
  required: M,
  _optional: O,
): obj is QueryResultNamedWithOptional<M, O>["components"] {
  // We only need to ensure required keys exist; optional keys are by definition optional
  return hasAllRequiredKeys(obj, required);
}

export class World {
  private nextEntityId: EntityId = 1;
  private entities = new Set<EntityId>();
  private components = new Map<EntityId, Map<symbol, ComponentBase>>();
  private systems: System[] = [];
  // Named-object API removes the need for an untyped global query cache

  createEntity(): Entity {
    const id = this.nextEntityId++;
    this.entities.add(id);
    this.components.set(id, new Map());
    // Entity set changed; cached queries would be invalid
    return new Entity(id, this);
  }

  removeEntity(entityId: EntityId): void {
    if (!this.entities.has(entityId)) {
      return;
    }

    this.entities.delete(entityId);
    this.components.delete(entityId);
    // Entity removed; cached queries would be invalid
  }

  hasEntity(entityId: EntityId): boolean {
    return this.entities.has(entityId);
  }

  addComponentToEntity<T extends object>(
    entityId: EntityId,
    componentConstructor: ComponentConstructor<T>,
    component: Component<T>,
  ): void {
    if (!this.entities.has(entityId)) {
      throw new Error(`Entity ${entityId} does not exist`);
    }

    const entityComponents = this.components.get(entityId)!;
    entityComponents.set(componentConstructor.__componentType, component);
    // Components changed; cached queries would be invalid
  }

  removeComponentFromEntity<T extends object>(
    entityId: EntityId,
    componentConstructor: ComponentConstructor<T>,
  ): void {
    const entityComponents = this.components.get(entityId);
    if (entityComponents) {
      entityComponents.delete(componentConstructor.__componentType);
      // Components changed; cached queries would be invalid
    }
  }

  hasComponent<T extends object>(
    entityId: EntityId,
    componentConstructor: ComponentConstructor<T>,
  ): boolean {
    const entityComponents = this.components.get(entityId);
    return entityComponents?.has(componentConstructor.__componentType) ?? false;
  }

  getComponent<T extends object>(
    entityId: EntityId,
    componentConstructor: ComponentConstructor<T>,
  ): Component<T> | undefined {
    const entityComponents = this.components.get(entityId);
    const comp = entityComponents?.get(componentConstructor.__componentType);
    if (!comp) return undefined;
    return isComponent(comp, componentConstructor) ? comp : undefined;
  }

  query<M extends ComponentMap>(components: M): QueryResultNamed<M>[] {
    const results: QueryResultNamed<M>[] = [];

    for (const entityId of this.entities) {
      const entityComponents = this.components.get(entityId)!;

      // Ensure all required components exist on the entity
      let hasAll = true;
      for (const key in components) {
        const ctor = components[key];
        if (!entityComponents.has(ctor.__componentType)) {
          hasAll = false;
          break;
        }
      }
      if (!hasAll) continue;

      const comps: Record<string, object> = {};
      for (const key in components) {
        const ctor = components[key];
        const comp = entityComponents.get(ctor.__componentType)!;
        comps[key] = comp.__data;
      }

      // Dev-time audit: ensure keys match exactly the required component keys
      if (import.meta.env?.DEV) {
        const expected = Object.keys(components).sort();
        const actual = Object.keys(comps).sort();
        const sameLength = expected.length === actual.length;
        const sameKeys = sameLength && expected.every((k, i) => k === actual[i]);
        if (!sameKeys) {
          throw new Error(
            `World.query invariant violated for entity ${entityId}: expected keys [${expected.join(
              ", ",
            )}] but got [${actual.join(", ")}]`,
          );
        }
      }

      if (!hasAllRequiredKeys(comps, components)) {
        throw new Error("World.query produced incomplete component set");
      }
      results.push({ entity: entityId, components: comps });
    }

    return results;
  }

  queryOptional<M extends ComponentMap, O extends ComponentMap>(
    required: M,
    optional: O,
  ): QueryResultNamedWithOptional<M, O>[] {
    const results: QueryResultNamedWithOptional<M, O>[] = [];

    for (const entityId of this.entities) {
      const entityComponents = this.components.get(entityId)!;

      // Check required
      let hasAll = true;
      for (const key in required) {
        const ctor = required[key];
        if (!entityComponents.has(ctor.__componentType)) {
          hasAll = false;
          break;
        }
      }
      if (!hasAll) continue;

      const comps: Record<string, object> = {};

      for (const key in required) {
        const ctor = required[key];
        const comp = entityComponents.get(ctor.__componentType)!;
        comps[key] = comp.__data;
      }

      for (const key in optional) {
        const ctor = optional[key];
        const comp = entityComponents.get(ctor.__componentType);
        if (comp) comps[key] = comp.__data;
      }

      // Dev-time audit: expected = required + present optionals
      if (import.meta.env?.DEV) {
        const requiredKeys = Object.keys(required);
        const presentOptionalKeys: string[] = [];
        for (const key in optional) {
          const ctor = optional[key];
          if (entityComponents.has(ctor.__componentType)) presentOptionalKeys.push(key);
        }
        const expected = [...requiredKeys, ...presentOptionalKeys].sort();
        const actual = Object.keys(comps).sort();
        const sameLength = expected.length === actual.length;
        const sameKeys = sameLength && expected.every((k, i) => k === actual[i]);
        if (!sameKeys) {
          throw new Error(
            `World.queryOptional invariant violated for entity ${entityId}: expected keys [${expected.join(
              ", ",
            )}] but got [${actual.join(", ")}]`,
          );
        }
      }

      if (!conformsToOptional(comps, required, optional)) {
        throw new Error("World.queryOptional produced incomplete component set");
      }
      results.push({ entity: entityId, components: comps });
    }

    return results;
  }

  addSystem(system: System): void {
    this.systems.push(system);
  }

  runSystems(): void {
    for (const system of this.systems) {
      system.run();
    }
  }

  // Cache invalidation hook removed; no cache currently used
}
