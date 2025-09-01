import type { JSX } from "react";

interface PauseMenuProps {
  onResume: () => void;
  onDeleteData: () => void;
}

export function PauseMenu({ onResume, onDeleteData }: PauseMenuProps): JSX.Element {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70">
      <Panel className="w-[420px] p-4 space-y-4">
        <h2 className="hud-text text-sm">Paused</h2>
        <div className="space-y-2">
          <Button className="w-full py-2 text-sm" onClick={onResume}>
            Resume (Esc)
          </Button>
          <Button variant="danger" className="w-full py-2 text-sm" onClick={onDeleteData}>
            Delete Save Data
          </Button>
        </div>
        <p className="hud-text text-[11px] opacity-70">
          Deleting will remove your saved settings, session, and key bindings.
        </p>
      </Panel>
    </div>
  );
}
import { Panel, Button } from "../../controls";
