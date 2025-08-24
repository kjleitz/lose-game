import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Notification from "../hud/components/Notification";

describe("Notification", () => {
  it("renders the message when provided", () => {
    render(<Notification message="Hello World" />);
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("renders nothing when message is null or undefined", () => {
    const { container } = render(<Notification message={null} />);
    expect(container.firstChild).toBeNull();
    const { container: container2 } = render(<Notification />);
    expect(container2.firstChild).toBeNull();
  });
});
