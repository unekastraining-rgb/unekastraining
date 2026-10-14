import { triggerGoogleSyncIfStale } from "@/lib/calendar/google-background-sync";
import { triggerLmsSyncIfStale } from "@/lib/lms/background-sync";
import type { WorkspaceCalendarItem, WorkspaceCourse } from "@/lib/calendar/workspace-types";

export interface GoogleConnectionStatus {
  id: string;
  calendarName: string | null;
  externalCalendarId: string;
  color: string | null;
  status: string;
  lastSyncedAt: string | null;
}

function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit & { timeoutMs?: number },
): Promise<Response> {
  const timeoutMs = init?.timeoutMs ?? 12_000;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  const { timeoutMs: _drop, signal: externalSignal, ...rest } = init ?? {};

  return fetch(input, {
    credentials: "same-origin",
    ...rest,
    signal: externalSignal ?? controller.signal,
  }).finally(() => window.clearTimeout(timer));
}

/**
 * Google + LMS sync after the calendar grid is already visible.
 * Never throws — failures are logged only in dev.
 */
export async function runCalendarBackgroundSync(options: {
  params: URLSearchParams;
  onData?: (data: {
    items: WorkspaceCalendarItem[];
    courses: WorkspaceCourse[];
  }) => void;
  onGoogleConnections?: (connections: GoogleConnectionStatus[]) => void;
}): Promise<void> {
  try {
    let shouldRefresh = false;

    const googleResponse = await fetchWithTimeout("/api/calendar/google/status", {
      timeoutMs: 8_000,
    }).catch(() => null);
    const googleJson = googleResponse ? await googleResponse.json() : { success: false };

    if (googleJson.success) {
      const connections = (googleJson.connections ?? []) as GoogleConnectionStatus[];
      options.onGoogleConnections?.(
        connections.filter((connection) => connection.status === "connected"),
      );
      if (await triggerGoogleSyncIfStale(connections)) {
        shouldRefresh = true;
      }
    }

    const lmsResponse = await fetchWithTimeout("/api/lms/connect", {
      timeoutMs: 8_000,
    }).catch(() => null);
    const lmsJson = lmsResponse ? await lmsResponse.json() : { success: false };

    if (lmsJson.success) {
      if (await triggerLmsSyncIfStale(lmsJson.connections ?? [])) {
        shouldRefresh = true;
      }
    }

    if (!shouldRefresh || !options.onData) return;

    const refresh = await fetchWithTimeout(`/api/calendar?${options.params}`, {
      timeoutMs: 15_000,
    });
    const refreshJson = await refresh.json();
    if (refreshJson.success) {
      options.onData({
        items: refreshJson.data.items as WorkspaceCalendarItem[],
        courses: refreshJson.data.courses as WorkspaceCourse[],
      });
    }
  } catch {
    // Background sync must never block or break the calendar UI.
  }
}
