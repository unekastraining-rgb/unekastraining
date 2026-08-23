"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Link2, Palette, RefreshCw, Sparkles, Brain, Bell } from "lucide-react";

import { AiCourseBuilder } from "@/components/courses/AiCourseBuilder";
import { AccountPanel } from "@/components/hub/settings/AccountPanel";
import { HubCalendarSettings } from "@/components/hub/settings/HubCalendarSettings";
import { requestDesktopNotificationPermission } from "@/components/hub/DesktopNotificationWatcher";
import { hubTabPath } from "@/lib/hub/tabs";
import { LMS_PROVIDERS } from "@/lib/lms/types";
import type { AiSourceMode, AppSettings } from "@/lib/settings/app-settings";
import { DEFAULT_APP_SETTINGS } from "@/lib/settings/app-settings";
import { THEME_TEMPLATES } from "@/lib/theme/templates";
import { useTheme } from "@/lib/theme/ThemeProvider";
import type { ThemeTemplateId } from "@/lib/theme/types";
import { PaletteLibrary } from "@/components/customization/PaletteLibrary";
import { ColorPicker } from "@/components/customization/ColorPicker";
import { syncMoodleFromBrowser } from "@/lib/lms/moodle-browser-sync";

export function SettingsPanel() {
  const router = useRouter();
  const { settings, updateSettings, loading } = useTheme();
  const [lmsUrl, setLmsUrl] = useState("");
  const [lmsToken, setLmsToken] = useState("");
  const [selectedProvider, setSelectedProvider] = useState(LMS_PROVIDERS[0].id);
  const [lmsMessage, setLmsMessage] = useState<string | null>(null);
  const [testingBlackboard, setTestingBlackboard] = useState(false);
  const [testingMoodle, setTestingMoodle] = useState(false);
  const [syncingMoodle, setSyncingMoodle] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [savingAi, setSavingAi] = useState(false);
  const [connections, setConnections] = useState<
    Array<{
      id: string;
      provider: string;
      status: string;
      baseUrl: string | null;
      lastSyncedAt: string | null;
    }>
  >([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("lmsConnected");
    const lmsError = params.get("lmsError");
    const lmsSync = params.get("lmsSync");
    if (connected) {
      setLmsMessage(lmsSync ?? "LMS connected and synced.");
      router.replace(hubTabPath("settings"), { scroll: false });
    }
    if (lmsError) setLmsMessage(`LMS OAuth error: ${lmsError}`);

    void fetch("/api/preferences")
      .then((response) => response.json())
      .then((data) => {
        if (data.success && data.appSettings) setAppSettings(data.appSettings);
      })
      .catch(() => {});

    void fetch("/api/lms/connect")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) setConnections(data.connections);
      })
      .catch(() => {});

    void fetch("/api/lms/moodle/credentials")
      .then((response) => response.json())
      .then((data) => {
        if (!data.success) return;
        setSelectedProvider("MOODLE");
        setLmsUrl(data.baseUrl ?? "");
        setLmsToken(data.accessToken ?? "");
        if (data.source === "env") {
          setLmsMessage("Using Moodle credentials from .env — click Sync from this device to import.");
        }
      })
      .catch(() => {});
  }, []);

  async function connectLms() {
    setLmsMessage(null);
    const response = await fetch("/api/lms/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: selectedProvider,
        baseUrl: lmsUrl || undefined,
        accessToken: lmsToken || undefined,
      }),
    });
    const data = await response.json();
    setLmsMessage(data.message ?? data.error ?? "Saved.");
    if (data.success && data.connection) {
      setConnections((current) => [
        data.connection,
        ...current.filter((item) => item.provider !== data.connection.provider),
      ]);
      if (selectedProvider === "MOODLE" && (lmsUrl.trim() || lmsToken.trim())) {
        await syncMoodleBrowser();
      }
    }
  }

  async function syncLms(provider: string, demo = false) {
    if (provider === "MOODLE" && !demo) {
      await syncMoodleBrowser();
      return;
    }

    const response = await fetch("/api/lms/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, demo }),
    });
    const data = await response.json();
    setLmsMessage(data.result?.message ?? data.error ?? "Sync finished.");
    if (data.success) router.refresh();
  }

  async function syncMoodleBrowser() {
    setSyncingMoodle(true);
    setLmsMessage(null);
    try {
      let baseUrl = lmsUrl.trim();
      let token = lmsToken.trim();

      if (!baseUrl || !token) {
        const credResponse = await fetch("/api/lms/moodle/credentials");
        const credData = await credResponse.json();
        if (!credData.success) {
          setLmsMessage(credData.error ?? "Enter your Moodle site URL and token first.");
          return;
        }
        baseUrl = credData.baseUrl;
        token = credData.accessToken;
      }

      const result = await syncMoodleFromBrowser(baseUrl, token);
      setLmsMessage(result.message);
      router.refresh();
    } catch (error) {
      setLmsMessage(
        error instanceof Error ? error.message : "Moodle sync failed from this device.",
      );
    } finally {
      setSyncingMoodle(false);
    }
  }

  async function disconnectLms(provider: string) {
    if (
      !window.confirm(
        `Disconnect ${provider.replace(/_/g, " ")}? Your imported courses and assignments will stay in Study Haul.`,
      )
    ) {
      return;
    }

    setLmsMessage(null);
    const response = await fetch("/api/lms/connect", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider }),
    });
    const data = await response.json();
    setLmsMessage(data.message ?? data.error ?? "Disconnected.");
    if (data.success) {
      setConnections((current) => current.filter((item) => item.provider !== provider));
      if (selectedProvider === provider) {
        setLmsUrl("");
        setLmsToken("");
      }
    }
  }

  async function testMoodleConnection() {
    setTestingMoodle(true);
    setLmsMessage(null);
    try {
      const response = await fetch("/api/lms/moodle/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: lmsUrl || undefined,
          accessToken: lmsToken || undefined,
        }),
      });
      const data = await response.json();
      if (!data.success && !data.report) {
        setLmsMessage(data.error ?? "Moodle test failed.");
        return;
      }

      const lines = (data.report?.steps ?? []).map(
        (step: { ok: boolean; label: string; detail?: string }) =>
          `${step.ok ? "✓" : "✗"} ${step.label}${step.detail ? ` — ${step.detail}` : ""}`,
      );
      setLmsMessage([data.report?.summary, ...lines].filter(Boolean).join("\n"));
    } catch {
      setLmsMessage("Moodle test failed — check your URL and token.");
    } finally {
      setTestingMoodle(false);
    }
  }

  async function testBlackboardConnection() {
    setTestingBlackboard(true);
    setLmsMessage(null);
    try {
      const response = await fetch("/api/lms/blackboard/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: lmsUrl || undefined,
          accessToken: lmsToken || undefined,
        }),
      });
      const data = await response.json();
      if (!data.success && !data.report) {
        setLmsMessage(data.error ?? "Blackboard test failed.");
        return;
      }

      const lines = (data.report?.steps ?? []).map(
        (step: { ok: boolean; label: string; detail?: string }) =>
          `${step.ok ? "✓" : "✗"} ${step.label}${step.detail ? ` — ${step.detail}` : ""}`,
      );
      setLmsMessage([data.report?.summary, ...lines].filter(Boolean).join("\n"));
    } catch {
      setLmsMessage("Blackboard test failed — check your URL and token.");
    } finally {
      setTestingBlackboard(false);
    }
  }

  async function saveAiSettings(patch: Partial<AppSettings>) {
    setSavingAi(true);
    const next = { ...appSettings, ...patch };
    setAppSettings(next);
    try {
      await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    } finally {
      setSavingAi(false);
    }
  }

  return (
    <div className="space-y-8">
      <AccountPanel />

      <HubCalendarSettings />

      <section className="card-soft p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-brand-soft p-2.5 text-brand">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-heading text-xl font-bold">Colors & templates</h3>
            <p className="text-body text-sm">
              Pick a look or customize accent colors. Layout stays the same — like
              Edge browser themes — with readable text on a soft canvas.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {THEME_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() =>
                void updateSettings({
                  themeTemplate: template.id as ThemeTemplateId,
                  primaryColor: null,
                  backgroundColor: null,
                  accentColor: null,
                })
              }
              className={`rounded-2xl border p-4 text-left transition ${
                settings.themeTemplate === template.id
                  ? "border-[color-mix(in_srgb,var(--sh-primary)_45%,transparent)] ring-2 ring-[color-mix(in_srgb,var(--sh-primary)_18%,transparent)]"
                  : "border-brand hover:brightness-[0.98]"
              }`}
            >
              <div
                className="h-16 rounded-xl"
                style={{ background: template.gradient }}
              />
              <p className="text-heading mt-3 font-semibold">{template.name}</p>
              <p className="text-body mt-1 text-xs">{template.description}</p>
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <ColorField
            label="Primary color"
            value={settings.primaryColor ?? ""}
            fallback="#ea580c"
            onChange={(value) => void updateSettings({ primaryColor: value || null })}
          />
          <ColorField
            label="Canvas tint (optional)"
            value={settings.backgroundColor ?? ""}
            fallback="#fff8f1"
            onChange={(value) =>
              void updateSettings({ backgroundColor: value || null })
            }
          />
          <ColorField
            label="Accent"
            value={settings.accentColor ?? ""}
            fallback="#0d9488"
            onChange={(value) => void updateSettings({ accentColor: value || null })}
          />
        </div>

        <div className="mt-6 rounded-2xl border border-brand bg-brand-soft/30 p-4">
          <p className="text-heading text-sm font-bold">Built-in palettes</p>
          <p className="text-body mt-1 text-xs">
            Applies across the hub, calendar, Core, and any page with colors & templates.
          </p>
          <div className="mt-3 max-h-96 overflow-y-auto">
            <PaletteLibrary applyGlobally={false} />
          </div>
        </div>
      </section>

      <section className="card-soft p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-teal-100 p-2.5 text-teal-700">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-stone-900">Grade school planner</h3>
            <p className="text-sm text-stone-500">
              For K–8 students: AI class builder, topics by grade, kid-friendly
              chat, and daily study sessions.
            </p>
          </div>
        </div>

        <label className="mt-6 flex items-center justify-between rounded-2xl border border-brand bg-brand-soft/50 px-4 py-4">
          <div>
            <p className="font-semibold text-stone-900">Grade school planner</p>
            <p className="text-sm text-stone-500">
              Unlocks AI class builder, topic plans, and simpler schedule
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.elementaryMode}
            onChange={(event) =>
              void updateSettings({ elementaryMode: event.target.checked })
            }
            className="h-5 w-5 rounded border-brand text-brand"
          />
        </label>

        {settings.elementaryMode ? (
          <div className="mt-6 space-y-4 rounded-2xl border border-teal-200 bg-teal-50/40 p-5">
            <p className="text-sm font-semibold text-teal-900">
              Grade school tools are on — build guided learning plans, not homework lists.
            </p>
            <Link
              href="/dashboard/parent"
              className="inline-flex rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-500"
            >
              Open parent dashboard
            </Link>
            <AiCourseBuilder
              onSaved={() => router.refresh()}
              onError={(message) => {
                if (message) console.error(message);
              }}
            />
          </div>
        ) : (
          <p className="mt-4 text-sm text-stone-500">
            Turn this on to build classes like &quot;Math 4th grade&quot; without a
            syllabus, specify focus topics, and get age-appropriate study help in
            Chat.
          </p>
        )}

        {settings.elementaryMode ? (
          <div className="mt-4">
          <p className="mb-2 text-sm font-semibold text-stone-700">Default calendar view</p>
          <div className="flex flex-wrap gap-2">
            {(["today", "week", "due-soon"] as const).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => void updateSettings({ defaultQuickView: view })}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  settings.defaultQuickView === view
                    ? "bg-brand-soft0 text-white"
                    : "border border-brand text-stone-700"
                }`}
              >
                {view === "due-soon" ? "Due soon" : view === "week" ? "This week" : "Today"}
              </button>
            ))}
          </div>
          </div>
        ) : null}
      </section>

      <section className="card-soft p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-rose-100 p-2.5 text-rose-600">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-stone-900">Desktop notifications</h3>
            <p className="text-sm text-stone-500">
              Browser alerts for overdue work and upcoming deadlines.
            </p>
          </div>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            checked={appSettings.desktopNotifications}
            onChange={(event) => {
              void (async () => {
                if (event.target.checked) {
                  const permission = await requestDesktopNotificationPermission();
                  if (permission !== "granted") {
                    setLmsMessage("Enable notifications in your browser to use this feature.");
                    return;
                  }
                }
                void saveAiSettings({ desktopNotifications: event.target.checked });
              })();
            }}
          />
          Enable desktop notifications
        </label>
      </section>

      <section className="card-soft p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-teal-100 p-2.5 text-teal-700">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-stone-900">AI source control</h3>
            <p className="text-sm text-stone-500">
              Global setting for Chat, quizzes, flashcards, blurting, and teach-back.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={savingAi}
              onClick={() => void saveAiSettings({ aiSourceMode: "course_only" })}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                appSettings.aiSourceMode === "course_only"
                  ? "bg-teal-600 text-white"
                  : "border border-brand text-stone-700"
              }`}
            >
              Course materials only
            </button>
            <button
              type="button"
              disabled={savingAi}
              onClick={() =>
                void saveAiSettings({ aiSourceMode: "course_plus_general" })
              }
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                appSettings.aiSourceMode === "course_plus_general"
                  ? "bg-teal-600 text-white"
                  : "border border-brand text-stone-700"
              }`}
            >
              Course + general knowledge
            </button>
          </div>

          <label className="flex items-center gap-2 text-sm text-stone-600">
            <input
              type="checkbox"
              checked={appSettings.aiUseCourseMaterialsInChat}
              onChange={(event) =>
                void saveAiSettings({
                  aiUseCourseMaterialsInChat: event.target.checked,
                })
              }
            />
            Include uploaded course materials in Chat context
          </label>
        </div>
      </section>

      <section className="card-soft p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-violet-100 p-2.5 text-violet-700">
            <Link2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-stone-900">LMS connections</h3>
            <p className="text-sm text-stone-500">
              Connect Blackboard, Canvas, Moodle, or Google Classroom to import syllabi and due dates.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {LMS_PROVIDERS.map((provider) => (
            <button
              key={provider.id}
              type="button"
              onClick={() => setSelectedProvider(provider.id)}
              className={`rounded-2xl border p-4 text-left ${
                selectedProvider === provider.id
                  ? "border-violet-300 bg-violet-50"
                  : "border-brand"
              }`}
            >
              <p className="font-semibold text-stone-900">{provider.name}</p>
              <p className="mt-1 text-sm text-stone-500">{provider.description}</p>
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={lmsUrl}
            onChange={(event) => setLmsUrl(event.target.value)}
            placeholder={
              selectedProvider === "MOODLE"
                ? "Moodle site root (e.g. https://moodle.lsua.edu)"
                : "LMS site URL (e.g. https://yourschool.instructure.com)"
            }
            className="rounded-xl border border-brand px-4 py-3 text-sm"
          />
          <input
            value={lmsToken}
            onChange={(event) => setLmsToken(event.target.value)}
            placeholder={
              selectedProvider === "MOODLE"
                ? "Web Services token (from Security keys / Manage tokens)"
                : "API token (optional for now)"
            }
            className="rounded-xl border border-brand px-4 py-3 text-sm"
          />
        </div>

        {selectedProvider === "MOODLE" ? (
          <p className="mt-2 text-xs leading-relaxed text-stone-500">
            Use only your Moodle <strong>site address</strong> (e.g.{" "}
            <code className="rounded bg-stone-100 px-1">https://moodle.lsua.edu</code>), not the
            token page URL. Create a token at{" "}
            <code className="rounded bg-stone-100 px-1">/user/managetoken.php</code>, then paste
            the token here — not the page link. Tokens are exactly 32 characters (letters and numbers).
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void connectLms()}
            disabled={loading}
            className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
          >
            Save connection
          </button>
          {selectedProvider === "CANVAS" ? (
            <a
              href={`/api/lms/oauth/start?provider=CANVAS&baseUrl=${encodeURIComponent(lmsUrl)}`}
              className="inline-flex items-center rounded-xl border border-violet-300 bg-violet-50 px-5 py-2.5 text-sm font-semibold text-violet-800 hover:bg-violet-100"
            >
              Connect Canvas with OAuth
            </a>
          ) : null}
          {selectedProvider === "BLACKBOARD" && lmsUrl ? (
            <a
              href={`/api/lms/oauth/start?provider=BLACKBOARD&baseUrl=${encodeURIComponent(lmsUrl)}`}
              className="inline-flex items-center rounded-xl border border-violet-300 bg-violet-50 px-5 py-2.5 text-sm font-semibold text-violet-800 hover:bg-violet-100"
            >
              Connect Blackboard with OAuth
            </a>
          ) : null}
          {selectedProvider === "MOODLE" ? (
            <p className="w-full text-xs text-stone-500">
              Moodle sync runs from <strong>this device</strong> (your browser talks to Moodle
              directly). Credentials can come from <code className="rounded bg-stone-100 px-1">.env</code>{" "}
              (<code className="rounded bg-stone-100 px-1">MOODLE_URL</code>,{" "}
              <code className="rounded bg-stone-100 px-1">MOODLE_TOKEN</code>) or Settings below.
            </p>
          ) : null}
          {selectedProvider === "GOOGLE_CLASSROOM" ? (
            <a
              href="/api/lms/oauth/start?provider=GOOGLE_CLASSROOM"
              className="inline-flex items-center rounded-xl border border-violet-300 bg-violet-50 px-5 py-2.5 text-sm font-semibold text-violet-800 hover:bg-violet-100"
            >
              Connect Google Classroom
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => void syncLms(selectedProvider)}
            disabled={selectedProvider === "MOODLE" && syncingMoodle}
            className="inline-flex items-center gap-2 rounded-xl border border-violet-200 px-5 py-2.5 text-sm font-semibold text-violet-700 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${syncingMoodle && selectedProvider === "MOODLE" ? "animate-spin" : ""}`} />
            {selectedProvider === "MOODLE" ? "Sync from this device" : "Sync now"}
          </button>
          {selectedProvider === "MOODLE" ? (
            <button
              type="button"
              onClick={() => void testMoodleConnection()}
              disabled={testingMoodle}
              className="rounded-xl border border-violet-200 px-5 py-2.5 text-sm font-semibold text-violet-700 disabled:opacity-60"
            >
              {testingMoodle ? "Testing…" : "Test Moodle connection"}
            </button>
          ) : null}
          {selectedProvider === "BLACKBOARD" ? (
            <button
              type="button"
              onClick={() => void testBlackboardConnection()}
              disabled={testingBlackboard}
              className="rounded-xl border border-violet-200 px-5 py-2.5 text-sm font-semibold text-violet-700 disabled:opacity-60"
            >
              {testingBlackboard ? "Testing…" : "Test Blackboard"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void syncLms(selectedProvider, true)}
            className="rounded-xl border border-brand px-5 py-2.5 text-sm font-semibold text-stone-600"
          >
            Demo import
          </button>
        </div>

        {lmsMessage ? (
          <p className="mt-4 whitespace-pre-wrap rounded-xl bg-violet-50 px-4 py-3 text-sm text-violet-800">
            {lmsMessage}
          </p>
        ) : null}

        {connections.length > 0 ? (
          <div className="mt-6 space-y-2">
            {connections.map((connection) => (
              <div
                key={connection.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand px-4 py-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-stone-900">{connection.provider}</p>
                  <p className="truncate text-stone-500">{connection.baseUrl ?? "No URL yet"}</p>
                  {connection.lastSyncedAt ? (
                    <p className="text-xs text-stone-400">
                      Last synced{" "}
                      {new Date(connection.lastSyncedAt).toLocaleString()}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                    {connection.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => void disconnectLms(connection.provider)}
                    className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function ColorField({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value: string;
  fallback: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2 text-sm">
      <span className="font-semibold text-stone-700">{label}</span>
      <div className="flex items-center gap-3">
        <ColorPicker compact value={value || fallback} onChange={onChange} label={label} />
        <code className="text-xs text-stone-500">{value || fallback}</code>
      </div>
    </div>
  );
}
