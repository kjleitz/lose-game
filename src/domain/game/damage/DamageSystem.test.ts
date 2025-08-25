import { describe, it, expect, beforeEach } from "vitest";
import { DamageSystem, DropService } from "./DamageSystem";
import {
  BaseDamageableEntity,
  DamageType,
  type DamageEvent,
  type HealthComponent,
  type DropTable,
} from "./DamageableEntity";

class TestDamageableEntity extends BaseDamageableEntity {
  onDestruction(): void {
    // Test implementation - no specific destruction logic needed
  }
}

describe("DamageSystem", () => {
  let damageSystem: DamageSystem;
  let dropService: DropService;
  let testEntity: TestDamageableEntity;

  beforeEach(() => {
    damageSystem = new DamageSystem();
    dropService = new DropService();

    const health: HealthComponent = {
      maxHealth: 100,
      currentHealth: 100,
      resistances: new Map([[DamageType.FIRE, 0.5]]), // 50% fire resistance
      vulnerabilities: new Map([[DamageType.COLD, 1.5]]), // 50% more cold damage
      regeneration: 0,
      invulnerabilityPeriod: 0,
      lastDamageTime: 0,
    };

    const dropTable: DropTable = {
      guaranteed: [{ itemType: "wood", minQuantity: 1, maxQuantity: 3, probability: 1.0 }],
      possible: [{ itemType: "seeds", minQuantity: 1, maxQuantity: 2, probability: 0.5 }],
      rare: [{ itemType: "rare_wood", minQuantity: 1, maxQuantity: 1, probability: 0.1 }],
      modifiers: [],
    };

    testEntity = new TestDamageableEntity("test-1", { x: 0, y: 0 }, health, dropTable);
  });

  describe("damage calculation", () => {
    it("should apply basic damage correctly", () => {
      const damage: DamageEvent = {
        amount: 30,
        type: DamageType.PHYSICAL,
        source: { entityId: "player", sourceType: "player" },
        position: { x: 0, y: 0 },
        direction: { x: 1, y: 0 },
        critical: false,
      };

      const result = damageSystem.processDamage(testEntity, damage);

      expect(result.damageDealt).toBe(30);
      expect(result.killed).toBe(false);
      expect(testEntity.health.currentHealth).toBe(70);
    });

    it("should apply fire resistance correctly", () => {
      const damage: DamageEvent = {
        amount: 40,
        type: DamageType.FIRE,
        source: { entityId: "player", sourceType: "player" },
        position: { x: 0, y: 0 },
        direction: { x: 1, y: 0 },
        critical: false,
      };

      const result = damageSystem.processDamage(testEntity, damage);

      // With 50% fire resistance, should take 20 damage instead of 40
      expect(result.damageDealt).toBe(20);
      expect(testEntity.health.currentHealth).toBe(80);
    });

    it("should apply cold vulnerability correctly", () => {
      const damage: DamageEvent = {
        amount: 20,
        type: DamageType.COLD,
        source: { entityId: "player", sourceType: "player" },
        position: { x: 0, y: 0 },
        direction: { x: 1, y: 0 },
        critical: false,
      };

      const result = damageSystem.processDamage(testEntity, damage);

      // With 50% cold vulnerability, should take 30 damage instead of 20
      expect(result.damageDealt).toBe(30);
      expect(testEntity.health.currentHealth).toBe(70);
    });

    it("should apply critical hit bonus", () => {
      const damage: DamageEvent = {
        amount: 20,
        type: DamageType.PHYSICAL,
        source: { entityId: "player", sourceType: "player" },
        position: { x: 0, y: 0 },
        direction: { x: 1, y: 0 },
        critical: true,
      };

      const result = damageSystem.processDamage(testEntity, damage);

      // Critical hits do 50% bonus damage: 20 * 1.5 = 30
      expect(result.damageDealt).toBe(30);
      expect(testEntity.health.currentHealth).toBe(70);
    });

    it("should handle entity death", () => {
      const damage: DamageEvent = {
        amount: 150, // More than entity's health
        type: DamageType.PHYSICAL,
        source: { entityId: "player", sourceType: "player" },
        position: { x: 0, y: 0 },
        direction: { x: 1, y: 0 },
        critical: false,
      };

      const result = damageSystem.processDamage(testEntity, damage);

      expect(result.killed).toBe(true);
      expect(testEntity.health.currentHealth).toBe(0);
    });
  });

  describe("drop calculation", () => {
    it("should generate guaranteed drops", () => {
      const killingBlow: DamageEvent = {
        amount: 100,
        type: DamageType.PHYSICAL,
        source: { entityId: "player", sourceType: "player" },
        position: { x: 0, y: 0 },
        direction: { x: 1, y: 0 },
        critical: false,
      };

      const drops = dropService.calculateDrops(testEntity, killingBlow);

      // Should always get wood (guaranteed drop)
      const woodDrop = drops.find((drop) => drop.itemType === "wood");
      expect(woodDrop).toBeDefined();
      expect(woodDrop!.quantity).toBeGreaterThanOrEqual(1);
      expect(woodDrop!.quantity).toBeLessThanOrEqual(3);
    });

    it("should respect drop probabilities", () => {
      const killingBlow: DamageEvent = {
        amount: 100,
        type: DamageType.PHYSICAL,
        source: { entityId: "player", sourceType: "player" },
        position: { x: 0, y: 0 },
        direction: { x: 1, y: 0 },
        critical: false,
      };

      // Run multiple times to check probability
      let seedDropCount = 0;
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const entity = new TestDamageableEntity(
          `test-${i}`,
          { x: 0, y: 0 },
          testEntity.health,
          testEntity.dropTable,
        );
        const drops = dropService.calculateDrops(entity, killingBlow);
        if (drops.some((drop) => drop.itemType === "seeds")) {
          seedDropCount++;
        }
      }

      // With 50% probability, expect roughly half to have seeds
      // Allow some variance (30-70% range)
      expect(seedDropCount).toBeGreaterThan(30);
      expect(seedDropCount).toBeLessThan(70);
    });
  });

  describe("visual damage states", () => {
    it("should report correct damage states", () => {
      expect(testEntity.getVisualDamageState()).toBe("pristine");

      testEntity.health.currentHealth = 70;
      expect(testEntity.getVisualDamageState()).toBe("light");

      testEntity.health.currentHealth = 50;
      expect(testEntity.getVisualDamageState()).toBe("damaged");

      testEntity.health.currentHealth = 30;
      expect(testEntity.getVisualDamageState()).toBe("heavy");

      testEntity.health.currentHealth = 10;
      expect(testEntity.getVisualDamageState()).toBe("critical");

      testEntity.health.currentHealth = 0;
      expect(testEntity.getVisualDamageState()).toBe("destroyed");
    });
  });
});