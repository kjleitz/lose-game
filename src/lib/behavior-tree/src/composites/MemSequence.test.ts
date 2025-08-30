import { describe, it, expect } from "vitest";
import { MemSequence } from "./MemSequence";
import { Action } from "../nodes/Action";

interface BB {
  step?: number;
}

describe("MemSequence", () => {
  it("resumes from running child index and completes", () => {
    let ranB = 0;
    const A = Action<BB>("A", () => "Success");
    const B = Action<BB>("B", () => {
      ranB += 1;
      return ranB < 2 ? "Running" : "Success";
    });
    const C = Action<BB>("C", () => "Success");

    const seq = MemSequence<BB>("root", [A, B, C]);

    // First tick: A=Success, B=Running => Running; next tick resumes at B
    expect(seq.tick({}, 0.016)).toBe("Running");
    expect(seq.tick({}, 0.016)).toBe("Success");
  });

  it("resets on failure and restarts from first child", () => {
    let failOnce = true;
    const A = Action<BB>("A", () => "Success");
    const B = Action<BB>("B", () => (failOnce ? ((failOnce = false), "Failure") : "Success"));
    const C = Action<BB>("C", () => "Success");
    const seq = MemSequence<BB>("root", [A, B, C]);

    expect(seq.tick({}, 0)).toBe("Failure"); // B failed, resets
    expect(seq.tick({}, 0)).toBe("Success"); // A,B,C all success now
  });
});
