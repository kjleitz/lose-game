import { describe, it, expectTypeOf } from "vitest";
import type { StringKeyValueBackend } from "..";

class DummyBackend implements StringKeyValueBackend {
  private store = new Map<string, string>();
  get(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) ?? null) : null;
  }
  set(key: string, value: string): void {
    this.store.set(key, value);
  }
  remove(key: string): void {
    this.store.delete(key);
  }
  keys(): string[] {
    return Array.from(this.store.keys());
  }
}

describe("StringKeyValueBackend interface", () => {
  it("DummyBackend conforms to the interface shape", () => {
    const backend = new DummyBackend();
    // Type-level assertion: DummyBackend matches StringKeyValueBackend
    expectTypeOf(backend).toMatchTypeOf<StringKeyValueBackend>();
  });
});
