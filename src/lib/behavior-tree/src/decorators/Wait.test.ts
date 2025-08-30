import { describe, it, expect } from "vitest";
import { Wait } from "./Wait";
import { Action } from "../nodes/Action";

interface BB {
  calls?: number;
}

describe("Wait", () => {
  it("returns Running until duration elapses, then delegates to child", () => {
    let childCalls = 0;
    const child = Action<BB>("child", () => {
      childCalls += 1;
      return "Success";
    });
    const wait = Wait<BB>("delay", child, 0.05);

    // 2 ticks at 0.02s each < 0.05 => Running, child not called
    expect(wait.tick({}, 0.02)).toBe("Running");
    expect(wait.tick({}, 0.02)).toBe("Running");
    expect(childCalls).toBe(0);

    // Next tick reaches/exceeds 0.05 => child called, returns Success
    expect(wait.tick({}, 0.02)).toBe("Success");
    expect(childCalls).toBe(1);
  });

  it("resets after child resolves, requiring delay again on next run", () => {
    let called = 0;
    const child = Action<BB>("child", () => {
      called += 1;
      return "Failure";
    });
    const wait = Wait<BB>("delay", child, 0.03);

    // First run resolves to Failure after delay
    expect(wait.tick({}, 0.02)).toBe("Running");
    expect(wait.tick({}, 0.02)).toBe("Failure");
    expect(called).toBe(1);

    // Second run should require delay again
    expect(wait.tick({}, 0.01)).toBe("Running");
  });
});
