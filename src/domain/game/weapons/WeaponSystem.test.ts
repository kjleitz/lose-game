import { describe, it, expect, beforeEach } from "vitest";
import { WeaponSystem } from "./WeaponSystem";
import { Player } from "../player";
import { BaseDamageableEntity } from "../damage/DamageableEntity";

describe("WeaponSystem", () => {
  let weaponSystem: WeaponSystem;
  let player: Player;

  beforeEach(() => {
    weaponSystem = new WeaponSystem();
    player = new Player({ x: 0, y: 0, vx: 0, vy: 0, angle: 0 });
  });

  describe("basic functionality", () => {
    it("should create weapon system", () => {
      expect(weaponSystem).toBeDefined();
    });

    it("should provide equipped weapon", () => {
      const weapon = weaponSystem.getEquippedWeapon(player);
      expect(weapon).toBeDefined();
      expect(weapon?.name).toBe("Basic Plasma Pistol");
    });

    it("should fire weapon and create projectile", () => {
      const weapon = weaponSystem.getEquippedWeapon(player)!;
      const result = weaponSystem.fireWeapon(player, weapon, 100, 100);

      expect(result.success).toBe(true);
      expect(result.projectile).toBeDefined();
      expect(result.projectile?.damage).toBeGreaterThan(0);
    });

    it("should track projectiles", () => {
      const weapon = weaponSystem.getEquippedWeapon(player)!;
      weaponSystem.fireWeapon(player, weapon, 100, 100);

      const projectiles = weaponSystem.getAllProjectiles();
      expect(projectiles).toHaveLength(1);
    });

    it("should update projectile positions", () => {
      const weapon = weaponSystem.getEquippedWeapon(player)!;
      const result = weaponSystem.fireWeapon(player, weapon, 100, 0);
      
      const initialX = result.projectile!.x;
      weaponSystem.update(0.1, []);
      
      const projectiles = weaponSystem.getAllProjectiles();
      expect(projectiles[0].x).toBeGreaterThan(initialX);
    });

    it("should remove projectiles after max range", () => {
      const weapon = weaponSystem.getEquippedWeapon(player)!;
      weaponSystem.fireWeapon(player, weapon, 100, 0);
      
      // Simulate projectile traveling beyond max range
      weaponSystem.update(10, []); // Long time to exceed range
      
      const projectiles = weaponSystem.getAllProjectiles();
      expect(projectiles).toHaveLength(0);
    });
  });

  describe("damage dealing", () => {
    it("should damage entities on hit", () => {
      // Create a test damageable entity close to player
      const testEntity = new BaseDamageableEntity(
        "test",
        { x: 20, y: 0 },
        {
          maxHealth: 100,
          currentHealth: 100,
          resistances: new Map(),
          vulnerabilities: new Map(),
          regeneration: 0,
          invulnerabilityPeriod: 0,
          lastDamageTime: 0,
        },
        { guaranteed: [], possible: [], rare: [], modifiers: [] }
      );

      const weapon = weaponSystem.getEquippedWeapon(player)!;
      weaponSystem.fireWeapon(player, weapon, 20, 0); // Fire at close target
      
      const initialHealth = testEntity.health.currentHealth;
      
      // Run several update frames to ensure projectile hits
      for (let i = 0; i < 10; i++) {
        weaponSystem.update(0.01, [testEntity]);
      }
      
      expect(testEntity.health.currentHealth).toBeLessThan(initialHealth);
    });

    it("should remove projectiles on hit", () => {
      const testEntity = new BaseDamageableEntity(
        "test",
        { x: 20, y: 0 },
        {
          maxHealth: 100,
          currentHealth: 100,
          resistances: new Map(),
          vulnerabilities: new Map(),
          regeneration: 0,
          invulnerabilityPeriod: 0,
          lastDamageTime: 0,
        },
        { guaranteed: [], possible: [], rare: [], modifiers: [] }
      );

      const weapon = weaponSystem.getEquippedWeapon(player)!;
      weaponSystem.fireWeapon(player, weapon, 20, 0);
      
      expect(weaponSystem.getAllProjectiles()).toHaveLength(1);
      
      // Run several update frames to ensure projectile hits
      for (let i = 0; i < 10; i++) {
        weaponSystem.update(0.01, [testEntity]);
        if (weaponSystem.getAllProjectiles().length === 0) break;
      }
      
      expect(weaponSystem.getAllProjectiles()).toHaveLength(0);
    });
  });
});