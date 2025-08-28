import { describe, expect, it } from "vitest";

import { defineComponent, isComponent } from "./Component";
import { World } from "./World";

describe("Component definitions and guards", () => {
  it("assigns distinct component types for distinct components", () => {
    const A = defineComponent<{ v: number }>();
    const B = defineComponent<{ v: number }>();

    // Different components must not collide by shape
    expect(A.__componentType).not.toBe(B.__componentType);
  });

  it("isComponent validates instances against their constructor", () => {
    const A = defineComponent<{ v: number }>();
    const B = defineComponent<{ v: number }>();

    const aInstance = A.create({ v: 1 });

    expect(isComponent(aInstance, A)).toBe(true);
    expect(isComponent(aInstance, B)).toBe(false);
    expect(isComponent({} as object, A)).toBe(false);
  });

  it("supports default factories when adding without data", () => {
    const Sprite = defineComponent<{ texture: string; scale: number }>(() => ({
      texture: "default.png",
      scale: 1,
    }));

    const world = new World();
    const e = world.createEntity().addComponent(Sprite);
    const sprite = e.getComponent(Sprite);
    expect(sprite).toEqual({ texture: "default.png", scale: 1 });
  });

  it("throws when adding without data and no default factory is defined", () => {
    const NoDefault = defineComponent<{ v: number }>();
    const world = new World();

    expect(() => {
      world.createEntity().addComponent(NoDefault);
    }).toThrowError(/No data provided/);
  });
});
