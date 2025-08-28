import type { StringKeyValueBackend } from "./StringKeyValueBackend";

function hasLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export class LocalStorageBackend implements StringKeyValueBackend {
  private readonly storage: Storage;

  constructor() {
    if (!hasLocalStorage()) {
      throw new Error("localStorage is not available in this environment");
    }
    this.storage = window.localStorage;
  }

  get(key: string): string | null {
    try {
      return this.storage.getItem(key);
    } catch {
      return null;
    }
  }

  set(key: string, value: string): void {
    try {
      this.storage.setItem(key, value);
    } catch {
      // Quota or access error. Swallow to keep API simple.
    }
  }

  remove(key: string): void {
    try {
      this.storage.removeItem(key);
    } catch {
      // Ignore
    }
  }

  keys(): string[] {
    try {
      const out: string[] = [];
      for (let i = 0; i < this.storage.length; i += 1) {
        const k = this.storage.key(i);
        if (typeof k === "string") {
          out.push(k);
        }
      }
      return out;
    } catch {
      return [];
    }
  }
}

export function isLocalStorageAvailable(): boolean {
  try {
    if (!hasLocalStorage()) return false;
    // Smoke test write/remove small value
    const testKey = "__storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}
