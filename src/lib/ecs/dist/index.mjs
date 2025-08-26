// src/Entity.ts
var Entity = class {
  constructor(id, world) {
    this.id = id;
    this.world = world;
  }
  addComponent(componentConstructor, data) {
    let componentData;
    if (data !== void 0) {
      componentData = data;
    } else if (componentConstructor.defaultFactory) {
      componentData = componentConstructor.defaultFactory();
    } else {
      throw new Error(
        `No data provided for component and no default factory defined`
      );
    }
    const component = componentConstructor.create(componentData);
    this.world.addComponentToEntity(this.id, componentConstructor, component);
    return this;
  }
  hasComponent(componentConstructor) {
    return this.world.hasComponent(this.id, componentConstructor);
  }
  getComponent(componentConstructor) {
    const component = this.world.getComponent(this.id, componentConstructor);
    return component?.__data;
  }
  removeComponent(componentConstructor) {
    this.world.removeComponentFromEntity(this.id, componentConstructor);
    return this;
  }
};

// src/World.ts
var World = class {
  nextEntityId = 1;
  entities = /* @__PURE__ */ new Set();
  components = /* @__PURE__ */ new Map();
  systems = [];
  // Named-object API removes the need for an untyped global query cache
  createEntity() {
    const id = this.nextEntityId++;
    this.entities.add(id);
    this.components.set(id, /* @__PURE__ */ new Map());
    return new Entity(id, this);
  }
  removeEntity(entityId) {
    if (!this.entities.has(entityId)) {
      return;
    }
    this.entities.delete(entityId);
    this.components.delete(entityId);
  }
  hasEntity(entityId) {
    return this.entities.has(entityId);
  }
  addComponentToEntity(entityId, componentConstructor, component) {
    if (!this.entities.has(entityId)) {
      throw new Error(`Entity ${entityId} does not exist`);
    }
    const entityComponents = this.components.get(entityId);
    entityComponents.set(componentConstructor.__componentType, component);
  }
  removeComponentFromEntity(entityId, componentConstructor) {
    const entityComponents = this.components.get(entityId);
    if (entityComponents) {
      entityComponents.delete(componentConstructor.__componentType);
    }
  }
  hasComponent(entityId, componentConstructor) {
    const entityComponents = this.components.get(entityId);
    return entityComponents?.has(componentConstructor.__componentType) ?? false;
  }
  getComponent(entityId, componentConstructor) {
    const entityComponents = this.components.get(entityId);
    return entityComponents?.get(componentConstructor.__componentType);
  }
  query(components) {
    const results = [];
    for (const entityId of this.entities) {
      const entityComponents = this.components.get(entityId);
      let hasAll = true;
      for (const key in components) {
        const ctor = components[key];
        if (!entityComponents.has(ctor.__componentType)) {
          hasAll = false;
          break;
        }
      }
      if (!hasAll) continue;
      const comps = {};
      for (const key in components) {
        const ctor = components[key];
        const comp = entityComponents.get(ctor.__componentType);
        comps[key] = comp.__data;
      }
      results.push({ entity: entityId, components: comps });
    }
    return results;
  }
  queryOptional(required, optional) {
    const results = [];
    for (const entityId of this.entities) {
      const entityComponents = this.components.get(entityId);
      let hasAll = true;
      for (const key in required) {
        const ctor = required[key];
        if (!entityComponents.has(ctor.__componentType)) {
          hasAll = false;
          break;
        }
      }
      if (!hasAll) continue;
      const comps = {};
      for (const key in required) {
        const ctor = required[key];
        const comp = entityComponents.get(ctor.__componentType);
        comps[key] = comp.__data;
      }
      for (const key in optional) {
        const ctor = optional[key];
        const comp = entityComponents.get(ctor.__componentType);
        if (comp) comps[key] = comp.__data;
      }
      results.push({ entity: entityId, components: comps });
    }
    return results;
  }
  addSystem(system) {
    this.systems.push(system);
  }
  runSystems() {
    for (const system of this.systems) {
      system.run();
    }
  }
  // Cache invalidation hook retained for future typed caches
  invalidateQueryCache() {
  }
};

// src/Component.ts
function defineComponent(defaultFactory) {
  const componentType = Symbol("component");
  class ComponentClass {
    __componentType = componentType;
    __data;
    constructor(data) {
      this.__data = data;
    }
    static __componentType = componentType;
    static create(data) {
      return new ComponentClass(data);
    }
    static get defaultFactory() {
      return defaultFactory;
    }
  }
  return ComponentClass;
}
function isComponent(value, componentConstructor) {
  return typeof value === "object" && value !== null && "__componentType" in value && value.__componentType === componentConstructor.__componentType;
}

// src/System.ts
function defineSystem(world) {
  return new SystemDefinitionImpl(world, {}, {});
}
var SystemDefinitionImpl = class _SystemDefinitionImpl {
  constructor(world, requiredComponents, optionalComponents) {
    this.world = world;
    this.requiredComponents = requiredComponents;
    this.optionalComponents = optionalComponents;
  }
  withComponents(components) {
    return new _SystemDefinitionImpl(this.world, components, this.optionalComponents);
  }
  withOptionalComponents(components) {
    return new _SystemDefinitionImpl(this.world, this.requiredComponents, components);
  }
  execute(fn) {
    return new SystemImpl(this.world, this.requiredComponents, this.optionalComponents, fn);
  }
};
var SystemImpl = class {
  constructor(world, requiredComponents, optionalComponents, executeFn) {
    this.world = world;
    this.requiredComponents = requiredComponents;
    this.optionalComponents = optionalComponents;
    this.executeFn = executeFn;
  }
  run() {
    const entities = this.getEntities();
    this.executeFn(entities);
  }
  getEntities() {
    return this.world.queryOptional(this.requiredComponents, this.optionalComponents);
  }
};
export {
  Entity,
  World,
  defineComponent,
  defineSystem,
  isComponent
};
