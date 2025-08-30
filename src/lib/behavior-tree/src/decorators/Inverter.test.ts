import { describe, it, expect } from "vitest";
import { Inverter } from "./Inverter";
import { Condition } from "../nodes/Condition";

interface BB {
  x?: number;
}

describe("Inverter", () => {
  it("flips Success/Failure and passes through Running", () => {
    const cond = Condition<BB>("truthy", (b) => !!b.x);
    const inv = Inverter<BB>("not", cond);
    expect(inv.tick({ x: 1 }, 0)).toBe("Failure");
    expect(inv.tick({ x: 0 }, 0)).toBe("Success");
  });
});
