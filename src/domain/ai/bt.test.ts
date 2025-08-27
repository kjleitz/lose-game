import { describe, it, expect } from "vitest";
import { Action, Condition, Selector, Sequence, Inverter } from "./bt";

interface TestBB {
  x?: number;
}

function bb(): TestBB {
  return {};
}

describe("BT core", () => {
  it("Sequence short-circuits on Failure and Running", () => {
    const order: string[] = [];
    const a = Action<TestBB>("A", () => {
      order.push("A");
      return "Success";
    });
    const b = Action<TestBB>("B", () => {
      order.push("B");
      return "Failure";
    });
    const c = Action<TestBB>("C", () => {
      order.push("C");
      return "Success";
    });
    const seq = Sequence<TestBB>("root", [a, b, c]);
    const s = seq.tick(bb(), 0.016);
    expect(s).toBe("Failure");
    expect(order).toEqual(["A", "B"]);
  });

  it("Selector short-circuits on Success and Running", () => {
    const order: string[] = [];
    const a = Action<TestBB>("A", () => {
      order.push("A");
      return "Failure";
    });
    const b = Action<TestBB>("B", () => {
      order.push("B");
      return "Success";
    });
    const c = Action<TestBB>("C", () => {
      order.push("C");
      return "Failure";
    });
    const sel = Selector<TestBB>("root", [a, b, c]);
    const s = sel.tick(bb(), 0.016);
    expect(s).toBe("Success");
    expect(order).toEqual(["A", "B"]);
  });

  it("Condition passes/fails and inverter flips", () => {
    const cond = Condition<TestBB>("truthy", (b) => !!b.x);
    const inv = Inverter<TestBB>("not", cond);
    const b1 = bb();
    b1.x = 1;
    const b2 = bb();
    b2.x = 0;
    expect(cond.tick(b1, 0)).toBe("Success");
    expect(inv.tick(b1, 0)).toBe("Failure");
    expect(cond.tick(b2, 0)).toBe("Failure");
    expect(inv.tick(b2, 0)).toBe("Success");
  });
});
