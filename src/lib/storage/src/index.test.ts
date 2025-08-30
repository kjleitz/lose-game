import { describe, it, expect } from "vitest";
import * as api from "..";

describe("storage index barrel", () => {
  it("exposes the expected exports", () => {
    expect(typeof api.createStore).toBe("function");
    expect(typeof api.detectBackend).toBe("function");
    expect(typeof api.createJsonCodec).toBe("function");
    expect(typeof api.numberCodec).toBe("object");
    expect(typeof api.booleanCodec).toBe("object");
    expect(typeof api.stringCodec).toBe("object");
    expect(typeof api.MemoryStorageBackend).toBe("function");
    expect(typeof api.LocalStorageBackend).toBe("function");
  });
});
