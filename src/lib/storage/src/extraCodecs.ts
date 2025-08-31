import { createJsonCodec, type Codec } from "./Codec";

export const numberCodec: Codec<number> = createJsonCodec<number>((unknownValue) => {
  if (typeof unknownValue !== "number" || !Number.isFinite(unknownValue)) {
    throw new Error("Expected finite number");
  }
  return unknownValue;
});

export const booleanCodec: Codec<boolean> = createJsonCodec<boolean>((unknownValue) => {
  if (typeof unknownValue !== "boolean") throw new Error("Expected boolean");
  return unknownValue;
});

export const stringCodec: Codec<string> = createJsonCodec<string>((unknownValue) => {
  if (typeof unknownValue !== "string") throw new Error("Expected string");
  return unknownValue;
});
