import { describe, it, expect } from "vitest";
import { Sequence } from "./Sequence";
import { Action } from "../nodes/Action";

interface BB {
  [key: string]: unknown;
}

describe("Sequence", () => {
  it("short-circuits on Failure and Running", () => {
    const order: string[] = [];
    const a = Action<BB>("A", () => {
      order.push("A");
      return "Success";
    });
    const b = Action<BB>("B", () => {
      order.push("B");
      return "Failure";
    });
    const c = Action<BB>("C", () => {
      order.push("C");
      return "Success";
    });
    const seq = Sequence<BB>("root", [a, b, c]);
    const s = seq.tick({}, 0.016);
    expect(s).toBe("Failure");
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
    const seq = Sequence<BB>("root", [a, b]);
    const s = seq.tick({}, 0.016);
    expect(s).toBe("Running");
    expect(order).toEqual(["A"]);
  });
});
