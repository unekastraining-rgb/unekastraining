import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("strategy loop surfaces", () => {
  const surfaces: Array<[string, string, string]> = [
    ["locker materials", "src/components/materials/MaterialOpenActions.tsx", "luckyQuizHref"],
    ["six recommendations", "src/components/study/SixRecommendationsPanel.tsx", "SearchLoopQuickLinks"],
    ["hub chat url course resolve", "src/components/hub/AcademicHub.tsx", "resolveUrlCourseId"],
    ["demo onboarding", "src/components/hub/FirstRunOnboarding.tsx", "DemoColdStartImport"],
    ["quiz source badge", "app/quizzes/quizzes-view.tsx", "QuizSourceBadge"],
    ["quizzes list loop", "app/quizzes/quizzes-view.tsx", "StudyLoopStrip"],
    ["grade school lesson", "src/components/grade-school/GradeSchoolLessonView.tsx", "StudyLoopStrip"],
    ["grade school url course resolve", "src/components/grade-school/GradeSchoolLessonView.tsx", "resolveUrlCourseId"],
    ["course detail chat topic", "app/courses/[id]/course-detail-view.tsx", "topic: coldStartTopic"],
    ["course dashboard", "src/components/courses/CourseDashboard.tsx", "Open Study"],
    ["study topic toolkit", "src/components/courses/StudyTopicToolkit.tsx", "luckyQuizHref"],
    ["course detail", "app/courses/[id]/course-detail-view.tsx", "coreStudyPackHref"],
    ["hub study now card", "src/components/hub/HubDashboardTab.tsx", "HubStudyNowCard"],
    ["hub upcoming tasks", "src/components/hub/HubDashboardTab.tsx", "Upcoming tasks"],
    ["hub jump back in", "src/components/hub/HubDashboardTab.tsx", "Jump back in"],
    ["quiz taker loop", "app/quizzes/[id]/quiz-taker.tsx", "StudyLoopStrip"],
    ["quiz taker badge", "app/quizzes/[id]/quiz-taker.tsx", "QuizSourceBadge"],
    ["telemetry mastery", "src/components/csl/EcosystemDashboard.tsx", "MasteryTree"],
    ["notifications loop data", "src/lib/notifications.ts", "loopCourseId"],
    ["course progress story", "src/components/courses/CourseProgressStory.tsx", "teachMeHref"],
    ["study course topics", "src/components/study/StudyCourseTopics.tsx", "Open in Study"],
    ["quiz failover hint", "src/components/quizzes/QuizGenerationError.tsx", "Settings → AI"],
    ["study this card", "src/components/study/StudyThisCard.tsx", "coreStudyPackHref"],
    ["study this demo import", "src/components/study/StudyThisCard.tsx", "DemoColdStartImport"],
    ["pdf annotate loop", "src/components/core/PdfInkViewer.tsx", "data-pdf-loop-bar"],
    ["pdf annotate teach me", "src/components/core/PdfInkViewer.tsx", "teachMeHref"],
    ["core selection loop", "src/components/core/CoreCourseActionBar.tsx", "data-core-selection-loop"],
    ["core assist study loop", "src/components/core/CoreNotesWorkspace.tsx", "assistStudyLoop"],
    ["core studio loop", "src/components/core/CoreStudioPanel.tsx", "sixChunkingHref"],
    ["search results clean", "src/components/search/SearchResultsList.tsx", "SEARCH_TYPE_LABELS"],
    ["settings failover snippet", "src/components/hub/settings/SettingsPanel.tsx", "Copy failover .env snippet"],
    ["study hub loop", "app/study/study-hub-view.tsx", "StudyHaulLearningCenter"],
    ["schedule proposal six", "src/components/planner/ScheduleProposalChangeList.tsx", "Preview Six session"],
    ["hub sections menu", "src/components/hub/HubSectionsMenu.tsx", "The Haul"],
    ["the haul workspace", "src/components/haul/TheHaulWorkspace.tsx", "localStorage"],
    ["complete assignment", "src/components/hub/CompleteAssignmentButton.tsx", "complete"],
    ["six guided session", "src/components/study/SixGuidedSession.tsx", "StudyLoopStrip"],
    ["blurting guided", "src/components/study/GuidedStudyActivity.tsx", "StudyLoopStrip"],
    ["study session runner", "src/components/study/StudySessionRunner.tsx", "StudyLoopStrip"],
    ["lucky engine loop", "app/study/lucky/lucky-engine-view.tsx", "StudyLoopStrip"],
    ["mixed review loop", "app/study/mixed/mixed-review-view.tsx", "StudyLoopStrip"],
    ["code practice loop", "src/components/study/CodePracticeWorkspace.tsx", "StudyLoopStrip"],
    ["flashcards loop", "app/flashcards/flashcards-view.tsx", "StudyLoopStrip"],
    ["core outcome strip", "src/components/core/CoreLoopOutcomeStrip.tsx", "blurtingHref"],
    ["core course action bar", "src/components/core/CoreCourseActionBar.tsx", "coreStudyPackHref"],
    ["core action bar chat topic", "src/components/core/CoreCourseActionBar.tsx", "topic: focusTopic?.trim()"],
    ["core study split sticky", "src/components/core/CoreStudySplit.tsx", "overflow-hidden"],
    ["core url course resolve", "src/components/core/CoreNotesWorkspace.tsx", "resolveCoreCourseId"],
    ["study hub url course resolve", "app/study/study-hub-view.tsx", "resolveUrlCourseId"],
    ["quizzes url course resolve", "app/quizzes/quizzes-view.tsx", "resolveUrlCourseId"],
    ["six url course resolve", "src/components/study/SixGuidedSession.tsx", "resolveUrlCourseId"],
    ["six loop focus topic", "src/components/study/SixGuidedSession.tsx", "resolveLoopFocusTopic"],
    ["flashcards url course resolve", "app/flashcards/flashcards-view.tsx", "resolveUrlCourseId"],
    ["flashcards api course resolve", "app/api/flashcards/route.ts", "resolveUserUrlCourseId"],
    ["six recommendations api resolve", "app/api/study/six-recommendations/route.ts", "resolveUserUrlCourseId"],
    ["lucky engine loop topic", "app/study/lucky/lucky-engine-view.tsx", "resolveLoopFocusTopic"],
    ["mixed review loop topic", "app/study/mixed/mixed-review-view.tsx", "resolveLoopFocusTopic"],
    ["code practice url course", "src/components/study/CodePracticeWorkspace.tsx", "resolveUrlCourseId"],
    ["blurting url course resolve", "app/study/blurting/page.tsx", "resolveUrlCourseId"],
    ["teach-me url course resolve", "app/study/teach-me/teach-me-client.tsx", "resolveUrlCourseId"],
    ["guided study loop topic", "src/components/study/GuidedStudyActivity.tsx", "resolveLoopFocusTopic"],
    ["session runner loop topic", "src/components/study/StudySessionRunner.tsx", "focusTopic={topicName}"],
  ];

  for (const [label, path, needle] of surfaces) {
    it(`wires loop on ${label}`, () => {
      expect(readSource(path)).toContain(needle);
    });
  }

  it("routes cold-start Lucky via luckyQuizHref (not direct POST)", () => {
    const coldStartSurfaces = [
      "src/components/courses/StudyTopicToolkit.tsx",
      "src/components/materials/MaterialOpenActions.tsx",
    ];
    for (const path of coldStartSurfaces) {
      const source = readSource(path);
      expect(source).toContain("luckyQuizHref");
      expect(source).not.toMatch(/fetch\([`'"]\/api\/quizzes[`'"]/);
    }
  });
});
