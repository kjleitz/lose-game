import type { StringKeyValueBackend } from "./StringKeyValueBackend";
import type { Codec } from "./Codec";

export interface NamespacedStore<T> {
  get(key: string): T | null;
  set(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
  keys(): string[];
  getAll(): Record<string, T>;
}

export interface CreateStoreOptions<T> {
  namespace: string;
  backend: StringKeyValueBackend;
  codec: Codec<T>;
}

function joinKey(namespace: string, key: string): string {
  return `${namespace}::${key}`;
}

function stripPrefix(namespace: string, fullKey: string): string | null {
  const prefix = `${namespace}::`;
  if (fullKey.startsWith(prefix)) {
    return fullKey.slice(prefix.length);
  }
  return null;
}

export function createStore<T>(options: CreateStoreOptions<T>): NamespacedStore<T> {
  const { namespace, backend, codec } = options;

  function get(key: string): T | null {
    const raw = backend.get(joinKey(namespace, key));
    if (raw == null) return null;
    try {
      return codec.decode(raw);
    } catch {
      return null;
    }
  }

  function set(key: string, value: T): void {
    const raw = codec.encode(value);
    backend.set(joinKey(namespace, key), raw);
  }

  function remove(key: string): void {
    backend.remove(joinKey(namespace, key));
  }

  function clear(): void {
    const all = backend.keys();
    const prefix = `${namespace}::`;
    for (const k of all) {
      if (k.startsWith(prefix)) {
        backend.remove(k);
      }
    }
  }

  function keys(): string[] {
    const all = backend.keys();
    const out: string[] = [];
    for (const k of all) {
      const stripped = stripPrefix(namespace, k);
      if (stripped !== null) out.push(stripped);
    }
    return out;
  }

  function getAll(): Record<string, T> {
    const result: Record<string, T> = {};
    for (const k of keys()) {
      const v = get(k);
      if (v !== null) {
        result[k] = v;
      }
    }
    return result;
  }

  return { get, set, remove, clear, keys, getAll };
}
