"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";

import { CustomizationProvider } from "@/components/customization/CustomizationProvider";
import { useCompactHubNav } from "@/hooks/useCompactHubNav";
import { triggerLmsBackgroundSync } from "@/lib/lms/background-sync";
import { dispatchLmsSynced } from "@/lib/lms/sync-events";
import { hubTabPath, parseHubDateParam, parseHubTab } from "@/lib/hub/tabs";
import { buildCalendarHref } from "@/lib/calendar/links";
import { resolveUrlCourseId } from "@/lib/study/resolve-url-course-id";

import { AssignmentsTab } from "./AssignmentsTab";
import { BottomNav } from "./BottomNav";
import { ChatTab } from "./ChatTab";
import { ClassesTab } from "./ClassesTab";
import { DesktopNotificationWatcher } from "./DesktopNotificationWatcher";
import { HubDashboardTab } from "./HubDashboardTab";
import { HubTopBar } from "./HubTopBar";
import { LockerTab } from "./LockerTab";
import { SettingsPanel } from "./settings/SettingsPanel";
import type { HubData, HubTab } from "./types";
import type { PlanningNavActive } from "./planning-nav-types";
import { DEFAULT_APP_SETTINGS } from "@/lib/settings/app-settings";

const SidebarNav = dynamic(
  () => import("./SidebarNav").then((mod) => ({ default: mod.SidebarNav })),
  {
    ssr: false,
    loading: () => (
      <aside className="hidden w-60 shrink-0 xl:block xl:w-72" aria-hidden />
    ),
  },
);

export function AcademicHub({
  data,
  initialTab = "hub",
}: {
  data: HubData;
  /** Server-parsed `?tab=` so Settings/Pro opens without waiting on client searchParams. */
  initialTab?: HubTab;
}) {
  const [activeTab, setActiveTab] = useState<HubTab>(initialTab);

  return (
    <CustomizationProvider>
      <AcademicHubShell
        data={data}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      {/* URL sync only — must not block the whole hub behind Suspense. */}
      <Suspense fallback={null}>
        <HubUrlSync setActiveTab={setActiveTab} />
      </Suspense>
    </CustomizationProvider>
  );
}

function HubUrlSync({
  setActiveTab,
}: {
  setActiveTab: (tab: HubTab) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assignmentsView = searchParams.get("view") === "assignments";

  useEffect(() => {
    const tab = parseHubTab(searchParams.get("tab"));
    const focus = searchParams.get("focus");
    const date = parseHubDateParam(searchParams.get("date"));

    if (date && !assignmentsView && !focus) {
      router.replace(buildCalendarHref({ date: searchParams.get("date") ?? undefined }));
      return;
    }

    if (focus || assignmentsView) {
      if (assignmentsView) {
        setActiveTab("hub");
      } else if (tab !== "chat" && tab !== "settings" && tab !== "classes" && tab !== "locker") {
        setActiveTab("hub");
      } else {
        setActiveTab(tab);
      }
    } else if (date) {
      setActiveTab("hub");
    } else {
      setActiveTab(tab);
    }
  }, [assignmentsView, router, searchParams, setActiveTab]);

  return null;
}

function AcademicHubShell({
  data,
  activeTab,
  setActiveTab,
}: {
  data: HubData;
  activeTab: HubTab;
  setActiveTab: (tab: HubTab) => void;
}) {
  const router = useRouter();
  const compactNav = useCompactHubNav();
  const [desktopNotifications, setDesktopNotifications] = useState(
    DEFAULT_APP_SETTINGS.desktopNotifications,
  );
  const [chatPrompt, setChatPrompt] = useState<string | null>(null);
  const [chatCourseId, setChatCourseId] = useState<string | null>(null);
  const [chatTopic, setChatTopic] = useState<string | null>(null);
  const courseIds = data.courses.map((course) => course.id);
  const [planningActive] = useState<PlanningNavActive>("hub");
  const [assignmentsView, setAssignmentsView] = useState(false);
  const lmsRefreshDone = useRef(false);

  // Lightweight URL read for assignments view without suspending the shell.
  useEffect(() => {
    function syncFromLocation() {
      try {
        const params = new URLSearchParams(window.location.search);
        setAssignmentsView(params.get("view") === "assignments");
        const prompt = params.get("prompt");
        const chatCourse = params.get("courseId");
        const topic = params.get("topic");
        const tab = parseHubTab(params.get("tab"));
        if (tab === "chat" && prompt) setChatPrompt(prompt);
        if (tab === "chat" && chatCourse) {
          setChatCourseId(resolveUrlCourseId(chatCourse, courseIds));
        }
        if (tab === "chat" && topic?.trim()) setChatTopic(topic.trim());
      } catch {
        // ignore
      }
    }
    syncFromLocation();
    window.addEventListener("popstate", syncFromLocation);
    return () => window.removeEventListener("popstate", syncFromLocation);
  }, [activeTab, courseIds]);

  const handleTabChange = useCallback(
    (tab: HubTab) => {
      setActiveTab(tab);
      router.replace(hubTabPath(tab), { scroll: false });
    },
    [router, setActiveTab],
  );

  useEffect(() => {
    void fetch("/api/preferences")
      .then((response) => response.json())
      .then((result) => {
        if (result.success && result.appSettings) {
          setDesktopNotifications(result.appSettings.desktopNotifications ?? false);
        }
      })
      .catch(() => {});

    if (!lmsRefreshDone.current) {
      void triggerLmsBackgroundSync().then((synced) => {
        if (!synced || lmsRefreshDone.current) return;
        lmsRefreshDone.current = true;
        dispatchLmsSynced();
        if (!compactNav) router.refresh();
      });
    }
  }, [compactNav, router]);

  return (
    <div
      className="relative min-h-screen overflow-x-clip pb-[calc(5.5rem+env(safe-area-inset-bottom))] xl:pb-8"
      style={{
        background: "var(--sh-gradient, var(--sh-background, #fff8f1))",
        color: "var(--sh-text-heading, #1c1917)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-16 top-24 h-72 w-72 rounded-full blur-3xl"
          style={{ backgroundColor: "var(--sh-primary-soft, rgba(251,146,60,0.16))" }}
        />
        <div
          className="absolute right-0 top-10 h-80 w-80 rounded-full blur-3xl"
          style={{ backgroundColor: "var(--sh-accent-soft, rgba(45,212,191,0.14))" }}
        />
      </div>

      <DesktopNotificationWatcher enabled={desktopNotifications} />

      <HubTopBar
        onOpenSettings={() => handleTabChange("settings")}
        planningActive={planningActive}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <div className="relative hub-shell py-6 lg:py-8">
        <div className="flex gap-6 lg:gap-8 xl:gap-10">
          <SidebarNav active={activeTab} onChange={handleTabChange} />

          <div className="min-w-0 flex-1">
            {assignmentsView ? (
              <AssignmentsTab
                courses={data.courses}
                assignments={data.assignments}
                attention={data.attention}
                progress={data.progress}
                telemetry={data.telemetry}
                onChanged={() => router.refresh()}
              />
            ) : null}

            {activeTab === "hub" && !assignmentsView ? (
              <HubDashboardTab
                user={data.user}
                jumpBackIn={data.jumpBackIn}
                updates={data.updates}
                assignments={data.assignments}
                courses={data.courses}
                todayCalendarEvents={data.todayCalendarEvents}
                todayKey={data.todayKey}
                stats={data.stats}
                attention={data.attention}
                telemetry={data.telemetry}
                gradeSchoolPlans={data.gradeSchoolPlans}
                courseCount={data.courses.length}
                weeklySchedule={data.weeklySchedule}
              />
            ) : null}

            {activeTab === "classes" ? (
              <ClassesTab
                courses={data.courses}
                meetings={data.meetings}
                user={data.user}
                onCourseDeleted={() => router.refresh()}
              />
            ) : null}

            {activeTab === "locker" ? (
              <LockerTab
                courses={data.courses}
                materials={data.materials}
                stats={data.stats}
              />
            ) : null}

            {activeTab === "chat" ? (
              <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
                <div className="hidden rounded-3xl border border-brand card-soft p-8 lg:block">
                  <h2 className="text-2xl font-bold text-stone-900">Study Haul Chat</h2>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-stone-600">
                    Your academic copilot. Ask about deadlines, study plans,
                    assignment breakdowns, or what to focus on today.
                  </p>
                  <div className="mt-8 grid gap-3">
                    <TipCard
                      title="Plan my week"
                      onClick={() => setChatPrompt("Help me plan this week")}
                    />
                    <TipCard
                      title="What's due soon?"
                      onClick={() => setChatPrompt("What's due soon?")}
                    />
                    <TipCard
                      title="Help me study for an exam"
                      onClick={() =>
                        setChatPrompt("Help me study for an exam — what should I focus on?")
                      }
                    />
                  </div>
                </div>
                <ChatTab
                  variant="panel"
                  courses={data.courses}
                  initialCourseId={chatCourseId}
                  initialTopic={chatTopic}
                  pendingPrompt={chatPrompt}
                  onPendingPromptConsumed={() => setChatPrompt(null)}
                />
              </div>
            ) : null}

            {activeTab === "settings" ? <SettingsPanel /> : null}
          </div>
        </div>
      </div>

      <BottomNav active={activeTab} onChange={handleTabChange} />
    </div>
  );
}

function TipCard({
  title,
  onClick,
}: {
  title: string;
  onClick?: () => void;
}) {
  const className =
    "card-soft w-full px-4 py-3 text-left text-sm font-medium text-stone-700 transition hover:bg-brand-soft";

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {title}
      </button>
    );
  }

  return <div className={className}>{title}</div>;
}
