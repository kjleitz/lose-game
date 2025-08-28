import { LocalStorageBackend, isLocalStorageAvailable } from "./LocalStorageBackend";
import { MemoryStorageBackend } from "./MemoryStorageBackend";
import type { StringKeyValueBackend } from "./StringKeyValueBackend";

export function detectBackend(): StringKeyValueBackend {
  if (isLocalStorageAvailable()) {
    try {
      return new LocalStorageBackend();
    } catch {
      // fallthrough to memory
    }
  }
  return new MemoryStorageBackend();
}
