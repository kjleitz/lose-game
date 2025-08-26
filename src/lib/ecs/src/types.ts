export type EntityId = number;

export interface Component<T> {
  readonly __componentType: symbol;
  readonly __data: T;
}

export type ComponentData<C extends Component<unknown>> = C extends Component<infer T> ? T : never;

// Constructor/descriptor used to create components and identify their type
export type ComponentConstructor<T> = {
  readonly __componentType: symbol;
  create(data: T): Component<T>;
  defaultFactory?: () => T;
};

export interface EntityComponents {
  [key: symbol]: Component<unknown>;
}

// Named-object query typing
export type ComponentMap = Record<string, ComponentConstructor<unknown>>;

export type ComponentDataMap<M extends ComponentMap> = {
  [K in keyof M]: M[K] extends ComponentConstructor<infer U> ? U : never;
};

export interface QueryResultNamed<M extends ComponentMap> {
  entity: EntityId;
  components: ComponentDataMap<M>;
}

export type QueryResultNamedWithOptional<M extends ComponentMap, O extends ComponentMap> = {
  entity: EntityId;
  components: ComponentDataMap<M> & {
    [K in keyof O]?: O[K] extends ComponentConstructor<infer U> ? U : never;
  };
};

export interface SystemDefinition<M extends ComponentMap, O extends ComponentMap = {}> {
  withComponents<U extends ComponentMap>(components: U): SystemDefinition<U, O>;
  withOptionalComponents<U extends ComponentMap>(components: U): SystemDefinition<M, U>;
  execute(fn: (entities: QueryResultNamedWithOptional<M, O>[]) => void): System<M, O>;
}

export interface System<
  M extends ComponentMap = ComponentMap,
  O extends ComponentMap = ComponentMap,
> {
  run(): void;
  getEntities(): QueryResultNamedWithOptional<M, O>[];
}

export interface EntityBuilder {
  readonly id: EntityId;
  addComponent<T>(componentConstructor: ComponentConstructor<T>, data?: T): EntityBuilder;
  hasComponent<T>(componentConstructor: ComponentConstructor<T>): boolean;
  getComponent<T>(componentConstructor: ComponentConstructor<T>): T | undefined;
  removeComponent<T>(componentConstructor: ComponentConstructor<T>): EntityBuilder;
}
