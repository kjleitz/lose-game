import { describe, it, expect } from "vitest";
import { RepeatUntilSuccess } from "./RepeatUntilSuccess";
import { Action } from "../nodes/Action";

interface BB {}

describe("RepeatUntilSuccess", () => {
  it("runs until success or max attempts", () => {
    let calls = 0;
    const child = Action<BB>("flaky", () => {
      calls += 1;
      return calls >= 2 ? "Success" : "Failure";
    });
    const rus = RepeatUntilSuccess<BB>("rus", child, 3);
    expect(rus.tick({}, 0)).toBe("Running");
    expect(rus.tick({}, 0)).toBe("Success");
  });

  it("fails after max attempts of failures", () => {
    const child = Action<BB>("alwaysFail", () => "Failure");
    const rus = RepeatUntilSuccess<BB>("rus", child, 2);
    expect(rus.tick({}, 0)).toBe("Running");
    expect(rus.tick({}, 0)).toBe("Failure");
  });
});
