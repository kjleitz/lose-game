import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PauseMenu } from "./PauseMenu";

describe("PauseMenu", () => {
  it("renders and calls handlers", () => {
    const onResume = vi.fn();
    const onDelete = vi.fn();
    render(<PauseMenu onResume={onResume} onDeleteData={onDelete} />);
    fireEvent.click(screen.getByText(/Resume/i));
    expect(onResume).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText(/Delete Save Data/i));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
