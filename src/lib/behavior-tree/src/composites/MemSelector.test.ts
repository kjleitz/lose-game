import { describe, it, expect } from "vitest";
import { MemSelector } from "./MemSelector";
import { Action } from "../nodes/Action";

interface BB {
  [key: string]: unknown;
}

describe("MemSelector", () => {
  it("resumes from running child and eventually succeeds", () => {
    const A = Action<BB>("A", () => "Failure");
    let ranB = 0;
    const B = Action<BB>("B", () => {
      ranB += 1;
      return ranB < 2 ? "Running" : "Failure";
    });
    const C = Action<BB>("C", () => "Success");
    const sel = MemSelector<BB>("root", [A, B, C]);

    // A=Failure, B=Running => Running, resume at B
    expect(sel.tick({}, 0)).toBe("Running");
    // Next: B=Failure, then evaluate C=Success => Success
    expect(sel.tick({}, 0)).toBe("Success");
  });

  it("resets after terminal status", () => {
    const A = Action<BB>("A", () => "Success");
    const B = Action<BB>("B", () => "Failure");
    const sel = MemSelector<BB>("root", [A, B]);
    expect(sel.tick({}, 0)).toBe("Success");
    // Next tick starts from the beginning again
    expect(sel.tick({}, 0)).toBe("Success");
  });
});
