const STALE_MS = 30 * 60 * 1000;
const SYNC_DEBOUNCE_MS = 5 * 60 * 1000;
const SYNC_LOCK_KEY = "studyhaul-lms-sync";

export interface LmsConnectionStatus {
  provider: string;
  status: string;
  lastSyncedAt: string | null;
}

function isConnectionStale(connection: LmsConnectionStatus): boolean {
  if (!connection.lastSyncedAt) return true;
  return Date.now() - new Date(connection.lastSyncedAt).getTime() > STALE_MS;
}

export function isLmsSyncStale(connections: LmsConnectionStatus[]): boolean {
  return connections.some(
    (connection) =>
      connection.status === "connected" && isConnectionStale(connection),
  );
}

export async function triggerLmsSyncIfStale(
  connections: LmsConnectionStatus[],
): Promise<boolean> {
  const stale = connections.filter(
    (connection) =>
      connection.status === "connected" && isConnectionStale(connection),
  );
  if (stale.length === 0) return false;

  if (typeof sessionStorage !== "undefined") {
    const lastAttempt = sessionStorage.getItem(SYNC_LOCK_KEY);
    if (lastAttempt && Date.now() - Number(lastAttempt) < SYNC_DEBOUNCE_MS) {
      return false;
    }
    sessionStorage.setItem(SYNC_LOCK_KEY, String(Date.now()));
  }

  let synced = false;
  for (const connection of stale) {
    try {
      const response = await fetch("/api/lms/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: connection.provider }),
      });
      const data = await response.json();
      if (data.success) synced = true;
    } catch {
      // Try remaining providers.
    }
  }

  return synced;
}
