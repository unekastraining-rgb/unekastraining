"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Loader2, Download, Settings, Upload, X } from "lucide-react";

import { CalendarGoogleIntegration } from "@/components/calendar/CalendarGoogleIntegration";
import { CalendarThemePicker } from "@/components/calendar/CalendarThemePicker";
import { COLOR_SCALES } from "@/lib/calendar/color-scales";
import { settingsFromColorScale } from "@/lib/calendar/calendar-themes";
import type { ColorScaleId } from "@/lib/calendar/color-scales";
import {
  DEFAULT_CALENDAR_SETTINGS,
  type CalendarSettings,
} from "@/lib/calendar/settings";
import type { CalendarViewMode, WorkspaceCourse } from "@/lib/calendar/workspace-types";

interface CalendarSettingsPanelProps {
  open: boolean;
  onClose: () => void;
  settings: CalendarSettings;
  courses: WorkspaceCourse[];
  onSettingsChange: (patch: Partial<CalendarSettings>) => Promise<void>;
  onImportComplete: () => void;
}

export function CalendarSettingsPanel({
  open,
  onClose,
  settings,
  courses,
  onSettingsChange,
  onImportComplete,
}: CalendarSettingsPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importCourseId, setImportCourseId] = useState("");
  const [exportCourseId, setExportCourseId] = useState("");
  const [exportInclude, setExportInclude] = useState<"all" | "events">("all");
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  async function save(patch: Partial<CalendarSettings>) {
    setSaving(true);
    try {
      await onSettingsChange(patch);
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    setExportMessage(null);
    try {
      const params = new URLSearchParams();
      if (exportCourseId) params.set("courseId", exportCourseId);
      if (exportInclude === "events") params.set("include", "events");

      const response = await fetch(`/api/calendar/export?${params.toString()}`);
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Export failed.");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const filenameMatch = disposition.match(/filename="([^"]+)"/);
      const filename = filenameMatch?.[1] ?? "study-haul-calendar.ics";

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      setExportMessage("Calendar downloaded.");
    } catch (error) {
      setExportMessage(
        error instanceof Error ? error.message : "Failed to export calendar.",
      );
    } finally {
      setExporting(false);
    }
  }

  async function handleImport(file: File) {
    setImporting(true);
    setImportMessage(null);
    try {
      const form = new FormData();
      form.append("file", file);
      if (importCourseId) form.append("courseId", importCourseId);

      const response = await fetch("/api/calendar/import", {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error ?? "Import failed");

      setImportMessage(`Imported ${data.imported} event${data.imported === 1 ? "" : "s"}.`);
      onImportComplete();
    } catch (error) {
      setImportMessage(
        error instanceof Error ? error.message : "Failed to import calendar.",
      );
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-900/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-orange-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-orange-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-bold text-stone-900">Calendar settings</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-500 hover:bg-orange-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-5">
          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-stone-500">
              Display
            </h3>
            <div className="space-y-3">
              <label className="block text-sm text-stone-700">
                Default view
                <select
                  value={settings.defaultView}
                  onChange={(e) =>
                    void save({ defaultView: e.target.value as CalendarViewMode })
                  }
                  className="mt-1 w-full rounded-lg border border-orange-200 px-3 py-2 text-sm"
                >
                  {(["month", "week", "day", "agenda"] as CalendarViewMode[]).map(
                    (mode) => (
                      <option key={mode} value={mode}>
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="block text-sm text-stone-700">
                Week starts on
                <select
                  value={settings.weekStartsOn}
                  onChange={(e) =>
                    void save({
                      weekStartsOn: e.target.value as "sunday" | "monday",
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-orange-200 px-3 py-2 text-sm"
                >
                  <option value="monday">Monday</option>
                  <option value="sunday">Sunday</option>
                </select>
              </label>

              <label className="block text-sm text-stone-700">
                Legacy color scale
                <select
                  value={settings.colorScale}
                  onChange={(e) =>
                    void save(
                      settingsFromColorScale(e.target.value as ColorScaleId),
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-orange-200 px-3 py-2 text-sm"
                >
                  {(Object.keys(COLOR_SCALES) as ColorScaleId[]).map((id) => (
                    <option key={id} value={id}>
                      {COLOR_SCALES[id].label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={settings.showTimeInsights}
                  onChange={(e) => void save({ showTimeInsights: e.target.checked })}
                  className="rounded border-orange-200 text-orange-600"
                />
                Show time insights panel
              </label>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-stone-500">
              Colors & theme
            </h3>
            <CalendarThemePicker settings={settings} onSave={save} />
          </section>

          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-stone-500">
              Working hours
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm text-stone-700">
                Start
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={settings.workingHoursStart}
                  onChange={(e) =>
                    void save({ workingHoursStart: Number(e.target.value) })
                  }
                  className="mt-1 w-full rounded-lg border border-orange-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm text-stone-700">
                End
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={settings.workingHoursEnd}
                  onChange={(e) =>
                    void save({ workingHoursEnd: Number(e.target.value) })
                  }
                  className="mt-1 w-full rounded-lg border border-orange-200 px-3 py-2 text-sm"
                />
              </label>
            </div>
            <label className="mt-3 block text-sm text-stone-700">
              Default event duration (minutes)
              <input
                type="number"
                min={15}
                step={15}
                value={settings.defaultEventDurationMinutes}
                onChange={(e) =>
                  void save({
                    defaultEventDurationMinutes: Number(e.target.value),
                  })
                }
                className="mt-1 w-full rounded-lg border border-orange-200 px-3 py-2 text-sm"
              />
            </label>
          </section>

          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-stone-500">
              Import calendar
            </h3>
            <p className="mb-3 text-sm text-stone-600">
              Upload an .ics file from Google Calendar, Outlook, or Apple Calendar.
            </p>
            <select
              value={importCourseId}
              onChange={(e) => setImportCourseId(e.target.value)}
              className="mb-3 w-full rounded-lg border border-orange-200 px-3 py-2 text-sm"
            >
              <option value="">Personal calendar</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            <input
              ref={fileRef}
              type="file"
              accept=".ics,text/calendar"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImport(file);
              }}
            />
            <button
              type="button"
              disabled={importing}
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Import .ics file
            </button>
            {importMessage ? (
              <p className="mt-2 text-sm text-stone-600">{importMessage}</p>
            ) : null}
          </section>

          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-stone-500">
              Export calendar
            </h3>
            <p className="mb-3 text-sm text-stone-600">
              Download your Study Haul schedule as an .ics file for Google Calendar, Outlook, or
              Apple Calendar.
            </p>
            <select
              value={exportCourseId}
              onChange={(e) => setExportCourseId(e.target.value)}
              className="mb-3 w-full rounded-lg border border-orange-200 px-3 py-2 text-sm"
            >
              <option value="">All calendars</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            <label className="mb-3 flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={exportInclude === "events"}
                onChange={(e) => setExportInclude(e.target.checked ? "events" : "all")}
                className="rounded border-orange-300 text-orange-500"
              />
              Events only (skip assignments and class meetings)
            </label>
            <button
              type="button"
              disabled={exporting}
              onClick={() => void handleExport()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-orange-200 bg-white py-2.5 text-sm font-semibold text-orange-700 hover:bg-orange-50 disabled:opacity-60"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download .ics file
            </button>
            {exportMessage ? (
              <p className="mt-2 text-sm text-stone-600">{exportMessage}</p>
            ) : null}
          </section>

          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-stone-500">
              Integrations
            </h3>
            <div className="space-y-3">
              <CalendarGoogleIntegration
                settings={settings}
                onSettingsChange={onSettingsChange}
              />
              <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-3 text-sm">
                <p className="text-stone-600">
                  Connect LMS calendars to sync assignments automatically.
                </p>
                <Link
                  href="/dashboard?tab=settings"
                  className="mt-2 inline-flex font-semibold text-orange-600 hover:underline"
                >
                  Open LMS connections in Settings →
                </Link>
              </div>
            </div>
          </section>
        </div>

        {saving ? (
          <p className="border-t border-orange-50 px-5 py-2 text-xs text-stone-500">
            Saving…
          </p>
        ) : null}

        <div className="border-t border-orange-100 px-5 py-3">
          <button
            type="button"
            onClick={() => void save({ ...DEFAULT_CALENDAR_SETTINGS })}
            className="text-xs font-semibold text-stone-500 hover:text-stone-700"
          >
            Reset to defaults
          </button>
        </div>
      </div>
    </div>
  );
}
