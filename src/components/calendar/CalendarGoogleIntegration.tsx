"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Loader2, RefreshCw, Settings2, Unplug } from "lucide-react";

import { GoogleCalendarPicker } from "@/components/calendar/GoogleCalendarPicker";
import type { CalendarSettings } from "@/lib/calendar/settings";
import { hubTabPath } from "@/lib/hub/tabs";

interface GoogleConnection {
  id: string;
  calendarName: string | null;
  externalCalendarId: string;
  color: string | null;
  status: string;
  lastSyncedAt: string | null;
}

interface CalendarGoogleIntegrationProps {
  settings?: CalendarSettings;
  onSettingsChange?: (patch: Partial<CalendarSettings>) => Promise<void>;
  oauthReturnTo?: "calendar" | "hub-settings";
}

export function CalendarGoogleIntegration({
  settings,
  onSettingsChange,
  oauthReturnTo = "calendar",
}: CalendarGoogleIntegrationProps) {
  const router = useRouter();
  const [connections, setConnections] = useState<GoogleConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/calendar/google/status");
      const data = await response.json();
      if (data.success) {
        setConnections(data.connections ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleConnected = params.get("googleConnected");
    const googlePicker = params.get("googlePicker");
    const error = params.get("googleError");

    if (googleConnected === "1") {
      const imported = params.get("imported") ?? "0";
      const updated = params.get("updated") ?? "0";
      setMessage(
        `Google Calendar connected. Imported ${imported} events, updated ${updated}.`,
      );
      void loadStatus();
    }
    if (googlePicker === "1") {
      setPickerOpen(true);
    }
    if (error) {
      setMessage(`Google Calendar connection failed: ${error}`);
    }

    if (googleConnected || googlePicker || error) {
      if (oauthReturnTo === "hub-settings") {
        router.replace(hubTabPath("settings"), { scroll: false });
      } else if (window.location.pathname === "/calendar") {
        router.replace("/calendar?settings=1", { scroll: false });
      }
    }
  }, [loadStatus, oauthReturnTo, router]);

  async function syncNow() {
    setSyncing(true);
    setMessage(null);
    try {
      const response = await fetch("/api/calendar/google/sync", { method: "POST" });
      const data = await response.json();
      if (!data.success) throw new Error(data.error ?? "Sync failed");
      setMessage(
        `Synced Google Calendar — ${data.imported} new, ${data.updated} updated.`,
      );
      await loadStatus();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  async function disconnect() {
    if (!confirm("Disconnect Google Calendar and remove synced events?")) return;
    setSyncing(true);
    try {
      const response = await fetch("/api/calendar/google/status", {
        method: "DELETE",
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error ?? "Disconnect failed");
      setConnections([]);
      setMessage("Google Calendar disconnected.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Disconnect failed.");
    } finally {
      setSyncing(false);
    }
  }

  const connected = connections.some((item) => item.status === "connected");
  const syncingConnections = connections.filter((item) => item.status === "connected");
  const writeEnabled = settings?.googleWriteEnabled ?? true;

  return (
    <>
      <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-3 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-orange-600" />
          <p className="font-semibold text-stone-900">Google Calendar</p>
        </div>
        <p className="mt-2 text-stone-600">
          Two-way sync with selected Google calendars — imports events and pushes
          Study Haul changes back.
        </p>

        {loading ? (
          <p className="mt-3 flex items-center gap-2 text-stone-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking connection…
          </p>
        ) : connected ? (
          <div className="mt-3 space-y-2">
            {syncingConnections.map((connection) => (
              <div
                key={connection.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: connection.color ?? "#4285f4" }}
                  />
                  <span className="truncate font-medium text-stone-800">
                    {connection.calendarName ?? "Google Calendar"}
                  </span>
                </div>
                <span className="shrink-0 text-xs text-stone-500">
                  {connection.lastSyncedAt
                    ? new Date(connection.lastSyncedAt).toLocaleString()
                    : "Never synced"}
                </span>
              </div>
            ))}
            {onSettingsChange ? (
              <div className="space-y-2 rounded-lg bg-white px-3 py-2">
                <label className="flex items-start gap-2 text-xs text-stone-700">
                  <input
                    type="checkbox"
                    checked={writeEnabled}
                    onChange={(e) =>
                      void onSettingsChange({ googleWriteEnabled: e.target.checked })
                    }
                    className="mt-0.5 rounded border-orange-300 text-orange-500"
                  />
                  <span>
                    Push Study Haul event creates, edits, and deletes to Google
                  </span>
                </label>
                {writeEnabled && syncingConnections.length > 1 ? (
                  <label className="block text-xs text-stone-600">
                    <span className="mb-1 block font-medium text-stone-700">
                      Default calendar for new events
                    </span>
                    <select
                      value={settings?.defaultGoogleConnectionId ?? ""}
                      onChange={(e) =>
                        void onSettingsChange({
                          defaultGoogleConnectionId: e.target.value || null,
                        })
                      }
                      className="w-full rounded-lg border border-orange-200 px-2 py-1.5 text-xs"
                    >
                      <option value="">First connected calendar</option>
                      {syncingConnections.map((connection) => (
                        <option key={connection.id} value={connection.id}>
                          {connection.calendarName ?? "Google Calendar"}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-orange-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-orange-50"
              >
                <Settings2 className="h-3.5 w-3.5" />
                Choose calendars
              </button>
              <button
                type="button"
                onClick={() => void syncNow()}
                disabled={syncing}
                className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
              >
                {syncing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Sync now
              </button>
              <button
                type="button"
                onClick={() => void disconnect()}
                disabled={syncing}
                className="inline-flex items-center gap-1 rounded-lg border border-orange-200 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-white disabled:opacity-60"
              >
                <Unplug className="h-3.5 w-3.5" />
                Disconnect
              </button>
            </div>
          </div>
        ) : connections.length > 0 ? (
          <div className="mt-3 space-y-2">
            <p className="text-stone-600">
              Google account linked. Choose which calendars to sync.
            </p>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-orange-700 ring-1 ring-orange-200 hover:bg-orange-50"
            >
              <Settings2 className="h-3.5 w-3.5" />
              Choose calendars
            </button>
          </div>
        ) : (
          <a
            href={`/api/calendar/google/oauth/start?returnTo=${oauthReturnTo}`}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-orange-700 ring-1 ring-orange-200 hover:bg-orange-50"
          >
            Connect Google Calendar
          </a>
        )}

        {message ? <p className="mt-3 text-xs text-stone-600">{message}</p> : null}

        <p className="mt-3 text-xs text-stone-500">
          Reconnect Google if edits fail to sync (write permission required). Add
          redirect URI in Google Cloud Console:{" "}
          <code className="rounded bg-white px-1 py-0.5">
            /api/calendar/google/oauth/callback
          </code>
        </p>
      </div>

      <GoogleCalendarPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSaved={() => {
          void loadStatus();
          setMessage("Google calendar selection saved.");
        }}
      />
    </>
  );
}
