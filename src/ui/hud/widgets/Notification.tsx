import type { JSX } from "react";

interface NotificationProps {
  message?: string | null;
}

export function Notification({ message }: NotificationProps): JSX.Element | null {
  if (message == null || message === "") return null;
  return (
    <div className="absolute left-1/2 top-8 -translate-x-1/2 z-20">
      <div className="hud-text text-sm bg-hud-bg/80 rounded px-4 py-2 shadow-lg border border-hud-accent/30">
        {message}
      </div>
    </div>
  );
}
