interface NotificationProps {
  message?: string | null;
}

export default function Notification({ message }: NotificationProps) {
  if (!message) return null;
  return (
    <div className="absolute left-1/2 top-8 -translate-x-1/2 z-20">
      <div className="hud-text text-green-400 text-sm bg-black bg-opacity-60 rounded px-4 py-2 shadow-lg">
        {message}
      </div>
    </div>
  );
}
