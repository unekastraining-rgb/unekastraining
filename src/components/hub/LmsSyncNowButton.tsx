"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { triggerLmsBackgroundSync } from "@/lib/lms/background-sync";
import { dispatchLmsSynced } from "@/lib/lms/sync-events";
import { useCompactHubNav } from "@/hooks/useCompactHubNav";

export function LmsSyncNowButton({
  label = "Sync LMS now",
  className = "",
  onSynced,
}: {
  label?: string;
  className?: string;
  onSynced?: () => void;
}) {
  const router = useRouter();
  const compactNav = useCompactHubNav();
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function syncNow() {
    setSyncing(true);
    setMessage(null);
    try {
      const synced = await triggerLmsBackgroundSync();
      if (synced) dispatchLmsSynced();
      // Full refresh breaks touch on Core/Calendar on phone & iPad.
      if (!compactNav) router.refresh();
      onSynced?.();
      setMessage(
        synced
          ? "Synced — topics and assignments should appear shortly."
          : "Nothing new to import, or the LMS connector needs credentials / campus network from this device. Check Settings → LMS connections.",
      );
    } catch {
      setMessage(
        "Sync failed. Open Settings → LMS connections, confirm credentials, and retry on a network that can reach your school LMS.",
      );
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => void syncNow()}
        disabled={syncing}
        className="inline-flex items-center gap-2 rounded-xl border border-teal-300 bg-white px-3.5 py-2 text-sm font-semibold text-teal-800 touch-manipulation hover:bg-teal-50 disabled:opacity-60"
      >
        {syncing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        {label}
      </button>
      {message ? <p className="mt-2 text-xs text-stone-600">{message}</p> : null}
    </div>
  );
}
