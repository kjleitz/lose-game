export interface Codec<T> {
  encode(value: T): string;
  decode(raw: string): T;
}

function parseJson(text: string): unknown {
  // Contain JSON.parse's "any" to unknown by typing the wrapper.
  return JSON.parse(text);
}

export function createJsonCodec<T>(parse: (value: unknown) => T): Codec<T> {
  return {
    encode(value: T): string {
      return JSON.stringify(value);
    },
    decode(raw: string): T {
      const data = parseJson(raw);
      return parse(data);
    },
  };
}
