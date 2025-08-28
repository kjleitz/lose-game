import type { StringKeyValueBackend } from "./StringKeyValueBackend";

export class MemoryStorageBackend implements StringKeyValueBackend {
  private readonly map: Map<string, string> = new Map();

  get(key: string): string | null {
    return this.map.has(key) ? (this.map.get(key) ?? null) : null;
  }

  set(key: string, value: string): void {
    this.map.set(key, value);
  }

  remove(key: string): void {
    this.map.delete(key);
  }

  keys(): string[] {
    return Array.from(this.map.keys());
  }
}
