import { useOnlineStatus } from "../lib/useOnlineStatus";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="bg-warning text-white text-xs font-medium text-center py-1.5 px-4">
      ⚠ You're offline — pages you've already visited still work, but saving, submitting, or loading new data will
      resume once you're back online.
    </div>
  );
}
