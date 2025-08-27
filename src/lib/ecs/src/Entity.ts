import type { EntityId, ComponentConstructor, EntityBuilder } from "./types.js";
import type { World } from "./World.js";

export class Entity implements EntityBuilder {
  public readonly id: EntityId;
  private world: World;

  constructor(id: EntityId, world: World) {
    this.id = id;
    this.world = world;
  }

  addComponent<T extends object>(
    componentConstructor: ComponentConstructor<T>,
    data?: T,
  ): EntityBuilder {
    let componentData: T;

    if (data !== undefined) {
      componentData = data;
    } else {
      const factory = componentConstructor.getDefaultFactory();
      if (factory) {
        componentData = factory();
      } else {
        throw new Error(`No data provided for component and no default factory defined`);
      }
    }

    const component = componentConstructor.create(componentData);
    this.world.addComponentToEntity(this.id, componentConstructor, component);

    return this;
  }

  hasComponent<T extends object>(componentConstructor: ComponentConstructor<T>): boolean {
    return this.world.hasComponent(this.id, componentConstructor);
  }

  getComponent<T extends object>(componentConstructor: ComponentConstructor<T>): T | undefined {
    const component = this.world.getComponent(this.id, componentConstructor);
    return component?.__data;
  }

  removeComponent<T extends object>(componentConstructor: ComponentConstructor<T>): EntityBuilder {
    this.world.removeComponentFromEntity(this.id, componentConstructor);
    return this;
  }
}
