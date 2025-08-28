import { describe, it, expect, beforeEach } from "vitest";
import { loadSettings, saveSettings, updateSettings, getDefaultSettings } from "./settingsStorage";

describe("settingsStorage", () => {
  beforeEach(() => {
    // clear jsdom storage
    try {
      if (typeof window !== "undefined") window.localStorage.clear();
    } catch {
      // ignore
    }
  });

  it("returns null when no settings saved", () => {
    expect(loadSettings()).toBeNull();
  });

  it("saves and loads settings", () => {
    const s = { ...getDefaultSettings(), speed: 2 };
    saveSettings(s);
    expect(loadSettings()).toEqual(s);
  });

  it("updates settings with partial patch", () => {
    const def = getDefaultSettings();
    const next = updateSettings({ speed: 3 });
    expect(next).toEqual({ ...def, speed: 3 });
    const loaded = loadSettings();
    expect(loaded).toEqual({ ...def, speed: 3 });
  });
});
