type EntityId = number;
interface Component<T> {
    readonly __componentType: symbol;
    readonly __data: T;
}
type ComponentData<C extends Component<unknown>> = C extends Component<infer T> ? T : never;
type ComponentConstructor<T> = {
    readonly __componentType: symbol;
    create(data: T): Component<T>;
    defaultFactory?: () => T;
};
interface EntityComponents {
    [key: symbol]: Component<unknown>;
}
type ComponentMap = Record<string, ComponentConstructor<unknown>>;
type ComponentDataMap<M extends ComponentMap> = {
    [K in keyof M]: M[K] extends ComponentConstructor<infer U> ? U : never;
};
interface QueryResultNamed<M extends ComponentMap> {
    entity: EntityId;
    components: ComponentDataMap<M>;
}
type QueryResultNamedWithOptional<M extends ComponentMap, O extends ComponentMap> = {
    entity: EntityId;
    components: ComponentDataMap<M> & {
        [K in keyof O]?: O[K] extends ComponentConstructor<infer U> ? U : never;
    };
};
interface SystemDefinition<M extends ComponentMap, O extends ComponentMap = {}> {
    withComponents<U extends ComponentMap>(components: U): SystemDefinition<U, O>;
    withOptionalComponents<U extends ComponentMap>(components: U): SystemDefinition<M, U>;
    execute(fn: (entities: QueryResultNamedWithOptional<M, O>[]) => void): System<M, O>;
}
interface System<M extends ComponentMap = ComponentMap, O extends ComponentMap = ComponentMap> {
    run(): void;
    getEntities(): QueryResultNamedWithOptional<M, O>[];
}
interface EntityBuilder {
    readonly id: EntityId;
    addComponent<T>(componentConstructor: ComponentConstructor<T>, data?: T): EntityBuilder;
    hasComponent<T>(componentConstructor: ComponentConstructor<T>): boolean;
    getComponent<T>(componentConstructor: ComponentConstructor<T>): T | undefined;
    removeComponent<T>(componentConstructor: ComponentConstructor<T>): EntityBuilder;
}

declare class Entity implements EntityBuilder {
    readonly id: EntityId;
    private world;
    constructor(id: EntityId, world: World);
    addComponent<T>(componentConstructor: ComponentConstructor<T>, data?: T): EntityBuilder;
    hasComponent<T>(componentConstructor: ComponentConstructor<T>): boolean;
    getComponent<T>(componentConstructor: ComponentConstructor<T>): T | undefined;
    removeComponent<T>(componentConstructor: ComponentConstructor<T>): EntityBuilder;
}

declare class World {
    private nextEntityId;
    private entities;
    private components;
    private systems;
    createEntity(): Entity;
    removeEntity(entityId: EntityId): void;
    hasEntity(entityId: EntityId): boolean;
    addComponentToEntity<T>(entityId: EntityId, componentConstructor: ComponentConstructor<T>, component: Component<T>): void;
    removeComponentFromEntity<T>(entityId: EntityId, componentConstructor: ComponentConstructor<T>): void;
    hasComponent<T>(entityId: EntityId, componentConstructor: ComponentConstructor<T>): boolean;
    getComponent<T>(entityId: EntityId, componentConstructor: ComponentConstructor<T>): Component<T> | undefined;
    query<M extends ComponentMap>(components: M): QueryResultNamed<M>[];
    queryOptional<M extends ComponentMap, O extends ComponentMap>(required: M, optional: O): QueryResultNamedWithOptional<M, O>[];
    addSystem(system: System): void;
    runSystems(): void;
    private invalidateQueryCache;
}

declare function defineComponent<T = {}>(defaultFactory?: () => T): ComponentConstructor<T>;
declare function isComponent<T>(value: unknown, componentConstructor: ComponentConstructor<T>): value is Component<T>;

declare function defineSystem(world: World): SystemDefinition<{}>;

export { type Component, type ComponentConstructor, type ComponentData, type ComponentDataMap, type ComponentMap, Entity, type EntityBuilder, type EntityComponents, type EntityId, type QueryResultNamed, type QueryResultNamedWithOptional, type System, type SystemDefinition, World, defineComponent, defineSystem, isComponent };
