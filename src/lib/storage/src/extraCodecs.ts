import { createJsonCodec, type Codec } from "./Codec";

export const numberCodec: Codec<number> = createJsonCodec<number>((u) => {
  if (typeof u !== "number" || !Number.isFinite(u)) {
    throw new Error("Expected finite number");
  }
  return u;
});

export const booleanCodec: Codec<boolean> = createJsonCodec<boolean>((u) => {
  if (typeof u !== "boolean") throw new Error("Expected boolean");
  return u;
});

export const stringCodec: Codec<string> = createJsonCodec<string>((u) => {
  if (typeof u !== "string") throw new Error("Expected string");
  return u;
});
