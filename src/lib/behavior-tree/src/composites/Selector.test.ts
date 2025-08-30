import { describe, it, expect } from "vitest";
import { Selector } from "./Selector";
import { Action } from "../nodes/Action";

interface BB {}

describe("Selector", () => {
  it("short-circuits on Success and Running", () => {
    const order: string[] = [];
    const a = Action<BB>("A", () => {
      order.push("A");
      return "Failure";
    });
    const b = Action<BB>("B", () => {
      order.push("B");
      return "Success";
    });
    const c = Action<BB>("C", () => {
      order.push("C");
      return "Failure";
    });
    const sel = Selector<BB>("root", [a, b, c]);
    const s = sel.tick({}, 0.016);
    expect(s).toBe("Success");
    expect(order).toEqual(["A", "B"]);
  });

  it("propagates Running without evaluating later children", () => {
    const order: string[] = [];
    const a = Action<BB>("A", () => {
      order.push("A");
      return "Running";
    });
    const b = Action<BB>("B", () => {
      order.push("B");
      return "Success";
    });
    const sel = Selector<BB>("root", [a, b]);
    const s = sel.tick({}, 0.016);
    expect(s).toBe("Running");
    expect(order).toEqual(["A"]);
  });
});
