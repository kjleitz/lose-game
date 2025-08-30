// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LocalStorageBackend } from "../";

describe("LocalStorageBackend", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("get returns null when underlying getItem throws", () => {
    const backend = new LocalStorageBackend();
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => Storage.prototype.getItem("foo")).toThrow();
    backend.set("k", "v");
    expect(backend.get("k")).toBeNull();
    spy.mockRestore();
  });

  it("set swallows errors (e.g., quota exceeded)", () => {
    const backend = new LocalStorageBackend();
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => Storage.prototype.setItem("foo", "bar")).toThrow();
    backend.set("k", "v");
    expect(backend.get("k")).toBeNull();
    spy.mockRestore();
  });

  it("remove swallows errors", () => {
    const backend = new LocalStorageBackend();
    backend.set("k", "v");
    const spy = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("nope");
    });
    backend.remove("k");
    spy.mockRestore();
    backend.remove("k");
    expect(backend.get("k")).toBeNull();
  });

  it("keys returns [] when underlying iteration fails", () => {
    const backend = new LocalStorageBackend();
    backend.set("a", "1");
    const lengthSpy = vi.spyOn(Storage.prototype, "length", "get").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(backend.keys()).toEqual([]);
    lengthSpy.mockRestore();
  });
});
