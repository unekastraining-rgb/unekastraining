const STALE_MS = 30 * 60 * 1000;
const SYNC_DEBOUNCE_MS = 5 * 60 * 1000;
const SYNC_LOCK_KEY = "studyhaul-google-sync";

export interface GoogleConnectionStatus {
  id: string;
  status: string;
  lastSyncedAt: string | null;
}

export function isGoogleSyncStale(
  connections: GoogleConnectionStatus[],
): boolean {
  const connected = connections.filter(
    (connection) => connection.status === "connected",
  );
  if (connected.length === 0) return false;

  const now = Date.now();
  return connected.some((connection) => {
    if (!connection.lastSyncedAt) return true;
    return now - new Date(connection.lastSyncedAt).getTime() > STALE_MS;
  });
}

export async function triggerGoogleSyncIfStale(
  connections: GoogleConnectionStatus[],
): Promise<boolean> {
  if (!isGoogleSyncStale(connections)) return false;

  if (typeof sessionStorage !== "undefined") {
    const lastAttempt = sessionStorage.getItem(SYNC_LOCK_KEY);
    if (lastAttempt && Date.now() - Number(lastAttempt) < SYNC_DEBOUNCE_MS) {
      return false;
    }
    sessionStorage.setItem(SYNC_LOCK_KEY, String(Date.now()));
  }

  try {
    const response = await fetch("/api/calendar/google/sync", { method: "POST" });
    const data = await response.json();
    return data.success === true;
  } catch {
    return false;
  }
}
