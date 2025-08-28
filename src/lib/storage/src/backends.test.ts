import { describe, it, expect } from "vitest";
import { MemoryStorageBackend, LocalStorageBackend, isLocalStorageAvailable } from "..";

describe("storage/backends", () => {
  it("memory backend basic operations", () => {
    const mem = new MemoryStorageBackend();
    expect(mem.get("x")).toBeNull();
    mem.set("x", "1");
    expect(mem.get("x")).toBe("1");
    expect(mem.keys()).toEqual(["x"]);
    mem.remove("x");
    expect(mem.get("x")).toBeNull();
  });

  it("localStorage availability is a boolean and backend works when available", () => {
    const available = isLocalStorageAvailable();
    expect(typeof available).toBe("boolean");
    if (!available) {
      // Environment without localStorage; no further assertions
      return;
    }
    const ls = new LocalStorageBackend();
    ls.remove("__ls_test__");
    expect(ls.get("__ls_test__")).toBeNull();
    ls.set("__ls_test__", "ok");
    expect(ls.get("__ls_test__")).toBe("ok");
    expect(ls.keys()).toContain("__ls_test__");
    ls.remove("__ls_test__");
    expect(ls.get("__ls_test__")).toBeNull();
  });
});
