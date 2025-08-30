import { describe, it, expect } from "vitest";
import { createJsonCodec } from "..";

describe("Codec (createJsonCodec)", () => {
  it("roundtrips values and throws on invalid", () => {
    const numC = createJsonCodec<number>((u) => {
      if (typeof u === "number") return u;
      throw new Error("not number");
    });
    const raw = numC.encode(5);
    expect(typeof raw).toBe("string");
    expect(numC.decode(raw)).toBe(5);
    expect(() => numC.decode('"x"')).toThrow();
  });

  it("propagates parse/validation errors for custom codecs", () => {
    const arrayCodec = createJsonCodec<readonly number[]>((u) => {
      if (Array.isArray(u) && u.every((x) => typeof x === "number")) return u;
      throw new Error("Expected number[]");
    });
    const raw = arrayCodec.encode([1, 2, 3]);
    expect(raw).toBe("[1,2,3]");
    expect(arrayCodec.decode(raw)).toEqual([1, 2, 3]);
    expect(() => arrayCodec.decode("{}")).toThrow();
  });
});
