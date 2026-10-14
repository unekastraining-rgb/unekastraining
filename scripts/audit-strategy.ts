/**
 * Strategy goal audit — prints requirement status and runs automated verifiers.
 * Run: npm run audit:strategy
 */
import "dotenv/config";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { getFreeAIProviderStatus } from "../src/lib/ai/config";
import { listConfiguredAIProviders } from "../src/lib/ai";

function run(label: string, command: string) {
  console.log(`\n▶ ${label}`);
  execSync(command, { stdio: "inherit", env: process.env });
}

function assertLoopSurface(label: string, relativePath: string, needle: string) {
  const source = readFileSync(join(process.cwd(), relativePath), "utf8");
  if (!source.includes(needle)) {
    throw new Error(`${label}: expected "${needle}" in ${relativePath}`);
  }
  console.log(`  ✓ ${label}`);
}

function runLoopSurfaceChecks() {
  console.log("\n▶ Loop surface checks");
  assertLoopSurface("locker materials", "src/components/materials/MaterialOpenActions.tsx", "luckyQuizHref");
  assertLoopSurface("six recommendations", "src/components/study/SixRecommendationsPanel.tsx", "SearchLoopQuickLinks");
  assertLoopSurface("hub chat url course resolve", "src/components/hub/AcademicHub.tsx", "resolveUrlCourseId");
  assertLoopSurface("demo onboarding", "src/components/hub/FirstRunOnboarding.tsx", "DemoColdStartImport");
  assertLoopSurface("quiz source badge", "app/quizzes/quizzes-view.tsx", "QuizSourceBadge");
  assertLoopSurface("quizzes list loop", "app/quizzes/quizzes-view.tsx", "StudyLoopStrip");
  assertLoopSurface(
    "grade school lesson",
    "src/components/grade-school/GradeSchoolLessonView.tsx",
    "StudyLoopStrip",
  );
  assertLoopSurface("course dashboard", "src/components/courses/CourseDashboard.tsx", "Open Study");
  assertLoopSurface(
    "study topic toolkit",
    "src/components/courses/StudyTopicToolkit.tsx",
    "luckyQuizHref",
  );
  assertLoopSurface("course detail", "app/courses/[id]/course-detail-view.tsx", "StudyTopicToolkit");
  assertLoopSurface("hub study now card", "src/components/hub/HubDashboardTab.tsx", "HubStudyNowCard");
  assertLoopSurface("hub upcoming tasks", "src/components/hub/HubDashboardTab.tsx", "Upcoming tasks");
  assertLoopSurface("hub jump back in", "src/components/hub/HubDashboardTab.tsx", "Jump back in");
  assertLoopSurface("quiz taker loop", "app/quizzes/[id]/quiz-taker.tsx", "StudyLoopStrip");
  assertLoopSurface("quiz taker badge", "app/quizzes/[id]/quiz-taker.tsx", "QuizSourceBadge");
  assertLoopSurface("telemetry mastery", "src/components/csl/EcosystemDashboard.tsx", "MasteryTree");
  assertLoopSurface("notifications loop data", "src/lib/notifications.ts", "loopCourseId");
  assertLoopSurface(
    "course progress story",
    "src/components/courses/CourseProgressStory.tsx",
    "teachMeHref",
  );
  assertLoopSurface(
    "core selection loop",
    "src/components/core/CoreCourseActionBar.tsx",
    "data-core-selection-loop",
  );
  assertLoopSurface(
    "core assist study loop",
    "src/components/core/CoreNotesWorkspace.tsx",
    "assistStudyLoop",
  );
  assertLoopSurface(
    "study course topics",
    "src/components/study/StudyCourseTopics.tsx",
    "Open in Study",
  );
  assertLoopSurface(
    "quiz failover hint",
    "src/components/quizzes/QuizGenerationError.tsx",
    "Settings → AI",
  );
  assertLoopSurface("study this card", "src/components/study/StudyThisCard.tsx", "coreStudyPackHref");
  assertLoopSurface(
    "study this demo import",
    "src/components/study/StudyThisCard.tsx",
    "DemoColdStartImport",
  );
  assertLoopSurface("pdf annotate loop bar", "src/components/core/PdfInkViewer.tsx", "data-pdf-loop-bar");
  assertLoopSurface("core studio loop", "src/components/core/CoreStudioPanel.tsx", "sixChunkingHref");
  assertLoopSurface("search results clean", "src/components/search/SearchResultsList.tsx", "SEARCH_TYPE_LABELS");
  assertLoopSurface(
    "settings failover snippet",
    "src/components/hub/settings/SettingsPanel.tsx",
    "Copy failover .env snippet",
  );
  assertLoopSurface("study hub loop", "app/study/study-hub-view.tsx", "StudyLoopStrip");
  assertLoopSurface(
    "schedule proposal six",
    "src/components/planner/ScheduleProposalChangeList.tsx",
    "Preview Six session",
  );
  assertLoopSurface("hub sections menu", "src/components/hub/HubSectionsMenu.tsx", "The Haul");
  assertLoopSurface("the haul workspace", "src/components/haul/TheHaulWorkspace.tsx", "localStorage");
  assertLoopSurface(
    "complete assignment",
    "src/components/hub/CompleteAssignmentButton.tsx",
    "complete",
  );
  assertLoopSurface("six guided session", "src/components/study/SixGuidedSession.tsx", "StudyLoopStrip");
  assertLoopSurface("blurting guided", "src/components/study/GuidedStudyActivity.tsx", "StudyLoopStrip");
  assertLoopSurface("study session runner", "src/components/study/StudySessionRunner.tsx", "StudyLoopStrip");
  assertLoopSurface("lucky engine loop", "app/study/lucky/lucky-engine-view.tsx", "StudyLoopStrip");
  assertLoopSurface("mixed review loop", "app/study/mixed/mixed-review-view.tsx", "StudyLoopStrip");
  assertLoopSurface("code practice loop", "src/components/study/CodePracticeWorkspace.tsx", "StudyLoopStrip");
  assertLoopSurface("flashcards loop", "app/flashcards/flashcards-view.tsx", "StudyLoopStrip");
  assertLoopSurface("core outcome strip", "src/components/core/CoreLoopOutcomeStrip.tsx", "blurtingHref");
  assertLoopSurface("core course action bar", "src/components/core/CoreCourseActionBar.tsx", "coreStudyPackHref");
  assertLoopSurface("core study split sticky", "src/components/core/CoreStudySplit.tsx", "sticky");
  assertLoopSurface("ocr upload cold start", "src/components/materials/AddCourseMaterialModal.tsx", "coreStudyPackHref");
  assertLoopSurface("core url course resolve", "src/components/core/CoreNotesWorkspace.tsx", "resolveCoreCourseId");
  assertLoopSurface("study hub url course resolve", "app/study/study-hub-view.tsx", "resolveUrlCourseId");
  assertLoopSurface("study loop focus topic", "src/components/study/StudyLoopStrip.tsx", "resolveLoopFocusTopic");
  assertLoopSurface("quizzes url course resolve", "app/quizzes/quizzes-view.tsx", "resolveUrlCourseId");
  assertLoopSurface("six url course resolve", "src/components/study/SixGuidedSession.tsx", "resolveUrlCourseId");
  assertLoopSurface("six loop focus topic", "src/components/study/SixGuidedSession.tsx", "resolveLoopFocusTopic");
  assertLoopSurface("flashcards url course resolve", "app/flashcards/flashcards-view.tsx", "resolveUrlCourseId");
  assertLoopSurface("lucky engine loop topic", "app/study/lucky/lucky-engine-view.tsx", "resolveLoopFocusTopic");
  assertLoopSurface("mixed review loop topic", "app/study/mixed/mixed-review-view.tsx", "resolveLoopFocusTopic");
  assertLoopSurface("code practice url course", "src/components/study/CodePracticeWorkspace.tsx", "resolveUrlCourseId");
  assertLoopSurface("blurting url course resolve", "app/study/blurting/page.tsx", "resolveUrlCourseId");
  assertLoopSurface("teach-me url course resolve", "app/study/teach-me/teach-me-client.tsx", "resolveUrlCourseId");
  assertLoopSurface("guided study loop topic", "src/components/study/GuidedStudyActivity.tsx", "resolveLoopFocusTopic");
  assertLoopSurface("session runner loop topic", "src/components/study/StudySessionRunner.tsx", "focusTopic={topicName}");
}

function runGoodNotesCodeChecks() {
  console.log("\n▶ GoodNotes-adjacent Core checks");
  assertLoopSurface("pdf annotate loop bar", "src/components/core/PdfInkViewer.tsx", "data-pdf-loop-bar");
  assertLoopSurface("pdf annotate teach me", "src/components/core/PdfInkViewer.tsx", "teachMeHref");
  assertLoopSurface("ink toolbar touch", "src/components/core/InkToolbar.tsx", "touch-manipulation");
  assertLoopSurface("touch chrome PDF bar", "src/components/TouchChromeGuard.tsx", "data-pdf-loop-bar");
  assertLoopSurface("notebook paper CSS", "app/globals.css", "data-notebook-paper");
  assertLoopSurface("PDF annotate paper", "src/components/core/PdfAnnotatedPage.tsx", "data-notebook-paper");
  assertLoopSurface("PDF annotate active page", "src/components/core/PdfAnnotatedPage.tsx", "data-page-active");
  assertLoopSurface("PDF desk scrollport", "src/components/core/PdfInkViewer.tsx", "data-notebook-desk");
  assertLoopSurface("continuous notebook desk", "src/components/core/NotebookContinuousDesk.tsx", "data-notebook-desk");
  assertLoopSurface("continuous notebook paper", "src/components/core/NotebookContinuousDesk.tsx", "data-notebook-paper");
  assertLoopSurface("notebook page frame paper", "src/components/core/NotebookPageFrame.tsx", "data-notebook-paper");
  assertLoopSurface("core course action bar touch", "src/components/core/CoreCourseActionBar.tsx", "touch-manipulation");
  assertLoopSurface("pen toolbar touch", "src/components/core/toolbar/CoreToolbarPenPanel.tsx", "touch-manipulation");
}

function runColdStartQuizRouteChecks() {
  console.log("\n▶ Cold-start Lucky route checks");
  const surfaces = [
    "src/components/courses/CourseDashboard.tsx",
    "src/components/courses/StudyTopicToolkit.tsx",
    "src/components/materials/MaterialOpenActions.tsx",
  ];
  for (const relativePath of surfaces) {
    const source = readFileSync(join(process.cwd(), relativePath), "utf8");
    if (!source.includes("luckyQuizHref")) {
      throw new Error(`${relativePath}: expected luckyQuizHref`);
    }
    if (/fetch\([`'"]\/api\/quizzes[`'"]/.test(source)) {
      throw new Error(`${relativePath}: cold-start surfaces must not POST /api/quizzes directly`);
    }
    console.log(`  ✓ ${relativePath}`);
  }
}

function runQuizSmoke(hasFailover: boolean): boolean {
  console.log("\n▶ Live Gemini quiz smoke");
  try {
    execSync("npm run smoke:quiz", { stdio: "inherit", env: process.env });
    return true;
  } catch (error) {
    const execError = error as { status?: number };
    if (execError.status === 2 && !hasFailover) {
      console.log(
        "\n⊘ smoke:quiz SKIP — Gemini capacity/quota (no Groq/OpenRouter failover). Add GROQ_API_KEY or OPENROUTER_API_KEY for live failover proof.",
      );
      return false;
    }
    throw error;
  }
}

function main() {
  const status = getFreeAIProviderStatus();
  const freeChain = status.activeChain.filter((name) => name !== "openai");
  const hasFailover = freeChain.length >= 2;

  console.log("Study Haul strategy audit\n");
  console.log("1. Core → Six → Lucky loop");
  console.log("   code: StudyLoopStrip + loop-hrefs across hub/study/core/quizzes");
  console.log("   manual: iPad tap-through on chrome buttons (not automated)");

  console.log("\n2. Free-tier quiz quality");
  console.log("   configured:", listConfiguredAIProviders().join(", ") || "(none)");
  console.log("   free chain:", freeChain.join(" → ") || "(none)");
  console.log(
    "   failover keys:",
    `groq=${status.groq ? "yes" : "no"}`,
    `openrouter=${status.openrouter ? "yes" : "no"}`,
  );

  console.log("\n3. Cold start without uploads");
  console.log("   code: backfill + pack=1 + OCR paths + topic strips");
  console.log("   manual: demo → Study pack → Six → Lucky → Blurt E2E");

  console.log("\n4. GoodNotes-adjacent Core");
  console.log("   code: ink/PDF loop bars, paper CSS, ink OCR → Lucky/Six");
  console.log("   manual: iPad PDF annotate + pen toolbar feel");

  run("Strategy unit tests", "npm run test:strategy");
  runLoopSurfaceChecks();
  runGoodNotesCodeChecks();
  runColdStartQuizRouteChecks();
  run("Cold-start loop smoke", "npm run smoke:cold-start");
  run("Demo import cold-start smoke", "npm run smoke:demo-import");
  run("OCR cold-start loop smoke", "npm run smoke:ocr-loop");
  run("Canvas cold-start loop smoke", "npm run smoke:canvas-loop");
  run("Moodle cold-start loop smoke", "npm run smoke:moodle-loop");
  run("Core ink/PDF loop smoke", "npm run smoke:core-loop");
  run("Search loop smoke", "npm run smoke:search-loop");
  run("Flashcards loop smoke", "npm run smoke:flashcards-loop");
  run("Offline quiz bank smoke", "npm run smoke:offline-quiz");
  run("Teach-me loop smoke", "npm run smoke:teach-me-loop");
  run("Mock AI failover smoke", "npm run smoke:failover-mock");
  run("Runtime loop smoke", "npm run smoke:runtime-loop");
  run("AI chain check", "npm run check:ai-chain");
  const quizOk = runQuizSmoke(hasFailover);

  if (hasFailover) {
    run("AI failover smoke", "npm run smoke:failover");
  } else {
    console.log("\n⊘ smoke:failover SKIP — add GROQ_API_KEY or OPENROUTER_API_KEY for live failover proof");
  }

  run("Device loop checklist", "npm run smoke:device-loop");

  console.log("\n✓ Automated strategy audit complete.");
  if (!quizOk) {
    console.log("  Quiz smoke skipped (transient Gemini) — chain + unit tests still green.");
  }

  console.log("\nStrategy completion checklist:");
  console.log("  [code] 1. Core→Six→Lucky loop — StudyLoopStrip + search/chat/schedule/materials");
  console.log("  [manual] 1. iPad tap-through — npm run smoke:device-loop (43 steps)");
  console.log(
    `  [${hasFailover ? "live" : "keys"}] 2. Free-tier quiz — Gemini${hasFailover ? "+failover" : " only"}; offline topic-bank smoke always runs`,
  );
  console.log("  [code] 3. Cold start — backfill, pack=1, OCR, Study this → Core");
  console.log("  [manual] 3. Device E2E — demo import through Blurt");
  console.log("  [code] 4. GoodNotes Core — ink/PDF/paper CSS + loop from annotate");
  console.log("  [manual] 4. iPad PDF annotate + pen toolbar feel");
}

main();
