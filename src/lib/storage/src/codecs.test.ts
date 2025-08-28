import { describe, it, expect } from "vitest";
import { createJsonCodec, numberCodec, booleanCodec, stringCodec } from "..";

describe("storage/codecs", () => {
  it("json codec roundtrips values and throws on invalid", () => {
    const numC = createJsonCodec<number>((u) => {
      if (typeof u === "number") return u;
      throw new Error("not number");
    });
    const raw = numC.encode(5);
    expect(typeof raw).toBe("string");
    expect(numC.decode(raw)).toBe(5);
    expect(() => numC.decode('"x"')).toThrow();
  });

  it("extra codecs validate input types", () => {
    expect(numberCodec.encode(3)).toBe("3");
    expect(numberCodec.decode("3")).toBe(3);
    expect(() => numberCodec.decode("NaN")).toThrow();
    expect(() => numberCodec.decode("Infinity")).toThrow();

    expect(booleanCodec.encode(true)).toBe("true");
    expect(booleanCodec.decode("false")).toBe(false);

    expect(stringCodec.encode("hi")).toBe('"hi"');
    expect(stringCodec.decode('"hi"')).toBe("hi");
    expect(() => stringCodec.decode("3")).toThrow();
  });
});
