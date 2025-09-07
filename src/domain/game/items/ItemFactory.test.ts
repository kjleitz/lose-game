import { describe, it, expect, beforeEach } from "vitest";
import { ItemFactory } from "./ItemFactory";
import { ItemQuality, BaseItemType } from "./Item";

describe("ItemFactory (new catalog)", () => {
  let factory: ItemFactory;

  beforeEach(() => {
    factory = new ItemFactory();
  });

  it("creates basic items from new templates", () => {
    const pistol = factory.createItem("gun_pistol");
    expect(pistol.id).toBeDefined();
    expect(pistol.type).toBe("gun_pistol");
    expect(pistol.baseType).toBe(BaseItemType.WEAPON);
    expect(pistol.name).toBe("Pistol");
    expect(pistol.implemented).toBe(false);
    expect(pistol.metadata.icon).toBeDefined();
  });

  it("applies quality modifiers to value and name", () => {
    const base = factory.createItem("gun_pistol", ItemQuality.COMMON);
    const excellent = factory.createItem("gun_pistol", ItemQuality.EXCELLENT);
    expect(excellent.properties.quality).toBe(ItemQuality.EXCELLENT);
    expect(excellent.name).toBe("Superior Pistol");
    expect(excellent.stats.value).toBeCloseTo((base.stats.value ?? 0) * 1.25);
  });

  it("throws for unknown template", () => {
    expect(() => factory.createItem("unknown_item")).toThrow();
  });
});
