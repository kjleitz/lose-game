# Damageable Entities System Design

## Overview

The damageable entities system provides a unified framework for objects that can take damage, be destroyed, and drop resources. This includes flora, fauna, structures, and potentially player-built objects. The system emphasizes modularity, clear damage mechanics, and realistic resource drops.

## Core Requirements

- **Unified damage system**: Consistent mechanics across all damageable objects
- **Health management**: Hit points, damage types, resistances, and vulnerabilities
- **Destruction mechanics**: Visual feedback, destruction animations, debris
- **Resource drops**: Realistic items based on what was destroyed
- **Damage sources**: Player actions, environmental hazards, creature attacks
- **Visual feedback**: Damage indicators, health visualization, destruction effects

## Domain Model

### Base Damageable Entity

```typescript
abstract class DamageableEntity {
  readonly id: EntityId;
  readonly position: Point;
  readonly health: HealthComponent;
  readonly dropTable: DropTable;
  readonly destructionEffect: DestructionEffect;

  abstract takeDamage(damage: DamageEvent): DamageResult;
  abstract onDestruction(): void;
  abstract getVisualDamageState(): DamageVisualState;
}

interface HealthComponent {
  readonly maxHealth: number;
  readonly currentHealth: number;
  readonly resistances: Map<DamageType, number>; // 0-1, reduction factor
  readonly vulnerabilities: Map<DamageType, number>; // >1, amplification factor
  readonly regeneration: number; // health per second
  readonly invulnerabilityPeriod: number; // ms after taking damage
}
```

### Damage System

```typescript
enum DamageType {
  PHYSICAL = "physical", // cutting, crushing, piercing
  FIRE = "fire", // burning, heat
  COLD = "cold", // freezing, ice
  ENERGY = "energy", // lasers, electricity
  CHEMICAL = "chemical", // poison, acid
  EXPLOSIVE = "explosive", // blast damage
  ENVIRONMENTAL = "environmental", // falling, drowning
}

interface DamageEvent {
  readonly amount: number;
  readonly type: DamageType;
  readonly source: DamageSource;
  readonly position: Point; // impact location
  readonly direction: Vector; // knockback direction
  readonly critical: boolean; // critical hit
}

interface DamageSource {
  readonly entityId: EntityId;
  readonly sourceType: "player" | "creature" | "environment" | "trap";
  readonly weaponType?: WeaponType;
}

interface DamageResult {
  readonly damageDealt: number;
  readonly blocked: number;
  readonly killed: boolean;
  readonly effects: StatusEffect[];
  readonly knockback: Vector;
}
```

### Resource Drops

```typescript
interface DropTable {
  readonly guaranteed: DropEntry[];
  readonly possible: DropEntry[];
  readonly rare: DropEntry[];
  readonly modifiers: DropModifier[];
}

interface DropEntry {
  readonly itemType: ItemType;
  readonly minQuantity: number;
  readonly maxQuantity: number;
  readonly probability: number; // 0-1
  readonly condition?: DropCondition;
}

interface DropCondition {
  readonly damageType?: DamageType; // must be killed with specific damage
  readonly tool?: ItemType; // must use specific tool
  readonly skill?: number; // minimum skill level required
}

interface DropModifier {
  readonly type: "tool_bonus" | "skill_bonus" | "damage_type_bonus";
  readonly condition: any;
  readonly multiplier: number;
}
```

## System Architecture

### Domain Layer (`src/domain/game/damage/`)

```
damage/
├── DamageableEntity.ts     # Base class for all damageable objects
├── HealthComponent.ts      # Health and resistance logic
├── DamageSystem.ts         # Central damage processing
├── DropTable.ts           # Resource drop calculations
├── DamageTypes.ts         # Damage type definitions
├── DestructionEffect.ts   # Visual destruction effects
└── services/
    ├── DamageService.ts   # Damage event processing
    ├── HealthService.ts   # Health management
    └── DropService.ts     # Drop calculation and spawning
```

### Component Layer (`src/domain/game/components/`)

```
components/
├── HealthComponent.ts      # Health and status tracking
├── DamageComponent.ts      # Damage processing logic
├── DropComponent.ts        # Resource drop configuration
├── ResistanceComponent.ts  # Damage resistances
└── RegenerationComponent.ts # Health regeneration
```

### Rendering Layer (`src/domain/render/damage/`)

```
damage/
├── DamageIndicatorRenderer.ts  # Floating damage numbers
├── HealthBarRenderer.ts        # Health visualization
├── DestructionRenderer.ts      # Destruction animations
└── StatusEffectRenderer.ts     # Visual status indicators
```

## Implementation Details

### Damage Processing

```typescript
class DamageSystem {
  processDamage(target: DamageableEntity, damage: DamageEvent): DamageResult {
    // 1. Check invulnerability
    if (this.isInvulnerable(target)) {
      return this.createNoDamageResult();
    }

    // 2. Calculate base damage
    let finalDamage = damage.amount;

    // 3. Apply resistances/vulnerabilities
    const resistance = target.health.resistances.get(damage.type) || 0;
    const vulnerability = target.health.vulnerabilities.get(damage.type) || 1;
    finalDamage = finalDamage * (1 - resistance) * vulnerability;

    // 4. Apply critical hit multiplier
    if (damage.critical) {
      finalDamage *= this.getCriticalMultiplier(damage.source);
    }

    // 5. Calculate knockback
    const knockback = this.calculateKnockback(target, damage);

    // 6. Apply damage
    const newHealth = Math.max(0, target.health.currentHealth - finalDamage);
    const killed = newHealth === 0;

    // 7. Update entity state
    this.updateHealth(target, newHealth);

    // 8. Handle destruction
    if (killed) {
      this.handleDestruction(target, damage);
    }

    return {
      damageDealt: finalDamage,
      blocked: Math.max(0, damage.amount - finalDamage),
      killed,
      effects: this.calculateStatusEffects(target, damage),
      knockback,
    };
  }
}
```

### Drop Calculation

```typescript
class DropService {
  calculateDrops(entity: DamageableEntity, killingBlow: DamageEvent): ItemDrop[] {
    const drops: ItemDrop[] = [];

    // Guaranteed drops
    for (const entry of entity.dropTable.guaranteed) {
      if (this.meetsCondition(entry.condition, killingBlow)) {
        const quantity = this.rollQuantity(entry.minQuantity, entry.maxQuantity);
        drops.push({ itemType: entry.itemType, quantity, position: entity.position });
      }
    }

    // Possible drops (probability-based)
    for (const entry of entity.dropTable.possible) {
      if (Math.random() < entry.probability && this.meetsCondition(entry.condition, killingBlow)) {
        const quantity = this.rollQuantity(entry.minQuantity, entry.maxQuantity);
        drops.push({ itemType: entry.itemType, quantity, position: entity.position });
      }
    }

    // Apply modifiers
    return this.applyDropModifiers(drops, entity.dropTable.modifiers, killingBlow);
  }

  private applyDropModifiers(
    drops: ItemDrop[],
    modifiers: DropModifier[],
    killingBlow: DamageEvent,
  ): ItemDrop[] {
    for (const modifier of modifiers) {
      switch (modifier.type) {
        case "tool_bonus":
          if (this.usedTool(killingBlow, modifier.condition)) {
            drops.forEach(
              (drop) => (drop.quantity = Math.floor(drop.quantity * modifier.multiplier)),
            );
          }
          break;
        // ... other modifier types
      }
    }
    return drops;
  }
}
```

### Visual Damage States

```typescript
enum DamageVisualState {
  PRISTINE = "pristine", // 100-80% health
  LIGHTLY_DAMAGED = "light", // 80-60% health
  DAMAGED = "damaged", // 60-40% health
  HEAVILY_DAMAGED = "heavy", // 40-20% health
  CRITICAL = "critical", // 20-1% health
  DESTROYED = "destroyed", // 0% health
}

class DamageableEntity {
  getVisualDamageState(): DamageVisualState {
    const healthPercent = this.health.currentHealth / this.health.maxHealth;

    if (healthPercent >= 0.8) return DamageVisualState.PRISTINE;
    if (healthPercent >= 0.6) return DamageVisualState.LIGHTLY_DAMAGED;
    if (healthPercent >= 0.4) return DamageVisualState.DAMAGED;
    if (healthPercent >= 0.2) return DamageVisualState.HEAVILY_DAMAGED;
    if (healthPercent > 0) return DamageVisualState.CRITICAL;
    return DamageVisualState.DESTROYED;
  }
}
```

## Entity Type Specializations

### Flora Damage Characteristics

```typescript
class FloraEntity extends DamageableEntity {
  constructor(species: FloraSpecies) {
    super();

    // Flora typically has:
    this.health = {
      maxHealth: species.baseHealth,
      resistances: new Map([
        [DamageType.FIRE, 0.9], // very vulnerable to fire
        [DamageType.COLD, 0.3], // somewhat resistant to cold
        [DamageType.PHYSICAL, 0.1], // slight resistance to cutting
      ]),
      vulnerabilities: new Map([
        [DamageType.FIRE, 2.5],
        [DamageType.CHEMICAL, 1.5], // herbicides
      ]),
    };

    // Flora drops: wood, fiber, seeds, fruits
    this.dropTable = {
      guaranteed: [{ itemType: "wood", minQuantity: 1, maxQuantity: 3, probability: 1.0 }],
      possible: [
        { itemType: "seeds", minQuantity: 1, maxQuantity: 2, probability: 0.3 },
        {
          itemType: species.fruit,
          minQuantity: 1,
          maxQuantity: 1,
          probability: species.fruitProbability,
        },
      ],
    };
  }
}
```

### Fauna Damage Characteristics

```typescript
class FaunaEntity extends DamageableEntity {
  constructor(species: FaunaSpecies) {
    super();

    // Fauna has more complex damage resistances
    this.health = {
      maxHealth: species.baseHealth,
      resistances: new Map([
        [DamageType.PHYSICAL, species.armor], // based on creature armor
        [DamageType.COLD, species.coldResistance],
        [DamageType.FIRE, species.fireResistance],
      ]),
      regeneration: species.regenerationRate,
    };

    // Fauna drops: meat, hide, bones, special materials
    this.dropTable = {
      guaranteed: [
        { itemType: "meat", minQuantity: 1, maxQuantity: species.meatYield, probability: 1.0 },
      ],
      possible: [
        { itemType: "hide", minQuantity: 1, maxQuantity: 1, probability: 0.8 },
        { itemType: "bones", minQuantity: 1, maxQuantity: 2, probability: 0.6 },
        {
          itemType: species.specialDrop,
          minQuantity: 1,
          maxQuantity: 1,
          probability: species.specialDropRate,
        },
      ],
    };
  }
}
```

## Integration Points

### With Combat System

```typescript
interface WeaponAttack {
  readonly damage: number;
  readonly damageType: DamageType;
  readonly criticalChance: number;
  readonly knockback: number;
  readonly statusEffects: StatusEffect[];
}

class CombatSystem {
  executeAttack(attacker: Entity, target: DamageableEntity, weapon: WeaponAttack): void {
    const damageEvent: DamageEvent = {
      amount: weapon.damage,
      type: weapon.damageType,
      source: { entityId: attacker.id, sourceType: "player" },
      critical: Math.random() < weapon.criticalChance,
      position: target.position,
      direction: Vector.fromTo(attacker.position, target.position),
    };

    const result = this.damageSystem.processDamage(target, damageEvent);

    if (result.killed) {
      const drops = this.dropService.calculateDrops(target, damageEvent);
      this.spawnItems(drops);
    }
  }
}
```

### With Item System

```typescript
interface ItemDrop {
  readonly itemType: ItemType;
  readonly quantity: number;
  readonly position: Point;
  readonly condition?: ItemCondition; // freshness, quality, etc.
}

class ItemSpawner {
  spawnFromDestruction(drops: ItemDrop[]): void {
    for (const drop of drops) {
      const item = this.itemFactory.create(drop.itemType, drop.quantity);
      item.condition = drop.condition;

      // Scatter items around destruction point
      const scatterPosition = this.scatterPosition(drop.position);
      this.world.addItem(item, scatterPosition);
    }
  }
}
```

### With Tools and Harvesting

```typescript
enum ToolEffectiveness {
  INEFFECTIVE = 0.5, // wrong tool, reduced yield
  NORMAL = 1.0, // bare hands or basic tool
  EFFECTIVE = 1.5, // right tool for the job
  EXPERT = 2.0, // high-quality specialized tool
}

class HarvestingSystem {
  getToolEffectiveness(tool: ItemType, target: DamageableEntity): ToolEffectiveness {
    if (target instanceof FloraEntity) {
      if (tool === "axe" && target.species.woody) return ToolEffectiveness.EFFECTIVE;
      if (tool === "scythe" && target.species.fibrous) return ToolEffectiveness.EFFECTIVE;
    }

    if (target instanceof FaunaEntity) {
      if (tool === "knife" || tool === "hunting_knife") return ToolEffectiveness.EFFECTIVE;
    }

    return ToolEffectiveness.NORMAL;
  }
}
```

## Performance Considerations

### Entity Pooling

```typescript
class DamageableEntityPool {
  private pools: Map<string, DamageableEntity[]> = new Map();

  acquire<T extends DamageableEntity>(type: new () => T): T {
    const pool = this.pools.get(type.name) || [];
    return (pool.pop() as T) || new type();
  }

  release(entity: DamageableEntity): void {
    entity.reset(); // reset to default state
    const pool = this.pools.get(entity.constructor.name) || [];
    pool.push(entity);
    this.pools.set(entity.constructor.name, pool);
  }
}
```

### Damage Event Batching

```typescript
class DamageEventProcessor {
  private pendingDamage: Map<EntityId, DamageEvent[]> = new Map();

  addDamage(target: EntityId, damage: DamageEvent): void {
    const pending = this.pendingDamage.get(target) || [];
    pending.push(damage);
    this.pendingDamage.set(target, pending);
  }

  processBatch(): void {
    for (const [entityId, damages] of this.pendingDamage) {
      const entity = this.world.getEntity(entityId);
      if (entity) {
        // Combine multiple damage events for efficiency
        const combinedDamage = this.combineDamageEvents(damages);
        this.damageSystem.processDamage(entity, combinedDamage);
      }
    }
    this.pendingDamage.clear();
  }
}
```

## Testing Strategy

### Unit Tests

- **Damage Calculation**: Test resistance/vulnerability modifiers work correctly
- **Drop Calculation**: Verify drop tables produce expected results with proper randomization
- **Health Management**: Test health changes, regeneration, and death states
- **Critical Hits**: Ensure critical hit calculations are accurate

### Integration Tests

- **Tool Effectiveness**: Test that different tools provide appropriate bonuses
- **Status Effects**: Verify damage-over-time and other effects work correctly
- **Entity Interactions**: Test damage between different entity types
- **Resource Chain**: Test that destroyed entities spawn correct items

### Performance Tests

- **Batch Processing**: Benchmark damage processing with multiple simultaneous events
- **Memory Usage**: Monitor entity pool efficiency and memory consumption
- **Large Scale**: Test system performance with many damageable entities

## Success Metrics

- **Performance**: Process 100+ damage events per frame at 60fps
- **Memory Efficiency**: Entity pooling reduces garbage collection by 80%
- **Consistency**: All damage calculations are deterministic and predictable
- **Realism**: Resource drops feel appropriate for destroyed objects
- **Visual Feedback**: Players can clearly see entity health states and damage effects
