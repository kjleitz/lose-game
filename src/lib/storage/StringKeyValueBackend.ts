export interface StringKeyValueBackend {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
  /**
   * Returns all keys currently stored in the backend.
   */
  keys(): string[];
}
