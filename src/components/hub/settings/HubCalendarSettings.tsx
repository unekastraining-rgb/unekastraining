"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Download, Loader2, Upload } from "lucide-react";

import { CalendarGoogleIntegration } from "@/components/calendar/CalendarGoogleIntegration";
import {
  DEFAULT_CALENDAR_SETTINGS,
  type CalendarSettings,
} from "@/lib/calendar/settings";

interface CourseOption {
  id: string;
  title: string;
}

export function HubCalendarSettings() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [calendarSettings, setCalendarSettings] = useState<CalendarSettings>(
    DEFAULT_CALENDAR_SETTINGS,
  );
  const [importCourseId, setImportCourseId] = useState("");
  const [exportCourseId, setExportCourseId] = useState("");
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/courses")
      .then((response) => response.json())
      .then((data) => {
        if (data.success && Array.isArray(data.courses)) {
          setCourses(
            data.courses.map((course: { id: string; title: string }) => ({
              id: course.id,
              title: course.title,
            })),
          );
        }
      })
      .catch(() => {});

    void fetch("/api/calendar/settings")
      .then((response) => response.json())
      .then((data) => {
        if (data.success && data.settings) {
          setCalendarSettings(data.settings as CalendarSettings);
        }
      })
      .catch(() => {});
  }, []);

  const updateCalendarSettings = useCallback(
    async (patch: Partial<CalendarSettings>) => {
      const response = await fetch("/api/calendar/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await response.json();
      if (data.success && data.settings) {
        setCalendarSettings(data.settings as CalendarSettings);
      }
    },
    [],
  );

  async function handleImport(file: File) {
    setImporting(true);
    setMessage(null);
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

      setMessage(
        `Imported ${data.imported} event${data.imported === 1 ? "" : "s"} into your calendar.`,
      );
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to import calendar.",
      );
    } finally {
      setImporting(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    setMessage(null);
    try {
      const params = new URLSearchParams();
      if (exportCourseId) params.set("courseId", exportCourseId);

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

      setMessage("Calendar exported.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to export calendar.",
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <section className="card-soft p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-sky-100 p-2.5 text-sky-700">
          <CalendarDays className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-heading text-xl font-bold">Calendar</h3>
          <p className="text-body text-sm">
            Google sync, .ics import/export, and write-back preferences.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <CalendarGoogleIntegration
          settings={calendarSettings}
          onSettingsChange={updateCalendarSettings}
          oauthReturnTo="hub-settings"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-brand bg-brand-soft/30 p-4">
          <p className="text-sm font-semibold text-stone-900">Import .ics</p>
          <p className="mt-1 text-sm text-stone-600">
            One-time import from Outlook or Apple Calendar exports.
          </p>
          <select
            value={importCourseId}
            onChange={(event) => setImportCourseId(event.target.value)}
            className="mt-3 w-full rounded-xl border border-brand px-3 py-2 text-sm"
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
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleImport(file);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
          >
            {importing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Upload .ics file
          </button>
        </div>

        <div className="rounded-2xl border border-brand bg-brand-soft/30 p-4">
          <p className="text-sm font-semibold text-stone-900">Export .ics</p>
          <p className="mt-1 text-sm text-stone-600">
            Download events, assignments, and class meetings.
          </p>
          <select
            value={exportCourseId}
            onChange={(event) => setExportCourseId(event.target.value)}
            className="mt-3 w-full rounded-xl border border-brand px-3 py-2 text-sm"
          >
            <option value="">All calendars</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={exporting}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-800 hover:bg-sky-50 disabled:opacity-60"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download .ics
          </button>
        </div>
      </div>

      {message ? (
        <p className="mt-4 rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-900">
          {message}
        </p>
      ) : null}

      <Link
        href="/calendar"
        className="mt-4 inline-flex text-sm font-semibold text-brand hover:underline"
      >
        Open full calendar for display settings and time insights →
      </Link>
    </section>
  );
}
