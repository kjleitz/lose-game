import { describe, it, expect, beforeEach } from "vitest";
import { createStore, createJsonCodec, detectBackend, MemoryStorageBackend, numberCodec } from "..";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
const objectCodec = createJsonCodec<{ a: number; b: string }>((u) => {
  if (isRecord(u)) {
    const a = u["a"];
    const b = u["b"];
    if (typeof a === "number" && typeof b === "string") return { a, b };
  }
  throw new Error("Expected { a: number; b: string }");
});

describe("storage/createStore", () => {
  beforeEach(() => {
    const backend = detectBackend();
    for (const k of backend.keys()) backend.remove(k);
  });

  it("sets, gets, and overwrites values", () => {
    const store = createStore<number>({
      namespace: "ns1",
      backend: detectBackend(),
      codec: numberCodec,
    });
    expect(store.get("x")).toBeNull();
    store.set("x", 1);
    expect(store.get("x")).toBe(1);
    store.set("x", 2);
    expect(store.get("x")).toBe(2);
  });

  it("remove and clear operate within the namespace", () => {
    const backend = detectBackend();
    const sA = createStore<number>({ namespace: "A", backend, codec: numberCodec });
    const sB = createStore<number>({ namespace: "B", backend, codec: numberCodec });
    sA.set("k1", 10);
    sA.set("k2", 20);
    sB.set("k1", 99);
    expect(new Set(sA.keys())).toEqual(new Set(["k1", "k2"]));
    sA.remove("k1");
    expect(sA.keys()).toEqual(["k2"]);
    sA.clear();
    expect(sA.keys()).toEqual([]);
    expect(sB.get("k1")).toBe(99);
  });

  it("keys returns only unprefixed namespace keys", () => {
    const backend = new MemoryStorageBackend();
    const store = createStore<number>({ namespace: "KNS", backend, codec: numberCodec });
    store.set("a", 1);
    store.set("b", 2);
    expect(new Set(store.keys())).toEqual(new Set(["a", "b"]));
  });

  it("get returns null on decode errors", () => {
    const backend = new MemoryStorageBackend();
    const store = createStore<number>({ namespace: "BAD", backend, codec: numberCodec });
    // Inject invalid raw value directly through the backend
    backend.set("BAD::bad", "not-json");
    expect(store.get("bad")).toBeNull();
  });

  it("getAll returns only successfully decoded entries", () => {
    const backend = new MemoryStorageBackend();
    const store = createStore<{ a: number; b: string }>({
      namespace: "ALL",
      backend,
      codec: objectCodec,
    });
    store.set("one", { a: 1, b: "x" });
    backend.set("ALL::bad", "not-json");
    store.set("two", { a: 2, b: "y" });
    const all = store.getAll();
    expect(Object.keys(all).sort()).toEqual(["one", "two"]);
    expect(all.one).toEqual({ a: 1, b: "x" });
    expect(all.two).toEqual({ a: 2, b: "y" });
  });

  it("does not collide with similar prefixes (APP vs APP2)", () => {
    const backend = new MemoryStorageBackend();
    const s1 = createStore<number>({ namespace: "APP", backend, codec: numberCodec });
    const s2 = createStore<number>({ namespace: "APP2", backend, codec: numberCodec });
    s1.set("k", 1);
    s2.set("k", 2);
    expect(s1.get("k")).toBe(1);
    expect(s2.get("k")).toBe(2);
    expect(new Set(s1.keys())).toEqual(new Set(["k"]));
    expect(new Set(s2.keys())).toEqual(new Set(["k"]));
  });

  it("remove on nonexistent key is a no-op and does not affect others", () => {
    const backend = new MemoryStorageBackend();
    const s = createStore<number>({ namespace: "APP", backend, codec: numberCodec });
    s.set("a", 1);
    s.remove("missing");
    expect(s.get("a")).toBe(1);
    expect(s.keys()).toEqual(["a"]);
  });

  it("clear on empty namespace is a no-op", () => {
    const backend = new MemoryStorageBackend();
    const s = createStore<number>({ namespace: "NSE", backend, codec: numberCodec });
    s.clear();
    expect(s.keys()).toEqual([]);
  });
});
