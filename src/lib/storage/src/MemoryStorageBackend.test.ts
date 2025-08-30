import { describe, it, expect } from "vitest";
import { MemoryStorageBackend } from "..";

describe("MemoryStorageBackend", () => {
  it("performs basic CRUD and key listing", () => {
    const mem = new MemoryStorageBackend();
    expect(mem.get("x")).toBeNull();
    mem.set("x", "1");
    expect(mem.get("x")).toBe("1");
    expect(mem.keys()).toEqual(["x"]);
    mem.remove("x");
    expect(mem.get("x")).toBeNull();
    expect(mem.keys()).toEqual([]);
  });
});
