Storage Module

Purpose: small, typed, namespaced key–value storage with pluggable backends and codecs. Default backend detection prefers `localStorage` in the browser and falls back to an in‑memory map.

Exports

- createStore: build a namespaced store with a `StringKeyValueBackend` and a `Codec<T>`.
- detectBackend: choose the best available backend for the environment.
- LocalStorageBackend, MemoryStorageBackend: concrete backends.
- createJsonCodec, numberCodec, booleanCodec, stringCodec: helpers for encoding/decoding.
- Types: Codec<T>, NamespacedStore<T>, CreateStoreOptions<T>, StringKeyValueBackend.

Usage

```ts
import { createStore, detectBackend, createJsonCodec } from "../../lib/storage";

// Define a codec for your value type
type User = { id: string; name: string };
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
const userCodec = createJsonCodec<User>((u) => {
  if (isRecord(u)) {
    const id = u["id"];
    const name = u["name"];
    if (typeof id === "string" && typeof name === "string") return { id, name };
  }
  throw new Error("Invalid user");
});

const store = createStore({ namespace: "users", backend: detectBackend(), codec: userCodec });
store.set("alice", { id: "1", name: "Alice" });
store.get("alice"); // { id: "1", name: "Alice" }
```

Notes

- `createStore.get` returns `null` on missing keys or decode errors (keeps consumers safe from corrupted data).
- `clear` removes only keys within the namespace.
- All consumers should import from the package index (this file’s sibling `index.ts`).

Persistence Considerations

- Quotas and availability: `LocalStorageBackend` depends on `window.localStorage` and may be unavailable in some environments (SSR, private modes). Use `detectBackend()` to choose a working backend.
- Fail-safety: `set` operations swallow quota/access errors to keep the app responsive; prefer feature flags/UX to handle persistence failure gracefully.
- Corruption: Values are JSON-encoded strings. If the underlying data is corrupted or the codec changes, `get` returns `null`. Handle `null` by re-seeding defaults or triggering migrations.
- Namespacing: Keys are stored as `"<namespace>::<key>"`, allowing `clear()` to safely remove only namespaced entries.

Design Rationale

- Minimal surface: a simple `StringKeyValueBackend` makes it easy to add new backends (e.g., `sessionStorage`, IndexedDB adapter) without changing store logic.
- Type-first: codecs validate shape on decode and ensure only valid data enters the app. No `any`, no casting.
- Safety over exceptions: reads never throw; invalid or missing data yields `null` to simplify consumers.
- Predictable cleanup: `clear()` only touches the active namespace to avoid clobbering other modules’ data.

Examples

- See `examples/` for usage snippets:
  - `examples/basic-usage.ts`: create a store with a validated settings codec.
  - `examples/namespacing.ts`: isolate data across namespaces.
  - `examples/custom-codec.ts`: define and use a custom codec.
