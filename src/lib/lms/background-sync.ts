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

function shouldDebounceSync(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  const lastAttempt = sessionStorage.getItem(SYNC_LOCK_KEY);
  if (lastAttempt && Date.now() - Number(lastAttempt) < SYNC_DEBOUNCE_MS) {
    return true;
  }
  sessionStorage.setItem(SYNC_LOCK_KEY, String(Date.now()));
  return false;
}

async function syncMoodleFromThisDevice(): Promise<boolean> {
  try {
    const { syncMoodleFromBrowser } = await import("@/lib/lms/moodle-browser-sync");
    const credResponse = await fetch("/api/lms/moodle/credentials");
    const credData = await credResponse.json();
    if (!credData.success) return false;
    await syncMoodleFromBrowser(credData.baseUrl, credData.accessToken);
    return true;
  } catch {
    return false;
  }
}

async function syncProviderFromServer(provider: string): Promise<boolean> {
  try {
    const response = await fetch("/api/lms/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider }),
      signal: AbortSignal.timeout(25_000),
    });
    const data = await response.json();
    return Boolean(data.success);
  } catch {
    return false;
  }
}

export async function triggerLmsSyncIfStale(
  connections: LmsConnectionStatus[],
): Promise<boolean> {
  const stale = connections.filter(
    (connection) =>
      connection.status === "connected" && isConnectionStale(connection),
  );
  if (stale.length === 0) return false;
  if (shouldDebounceSync()) return false;

  let synced = false;
  for (const connection of stale) {
    if (connection.provider === "MOODLE") {
      if (await syncMoodleFromThisDevice()) synced = true;
    } else if (await syncProviderFromServer(connection.provider)) {
      synced = true;
    }
  }

  return synced;
}

/** Load connections and sync stale LMS data (same account on web, iPad, and phone). */
export async function triggerLmsBackgroundSync(): Promise<boolean> {
  try {
    const response = await fetch("/api/lms/connect", { credentials: "same-origin" });
    const data = await response.json();
    if (!data.success) return false;
    return triggerLmsSyncIfStale(data.connections ?? []);
  } catch {
    return false;
  }
}
