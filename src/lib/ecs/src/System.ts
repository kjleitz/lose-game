import type {
  SystemDefinition,
  System,
  ComponentMap,
  QueryResultNamedWithOptional,
  ComponentConstructor,
} from "./types.js";
import type { World } from "./World.js";

export function defineSystem(world: World): SystemDefinition<ComponentMap> {
  const emptyMap: Record<string, ComponentConstructor<object>> = {};
  return new SystemDefinitionImpl(world, emptyMap, emptyMap);
}

class SystemDefinitionImpl<M extends ComponentMap, O extends ComponentMap>
  implements SystemDefinition<M, O>
{
  private world: World;
  private requiredComponents: M;
  private optionalComponents: O;

  constructor(world: World, requiredComponents: M, optionalComponents: O) {
    this.world = world;
    this.requiredComponents = requiredComponents;
    this.optionalComponents = optionalComponents;
  }

  withComponents<U extends ComponentMap>(components: U): SystemDefinition<U, O> {
    return new SystemDefinitionImpl(this.world, components, this.optionalComponents);
  }

  withOptionalComponents<U extends ComponentMap>(components: U): SystemDefinition<M, U> {
    return new SystemDefinitionImpl(this.world, this.requiredComponents, components);
  }

  execute(fn: (entities: QueryResultNamedWithOptional<M, O>[]) => void): System<M, O> {
    return new SystemImpl(this.world, this.requiredComponents, this.optionalComponents, fn);
  }
}

class SystemImpl<M extends ComponentMap, O extends ComponentMap> implements System<M, O> {
  private world: World;
  private requiredComponents: M;
  private optionalComponents: O;
  private executeFn: (entities: QueryResultNamedWithOptional<M, O>[]) => void;

  constructor(
    world: World,
    requiredComponents: M,
    optionalComponents: O,
    executeFn: (entities: QueryResultNamedWithOptional<M, O>[]) => void,
  ) {
    this.world = world;
    this.requiredComponents = requiredComponents;
    this.optionalComponents = optionalComponents;
    this.executeFn = executeFn;
  }

  run(): void {
    const entities = this.getEntities();
    this.executeFn(entities);
  }

  getEntities(): QueryResultNamedWithOptional<M, O>[] {
    return this.world.queryOptional(this.requiredComponents, this.optionalComponents);
  }
}
