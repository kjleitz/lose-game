import { describe, it, expect, beforeEach } from "vitest";
import { deleteAllGameData } from "./deleteData";

describe("deleteAllGameData", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem("lose.settings::app", JSON.stringify({ speed: 2 }));
    window.localStorage.setItem(
      "lose.session::latest",
      JSON.stringify({ player: { x: 1, y: 2 }, mode: "space" }),
    );
    window.localStorage.setItem("lose.keyBindings", JSON.stringify({ KeyW: "thrust" }));
    window.localStorage.setItem("lose.keybindings::map", JSON.stringify({ KeyW: "thrust" }));
  });

  it("removes namespaced saves and keybindings", () => {
    deleteAllGameData();
    expect(window.localStorage.getItem("lose.settings::app")).toBeNull();
    expect(window.localStorage.getItem("lose.session::latest")).toBeNull();
    expect(window.localStorage.getItem("lose.keyBindings")).toBeNull();
    expect(window.localStorage.getItem("lose.keybindings::map")).toBeNull();
  });
});
