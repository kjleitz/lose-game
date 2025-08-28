import { detectBackend } from "../../lib/storage";

function clearNamespace(prefix: string): void {
  const backend = detectBackend();
  const keys = backend.keys();
  for (const k of keys) if (k.startsWith(`${prefix}::`)) backend.remove(k);
}

export function deleteAllGameData(): void {
  try {
    clearNamespace("lose.settings");
    clearNamespace("lose.session");
    clearNamespace("lose.keybindings");
    // Key bindings use a flat key
    const backend = detectBackend();
    backend.remove("lose.keyBindings");
  } catch {
    // ignore
  }
}
