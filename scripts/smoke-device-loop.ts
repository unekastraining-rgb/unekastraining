/**
 * Device E2E checklist for strategy goals #1 + #3 + #4 (manual iPad verification).
 * Run: npm run smoke:device-loop
 */
import { demoColdStartCourseEntry } from "../src/lib/lms/demo-cold-start";
import {
  blurtingHref,
  coreStudyPackHref,
  luckyQuizHref,
  sixChunkingHref,
  teachMeHref,
} from "../src/lib/study/loop-hrefs";

function main() {
  const entry = demoColdStartCourseEntry("demo-cs201", "CS 201 — Data Structures", "CS201");
  const courseId = entry.id;
  const topic = entry.focusTopic!;

  const steps = [
    {
      label: "Hub → Import demo courses",
      href: "/dashboard",
      tap: "First-run onboarding → Import demo → Pack / Six / Lucky / Blurt on demo course",
    },
    {
      label: "Settings LMS demo sync loop",
      href: "/dashboard?tab=settings",
      tap: "Settings → LMS → Demo import → Pack / Six / Lucky / Blurt on synced courses",
    },
    {
      label: "Core study pack (cold start)",
      href: coreStudyPackHref(courseId, topic),
      tap: "Wait for pack=1 auto-build",
    },
    {
      label: "Six chunking",
      href: sixChunkingHref(courseId, topic),
      tap: "Complete one step → Open Lucky",
    },
    {
      label: "Lucky quiz",
      href: luckyQuizHref(courseId, null, topic),
      tap: "Submit quiz → Blurt gaps if missed",
    },
    {
      label: "Quizzes list loop",
      href: `/quizzes?courseId=${courseId}`,
      tap: "Quizzes page → StudyLoopStrip → Pack / Six / Lucky / Blurt under generator",
    },
    {
      label: "Blurt gaps",
      href: blurtingHref(courseId, null, topic),
      tap: "Make Lucky quiz from gaps",
    },
    {
      label: "Core PDF loop",
      href: `/core?courseId=${courseId}`,
      tap: "Open PDF → annotate → Lucky / Teach Me / Blurt from this page",
    },
    {
      label: "Core course action bar",
      href: `/core?courseId=${courseId}`,
      tap: "Core desk → course action bar → Pack / Six / Lucky / Blurt",
    },
    {
      label: "Search focus shortcuts",
      href: "/dashboard",
      tap: "Tap search bar (empty) → Core → Six → Lucky chips",
    },
    {
      label: "Calendar sidebar loop",
      href: "/calendar",
      tap: "Calendar sidebar → Core → Six → Lucky chips",
    },
    {
      label: "Calendar event loop",
      href: "/calendar",
      tap: "Open assignment/exam → Study loop Pack / Six / Lucky",
    },
    {
      label: "Resources loop",
      href: "/resources",
      tap: "Resources page → loop strip under header",
    },
    {
      label: "Courses loop (cold start)",
      href: "/courses",
      tap: "Add class page → loop strip after syllabus upload",
    },
    {
      label: "Classes tab loop",
      href: "/dashboard?tab=classes",
      tap: "Classes tab → each course card → Pack / Six / Lucky / Blurt",
    },
    {
      label: "Hub chat loop",
      href: "/dashboard?tab=chat",
      tap: "Chat tab → select class → Pack / Six / Lucky / Blurt chips",
    },
    {
      label: "Mobile hub menu loop",
      href: "/dashboard",
      tap: "Menu (iPad) → loop chips under Study Haul header",
    },
    {
      label: "Assignment Lucky",
      href: "/dashboard",
      tap: "Schedule → Assignments → Pack / Six / Lucky / Blurt on open item",
    },
    {
      label: "Study this (cold start)",
      href: "/dashboard",
      tap: "Schedule → Study this → lands in Core pack=1",
    },
    {
      label: "Study this demo import",
      href: "/dashboard",
      tap: "Schedule → Study this → Syllabus tab → Import demo courses → Pack / Six / Lucky / Blurt",
    },
    {
      label: "AI scheduling proposal loop",
      href: "/dashboard",
      tap: "Schedule → AI scheduling card → Suggest → each proposal row → Pack / Six / Lucky / Blurt",
    },
    {
      label: "Locker material loop",
      href: "/dashboard?tab=locker",
      tap: "Locker → material row → Pack / Six / Lucky / Blurt chips",
    },
    {
      label: "OCR syllabus photo → pack",
      href: "/dashboard?tab=locker",
      tap: "Add material → photo syllabus → auto-opens Core pack=1 when topics seed",
    },
    {
      label: "Notebook shelf loop",
      href: "/core/shelf",
      tap: "Core shelf → loop strip → open notebook → desk pill Pack/Lucky",
    },
    {
      label: "Telemetry mastery loop",
      href: "/dashboard/telemetry",
      tap: "Mastery tree course → StudyLoopStrip → Pack / Six / Lucky",
    },
    {
      label: "Grade school lesson loop",
      href: "/study/grade-school?courseId=demo-cs201&step=0",
      tap: "Guided lesson → Core → Six → Lucky strip under lesson header",
    },
    {
      label: "Parent dashboard loop",
      href: "/dashboard/parent",
      tap: "Parent dashboard → each plan → Pack / Six / Lucky / Blurt chips",
    },
    {
      label: "Course detail loop",
      href: "/courses/demo-cs201",
      tap: "Course page → StudyLoopStrip + topic toolkit → Pack / Six / Lucky",
    },
    {
      label: "Search zero-results loop",
      href: "/search?q=zzzznonexistentquery",
      tap: "Search with no hits → Core → Six → Lucky chips below empty state",
    },
    {
      label: "Hub needs-attention loop",
      href: "/dashboard",
      tap: "Schedule → Needs attention items → Pack / Six / Lucky / Blurt per item",
    },
    {
      label: "Hub upcoming tasks loop",
      href: "/dashboard",
      tap: "Hub home → Upcoming tasks → Pack / Six / Lucky / Blurt per row",
    },
    {
      label: "Hub today schedule loop",
      href: "/dashboard",
      tap: "Hub home → Today's schedule event → Pack / Six / Lucky / Blurt",
    },
    {
      label: "Hub jump back in loop",
      href: "/dashboard",
      tap: "Hub home → Jump back in card → Pack / Six / Lucky / Blurt",
    },
    {
      label: "Hub notifications loop",
      href: "/dashboard",
      tap: "Bell icon → notification row → Pack / Six / Lucky / Blurt",
    },
    {
      label: "Grade school hub loop",
      href: "/dashboard",
      tap: "Grade school mode → hub → plan cards + next lesson → Pack / Six / Lucky / Blurt",
    },
    {
      label: "Elementary planner loop",
      href: "/dashboard",
      tap: "Elementary schedule → today's plan card → Pack / Six / Lucky / Blurt under Start",
    },
    {
      label: "Weekly schedule notebook loop",
      href: "/dashboard",
      tap: "Hub home → Nerd's Schedule → tap study block (desktop) or mobile list → Pack / Six / Lucky / Blurt; pace notes chips too",
    },
    {
      label: "Study hub loop",
      href: `/study?courseId=${courseId}`,
      tap: "Study hub → StudyLoopStrip + Six recommendations → Pack / Six / Lucky / Blurt",
    },
    {
      label: "Lucky engine loop",
      href: `/study/lucky?courseId=${courseId}`,
      tap: "Lucky engine → StudyLoopStrip → Start session → loop chips in runner",
    },
    {
      label: "Mixed review loop",
      href: `/study/mixed?courseId=${courseId}`,
      tap: "Mixed review → StudyLoopStrip → Pack / Six / Lucky from review card",
    },
    {
      label: "Code practice loop",
      href: "/study/practice",
      tap: "Code practice → pick course → StudyLoopStrip → Lucky from results",
    },
    {
      label: "Teach me loop",
      href: teachMeHref(courseId, null, topic),
      tap: "Teach me → StudyLoopStrip → evaluate → Lucky from gaps",
    },
    {
      label: "Flashcards loop",
      href: `/flashcards?courseId=${courseId}&topic=${encodeURIComponent(topic)}`,
      tap: "Flashcards → StudyLoopStrip → Pack / Six / Lucky from deck header",
    },
  ];

  console.log("Study Haul device loop checklist (manual iPad / tablet)\n");
  for (const [index, step] of steps.entries()) {
    console.log(`${index + 1}. ${step.label}`);
    console.log(`   href: ${step.href}`);
    console.log(`   tap:  ${step.tap}`);
  }
  console.log("\nTouch chrome: hub buttons, PDF toolbar, pen panel, selection loop bar.");
  console.log("PASS: checklist printed — complete on a real device to close strategy goal.");
}

main();
