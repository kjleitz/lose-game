import type { JSX } from "react";
import { Button } from "../../controls";

export function SettingsButton({ onClick }: { onClick?: () => void }): JSX.Element {
  return (
    <Button onClick={onClick} aria-label="Open settings">
      ⚙︎
    </Button>
  );
}
