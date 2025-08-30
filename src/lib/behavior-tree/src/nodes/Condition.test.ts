import { describe, it, expect } from "vitest";
import { Condition } from "./Condition";

interface BB {
  flag?: boolean;
}

describe("Condition", () => {
  it("returns Success when predicate is truthy and Failure otherwise", () => {
    const cond = Condition<BB>("flag", (b) => b.flag === true);
    expect(cond.tick({ flag: true }, 0)).toBe("Success");
    expect(cond.tick({ flag: false }, 0)).toBe("Failure");
    expect(cond.tick({}, 0)).toBe("Failure");
  });
});
