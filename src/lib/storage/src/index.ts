export type { StringKeyValueBackend } from "./StringKeyValueBackend";
export { LocalStorageBackend, isLocalStorageAvailable } from "./LocalStorageBackend";
export { MemoryStorageBackend } from "./MemoryStorageBackend";
export type { Codec } from "./Codec";
export { createJsonCodec } from "./Codec";
export { numberCodec, booleanCodec, stringCodec } from "./extraCodecs";
export { createStore } from "./createStore";
export type { NamespacedStore, CreateStoreOptions } from "./createStore";
export { detectBackend } from "./detectBackend";
