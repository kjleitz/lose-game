import type { Point2D } from "../../../shared/types/geometry";

export interface DamageableEntity {
  readonly id: string;
  readonly position: Point2D;
  health: HealthComponent;
  readonly dropTable: DropTable;
  readonly destructionEffect?: DestructionEffect;

  takeDamage(damage: DamageEvent): DamageResult;
  onDestruction(): void;
  getVisualDamageState(): DamageVisualState;
}

export interface HealthComponent {
  maxHealth: number;
  currentHealth: number;
  readonly resistances: Map<DamageType, number>; // 0-1, reduction factor
  readonly vulnerabilities: Map<DamageType, number>; // >1, amplification factor
  readonly regeneration: number; // health per second
  readonly invulnerabilityPeriod: number; // ms after taking damage
  lastDamageTime: number;
}

export const DamageType = {
  PHYSICAL: "physical", // cutting, crushing, piercing
  FIRE: "fire", // burning, heat
  COLD: "cold", // freezing, ice
  ENERGY: "energy", // lasers, electricity
  CHEMICAL: "chemical", // poison, acid
  EXPLOSIVE: "explosive", // blast damage
  ENVIRONMENTAL: "environmental", // falling, drowning
} as const;
export type DamageType = (typeof DamageType)[keyof typeof DamageType];

export interface DamageEvent {
  readonly amount: number;
  readonly type: DamageType;
  readonly source: DamageSource;
  readonly position: Point2D; // impact location
  readonly direction: Point2D; // knockback direction
  readonly critical: boolean; // critical hit
}

export interface DamageSource {
  readonly entityId: string;
  readonly sourceType: "player" | "creature" | "environment" | "trap";
  readonly weaponType?: string;
}

export interface DamageResult {
  readonly damageDealt: number;
  readonly blocked: number;
  readonly killed: boolean;
  readonly effects: StatusEffect[];
  readonly knockback: Point2D;
}

export interface StatusEffect {
  readonly type: string; // TODO: string literal union
  readonly duration: number;
  readonly intensity: number;
}

export interface DropTable {
  readonly guaranteed: DropEntry[];
  readonly possible: DropEntry[];
  readonly rare: DropEntry[];
  readonly modifiers: DropModifier[];
}

export interface DropEntry {
  readonly itemType: string; // TODO: string literal union
  readonly minQuantity: number;
  readonly maxQuantity: number;
  readonly probability: number; // 0-1
  readonly condition?: DropCondition;
}

export interface DropCondition {
  readonly damageType?: DamageType; // must be killed with specific damage
  readonly tool?: string; // must use specific tool; TODO: string literal union
  readonly skill?: number; // minimum skill level required
}

export interface ToolBonusModifier {
  readonly type: "tool_bonus";
  readonly condition: { tool: string }; // TODO: string literal union
  readonly multiplier: number;
}

export interface SkillBonusModifier {
  readonly type: "skill_bonus";
  readonly condition?: {
    skill: string; // TODO: string literal union
    minLevel?: number;
  };
  readonly multiplier: number;
}

export interface DamageTypeBonusModifier {
  readonly type: "damage_type_bonus";
  readonly condition: { damageType: DamageType };
  readonly multiplier: number;
}

export type DropModifier = ToolBonusModifier | SkillBonusModifier | DamageTypeBonusModifier;

export interface DestructionEffect {
  readonly particles: ParticleEffect[];
  readonly sound: string; // TODO: string literal union
  readonly duration: number;
}

export interface ParticleEffect {
  readonly type: string; // TODO: string literal union
  readonly count: number;
  readonly velocity: Point2D;
  readonly color: string; // TODO: named color type, maybe template literal
}

export const DamageVisualState = {
  PRISTINE: "pristine", // 100-80% health
  LIGHTLY_DAMAGED: "light", // 80-60% health
  DAMAGED: "damaged", // 60-40% health
  HEAVILY_DAMAGED: "heavy", // 40-20% health
  CRITICAL: "critical", // 20-1% health
  DESTROYED: "destroyed", // 0% health
} as const;
export type DamageVisualState = (typeof DamageVisualState)[keyof typeof DamageVisualState];

export abstract class BaseDamageableEntity implements DamageableEntity {
  readonly id: string;
  readonly position: Point2D;
  health: HealthComponent;
  readonly dropTable: DropTable;
  readonly destructionEffect?: DestructionEffect;

  constructor(
    id: string,
    position: Point2D,
    health: HealthComponent,
    dropTable: DropTable,
    destructionEffect?: DestructionEffect,
  ) {
    this.id = id;
    this.position = position;
    this.health = health;
    this.dropTable = dropTable;
    this.destructionEffect = destructionEffect;
  }

  takeDamage(damage: DamageEvent): DamageResult {
    // Check invulnerability
    const now = Date.now();
    if (now - this.health.lastDamageTime < this.health.invulnerabilityPeriod) {
      return {
        damageDealt: 0,
        blocked: damage.amount,
        killed: false,
        effects: [],
        knockback: { x: 0, y: 0 },
      };
    }

    // Calculate base damage
    let finalDamage = damage.amount;

    // Apply resistances/vulnerabilities
    const resistance = this.health.resistances.get(damage.type) ?? 0;
    const vulnerability = this.health.vulnerabilities.get(damage.type) ?? 1;
    finalDamage = finalDamage * (1 - resistance) * vulnerability;

    // Apply critical hit multiplier
    if (damage.critical === true) {
      finalDamage *= 1.5; // 50% bonus damage for crits
    }

    // Apply damage
    const damageDealt = Math.min(finalDamage, this.health.currentHealth);
    this.health.currentHealth = Math.max(0, this.health.currentHealth - finalDamage);
    this.health.lastDamageTime = now;

    // Calculate knockback
    const knockback = {
      x: damage.direction.x * (finalDamage * 0.1),
      y: damage.direction.y * (finalDamage * 0.1),
    };

    // Check if killed
    const killed = this.health.currentHealth === 0;
    if (killed) {
      this.onDestruction();
    }

    return {
      damageDealt,
      blocked: Math.max(0, damage.amount - finalDamage),
      killed,
      effects: [], // TODO: Implement status effects
      knockback,
    };
  }

  abstract onDestruction(): void;

  getVisualDamageState(): DamageVisualState {
    const healthPercent = this.health.currentHealth / this.health.maxHealth;

    if (healthPercent >= 0.8) return DamageVisualState.PRISTINE;
    if (healthPercent >= 0.6) return DamageVisualState.LIGHTLY_DAMAGED;
    if (healthPercent >= 0.4) return DamageVisualState.DAMAGED;
    if (healthPercent >= 0.2) return DamageVisualState.HEAVILY_DAMAGED;
    if (healthPercent > 0) return DamageVisualState.CRITICAL;
    return DamageVisualState.DESTROYED;
  }

  // Update method for regeneration
  update(dt: number): void {
    if (this.health.regeneration > 0 && this.health.currentHealth > 0) {
      const regenAmount = this.health.regeneration * dt;
      this.health.currentHealth = Math.min(
        this.health.maxHealth,
        this.health.currentHealth + regenAmount,
      );
    }
  }
}
