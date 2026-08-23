"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

interface GoogleCalendarOption {
  id: string;
  calendarName: string | null;
  externalCalendarId: string;
  color: string | null;
  status: string;
  syncing: boolean;
}

export function GoogleCalendarPicker({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [calendars, setCalendars] = useState<GoogleCalendarOption[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCalendars = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/calendar/google/calendars");
      const data = await response.json();
      if (!data.success) throw new Error(data.error ?? "Failed to load calendars");

      const items = (data.calendars ?? []) as GoogleCalendarOption[];
      setCalendars(items);
      setSelected(
        Object.fromEntries(items.map((item) => [item.id, item.syncing])),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load calendars.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void loadCalendars();
  }, [open, loadCalendars]);

  async function saveSelection() {
    setSaving(true);
    setError(null);
    try {
      const selections = calendars.map((calendar) => ({
        connectionId: calendar.id,
        enabled: selected[calendar.id] ?? false,
      }));

      const response = await fetch("/api/calendar/google/calendars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selections }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error ?? "Failed to save selection");

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save selection.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-2xl">
        <div className="border-b border-orange-100 px-6 py-4">
          <h2 className="text-lg font-bold text-stone-900">Choose Google calendars</h2>
          <p className="mt-1 text-sm text-stone-600">
            Select which calendars to sync into Study Haul.
          </p>
        </div>

        <div className="max-h-[50vh] overflow-y-auto px-6 py-4">
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-stone-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading calendars…
            </p>
          ) : calendars.length === 0 ? (
            <p className="text-sm text-stone-500">No Google calendars found.</p>
          ) : (
            <div className="space-y-2">
              {calendars.map((calendar) => {
                const checked = selected[calendar.id] ?? false;
                return (
                  <label
                    key={calendar.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 transition ${
                      checked
                        ? "border-orange-200 bg-orange-50/70"
                        : "border-orange-100 hover:bg-orange-50/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) =>
                        setSelected((current) => ({
                          ...current,
                          [calendar.id]: event.target.checked,
                        }))
                      }
                      className="rounded border-orange-300 text-orange-600"
                    />
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: calendar.color ?? "#4285f4" }}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-stone-800">
                      {calendar.calendarName ?? "Google Calendar"}
                    </span>
                    {checked ? <Check className="h-4 w-4 text-orange-600" /> : null}
                  </label>
                );
              })}
            </div>
          )}

          {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-orange-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-orange-200 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-orange-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || loading || calendars.length === 0}
            onClick={() => void saveSelection()}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save selection
          </button>
        </div>
      </div>
    </div>
  );
}
