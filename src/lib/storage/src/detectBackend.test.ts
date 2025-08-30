import { describe, expect, it } from "vitest";

import { detectBackend } from "./detectBackend";
import { isLocalStorageAvailable, LocalStorageBackend } from "./LocalStorageBackend";
import { MemoryStorageBackend } from "./MemoryStorageBackend";

describe("storage/detectBackend", () => {
  it("returns a functioning backend appropriate to the environment", () => {
    const backend = detectBackend();
    const available = isLocalStorageAvailable();
    if (available) {
      expect(backend).toBeInstanceOf(LocalStorageBackend);
    } else {
      expect(backend).toBeInstanceOf(MemoryStorageBackend);
    }
    // Sanity check set/get/remove
    const key = "__detect_test__";
    backend.remove(key);
    expect(backend.get(key)).toBeNull();
    backend.set(key, "v");
    expect(backend.get(key)).toBe("v");
    backend.remove(key);
    expect(backend.get(key)).toBeNull();
  });
});
