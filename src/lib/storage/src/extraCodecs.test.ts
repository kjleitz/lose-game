import { describe, it, expect } from "vitest";
import { numberCodec, booleanCodec, stringCodec } from "..";

describe("extraCodecs", () => {
  it("numberCodec validates numeric JSON", () => {
    expect(numberCodec.encode(3)).toBe("3");
    expect(numberCodec.decode("3")).toBe(3);
    expect(() => numberCodec.decode("NaN")).toThrow();
    expect(() => numberCodec.decode("Infinity")).toThrow();
  });

  it("booleanCodec only accepts boolean JSON", () => {
    expect(booleanCodec.decode("true")).toBe(true);
    expect(booleanCodec.decode("false")).toBe(false);
    expect(() => booleanCodec.decode("1")).toThrow();
    expect(() => booleanCodec.decode("null")).toThrow();
    expect(() => booleanCodec.decode("{}")).toThrow();
  });

  it("stringCodec only accepts string JSON", () => {
    expect(stringCodec.encode("hi")).toBe('"hi"');
    expect(stringCodec.decode('"hi"')).toBe("hi");
    expect(() => stringCodec.decode("3")).toThrow();
    expect(() => stringCodec.decode("true")).toThrow();
    expect(() => stringCodec.decode("null")).toThrow();
  });
});
