import { describe, it, expect, beforeEach } from "vitest";
import { createStore } from "./createStore";
import { createJsonCodec } from "./Codec";
import { detectBackend } from "./detectBackend";
import { MemoryStorageBackend } from "./MemoryStorageBackend";

const numberCodec = createJsonCodec<number>((u) => {
  if (typeof u === "number") return u;
  throw new Error("Expected number");
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const objectCodec = createJsonCodec<{ a: number; b: string }>((u) => {
  if (!isRecord(u)) {
    throw new Error("Expected { a: number; b: string }");
  }
  const rec = u;
  const a = rec["a"];
  const b = rec["b"];
  if (typeof a === "number" && typeof b === "string") {
    return { a, b };
  }
  throw new Error("Expected { a: number; b: string }");
});

describe("storage/createStore", () => {
  beforeEach(() => {
    // Clean any previous keys in jsdom localStorage
    const backend = detectBackend();
    const keys = backend.keys();
    for (const k of keys) backend.remove(k);
  });

  it("sets and gets values", () => {
    const store = createStore<number>({
      namespace: "test_ns1",
      backend: detectBackend(),
      codec: numberCodec,
    });

    expect(store.get("x")).toBeNull();
    store.set("x", 42);
    expect(store.get("x")).toBe(42);
  });

  it("removes values and clears namespace", () => {
    const store = createStore<number>({
      namespace: "test_ns2",
      backend: detectBackend(),
      codec: numberCodec,
    });

    store.set("a", 1);
    store.set("b", 2);
    expect(store.keys().sort()).toEqual(["a", "b"]);
    store.remove("a");
    expect(store.keys()).toEqual(["b"]);
    store.clear();
    expect(store.keys()).toEqual([]);
  });

  it("isolates data by namespace", () => {
    const backend = detectBackend();
    const s1 = createStore<number>({ namespace: "nsA", backend, codec: numberCodec });
    const s2 = createStore<number>({ namespace: "nsB", backend, codec: numberCodec });

    s1.set("k", 7);
    s2.set("k", 9);
    expect(s1.get("k")).toBe(7);
    expect(s2.get("k")).toBe(9);
    expect(s1.keys()).toEqual(["k"]);
    s1.clear();
    expect(s1.get("k")).toBeNull();
    expect(s2.get("k")).toBe(9);
  });

  it("lists keys and returns all entries", () => {
    const store = createStore<{ a: number; b: string }>({
      namespace: "test_ns3",
      backend: detectBackend(),
      codec: objectCodec,
    });

    store.set("one", { a: 1, b: "x" });
    store.set("two", { a: 2, b: "y" });
    expect(new Set(store.keys())).toEqual(new Set(["one", "two"]));
    const all = store.getAll();
    expect(all.one).toEqual({ a: 1, b: "x" });
    expect(all.two).toEqual({ a: 2, b: "y" });
  });

  it("works with memory backend explicitly", () => {
    const mem = new MemoryStorageBackend();
    const store = createStore<number>({ namespace: "mem_ns", backend: mem, codec: numberCodec });
    store.set("n", 3);
    expect(store.get("n")).toBe(3);
    expect(store.keys()).toEqual(["n"]);
  });
});
