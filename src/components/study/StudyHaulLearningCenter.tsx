"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  GraduationCap,
  Sparkles,
} from "lucide-react";

import { AddCourseMaterialButton } from "@/components/materials/AddCourseMaterialModal";
import { LearnerGrowthContinuityStrip } from "@/components/study/LearnerGrowthContinuityStrip";
import { ContinueLearningExperienceCard } from "@/components/study/ContinueLearningExperienceCard";
import { StudyThisCard } from "@/components/study/StudyThisCard";
import { TopicStudyHaul } from "@/components/study/TopicStudyHaul";
import { readableCourseTitle } from "@/lib/courses/display-name";
import { hubTabPath } from "@/lib/hub/tabs";
import type { LearnerGrowthHubTeaser } from "@/lib/learning/learner-growth";
import type { CourseLearningBucket } from "@/lib/study/course-learning-bucket";

type HubCourse = {
  id: string;
  title: string;
  focusTopic?: string | null;
  topics?: string[];
  learningBucket?: CourseLearningBucket;
};

type PortalId = "courses" | "learning" | "new";

/**
 * Study Haul learning-center journey (adult):
 * Welcome → What (portal) → How (TopicStudyHaul) → Environment (rooms).
 */
export function StudyHaulLearningCenter({
  courses,
  selectedCourseId,
  selectedCourse,
  coldStartTopic,
  materialId,
  growthContinuityTeaser,
  onSelectCourse,
  sessionBuilder,
}: {
  courses: HubCourse[];
  selectedCourseId: string;
  selectedCourse: HubCourse | undefined;
  coldStartTopic: string | null;
  materialId?: string | null;
  growthContinuityTeaser: LearnerGrowthHubTeaser | null;
  onSelectCourse: (courseId: string, topic?: string) => void;
  sessionBuilder: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const portalParam = searchParams.get("portal")?.trim() as PortalId | null;
  const urlCourseId = searchParams.get("courseId")?.trim() || "";
  const urlTopic = searchParams.get("topic")?.trim() || "";
  const urlMaterialId =
    materialId?.trim() || searchParams.get("materialId")?.trim() || "";
  const hasLearningContext = Boolean(urlCourseId);

  const activePortal: PortalId | null =
    portalParam === "courses" ||
    portalParam === "learning" ||
    portalParam === "new"
      ? portalParam
      : null;

  /** Course in URL without topic/material → stay in WHAT (topic pick), don't skip to HOW. */
  const effectivePortal: PortalId | null =
    activePortal ??
    (urlCourseId && !urlTopic && !urlMaterialId
      ? (courses.find((c) => c.id === urlCourseId)?.learningBucket ??
          "learning") === "courses"
        ? "courses"
        : "learning"
      : null);

  const myCourses = courses.filter(
    (c) => (c.learningBucket ?? "learning") === "courses",
  );
  const myLearning = courses.filter(
    (c) => (c.learningBucket ?? "learning") === "learning",
  );

  /** HOW only after explicit WHAT (topic or material in URL) — not course alone. */
  const readyForHow =
    hasLearningContext &&
    Boolean(selectedCourse) &&
    Boolean(selectedCourseId) &&
    !effectivePortal &&
    Boolean(urlTopic || urlMaterialId);

  function goWelcome() {
    router.replace("/study", { scroll: false });
  }

  function openPortal(portal: PortalId) {
    router.replace(`/study?portal=${portal}`, { scroll: false });
  }

  /** Pick a course inside WHAT — stay on portal; do not jump to HOW yet. */
  function selectCourseForWhat(courseId: string, portal: PortalId) {
    const params = new URLSearchParams();
    params.set("portal", portal);
    params.set("courseId", courseId);
    router.replace(`/study?${params.toString()}`, { scroll: false });
  }

  /** Topic chosen → clear portal → HOW destinations. */
  function selectTopicForHow(courseId: string, topic: string) {
    onSelectCourse(courseId, topic);
  }

  function changeMaterial() {
    const bucket = selectedCourse?.learningBucket ?? "learning";
    const portal = bucket === "courses" ? "courses" : "learning";
    const params = new URLSearchParams();
    params.set("portal", portal);
    if (selectedCourseId) params.set("courseId", selectedCourseId);
    router.replace(`/study?${params.toString()}`, { scroll: false });
  }

  const sourceLabel =
    selectedCourse?.learningBucket === "courses"
      ? "My Courses"
      : selectedCourse
        ? "My Learning"
        : "Study Haul";

  const whatCourse =
    urlCourseId && effectivePortal && effectivePortal !== "new"
      ? courses.find((c) => c.id === urlCourseId)
      : undefined;
  const whatTopics = (whatCourse?.topics ?? []).filter(
    (t) => t.trim() && !/^general$/i.test(t),
  );

  if (readyForHow && selectedCourse && selectedCourseId) {
    return (
      <div data-study-haul-journey="how" className="space-y-6">
        <TopicStudyHaul
          courseId={selectedCourseId}
          courseTitle={readableCourseTitle(selectedCourse.title)}
          topic={coldStartTopic || urlTopic || null}
          materialId={materialId}
          sourceLabel={sourceLabel}
          onChangeMaterial={changeMaterial}
        />
      </div>
    );
  }

  if (effectivePortal) {
    return (
      <div
        data-study-haul-journey="what"
        data-hub-learning-front-door
        className="space-y-6"
      >
        <button
          type="button"
          onClick={goWelcome}
          className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-stone-600 touch-manipulation hover:text-stone-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Study Haul
        </button>

        {effectivePortal === "courses" ? (
          <section
            data-hub-portal="courses"
            className="rounded-3xl border border-stone-200 bg-gradient-to-br from-stone-50 via-white to-teal-50/30 p-6 sm:p-8"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">
              My Courses
            </p>
            <h2 className="mt-2 text-2xl font-black text-stone-900">
              What are you learning?
            </h2>
            <p className="mt-1 max-w-xl text-sm text-stone-600">
              {whatCourse
                ? `Pick a topic in ${readableCourseTitle(whatCourse.title)} — then choose how to learn.`
                : "Pick a school class or LMS-connected subject, then a topic."}
            </p>
            {whatCourse ? (
              <div data-hub-what-topic-pick className="mt-6 space-y-4">
                <button
                  type="button"
                  onClick={() => openPortal("courses")}
                  className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-stone-600 touch-manipulation hover:text-stone-900"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  All courses
                </button>
                <p className="text-sm font-bold text-stone-900">
                  {readableCourseTitle(whatCourse.title)}
                </p>
                {whatTopics.length > 0 ? (
                  <ul className="space-y-2">
                    {whatTopics.map((topicName) => (
                      <li key={topicName}>
                        <button
                          type="button"
                          onClick={() =>
                            selectTopicForHow(whatCourse.id, topicName)
                          }
                          className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left touch-manipulation hover:border-teal-400 hover:bg-teal-50/40"
                        >
                          <span className="text-sm font-bold text-stone-900">
                            {topicName}
                          </span>
                          <ArrowRight
                            className="h-4 w-4 shrink-0 text-stone-400"
                            aria-hidden
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-stone-600">
                      No syllabus topics yet — type what you want to learn, or
                      continue with the course focus.
                    </p>
                    <StudyThisCard compact landOnHaul />
                    {whatCourse.focusTopic ? (
                      <button
                        type="button"
                        onClick={() =>
                          selectTopicForHow(
                            whatCourse.id,
                            whatCourse.focusTopic!,
                          )
                        }
                        className="inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white touch-manipulation hover:bg-teal-600"
                      >
                        Continue with {whatCourse.focusTopic}
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            ) : myCourses.length > 0 ? (
              <ul className="mt-6 space-y-2">
                {myCourses.map((course) => (
                  <li key={course.id}>
                    <button
                      type="button"
                      onClick={() =>
                        selectCourseForWhat(course.id, "courses")
                      }
                      className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left touch-manipulation hover:border-teal-400 hover:bg-teal-50/40"
                    >
                      <span>
                        <span className="block text-sm font-bold text-stone-900">
                          {readableCourseTitle(course.title)}
                        </span>
                        {course.focusTopic ? (
                          <span className="mt-0.5 block text-xs text-stone-500">
                            Focus: {course.focusTopic}
                          </span>
                        ) : null}
                      </span>
                      <ArrowRight
                        className="h-4 w-4 shrink-0 text-stone-400"
                        aria-hidden
                      />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-6 text-sm text-stone-600">
                No school classes yet.{" "}
                <Link
                  href="/courses"
                  className="font-semibold text-brand hover:underline"
                >
                  Add or sync a class
                </Link>
              </p>
            )}
            <Link
              href={hubTabPath("classes")}
              className="mt-4 inline-flex min-h-10 items-center text-xs font-semibold text-brand hover:underline"
            >
              Open My Courses workspace
            </Link>
          </section>
        ) : null}

        {effectivePortal === "learning" ? (
          <section
            data-hub-portal="learning"
            className="rounded-3xl border border-violet-200/80 bg-gradient-to-br from-violet-50/50 via-white to-stone-50 p-6 sm:p-8"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-800">
              My Learning
            </p>
            <h2 className="mt-2 text-2xl font-black text-stone-900">
              What are you learning?
            </h2>
            <p className="mt-1 max-w-xl text-sm text-stone-600">
              {whatCourse
                ? `Pick a topic in ${readableCourseTitle(whatCourse.title)} — then choose how to learn.`
                : "Your personal learning library — bring a PDF, slides, notes, or URL, then pick what to study."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <AddCourseMaterialButton
                courseId={whatCourse?.id ?? myLearning[0]?.id ?? null}
                courses={courses}
                label="Bring something"
                compact
                onAdded={() => router.refresh()}
              />
              <Link
                href={hubTabPath("locker")}
                className="inline-flex min-h-11 items-center rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 touch-manipulation hover:bg-stone-50"
              >
                Open Locker
              </Link>
            </div>
            {whatCourse ? (
              <div data-hub-what-topic-pick className="mt-6 space-y-4">
                <button
                  type="button"
                  onClick={() => openPortal("learning")}
                  className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-stone-600 touch-manipulation hover:text-stone-900"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  All learning
                </button>
                <p className="text-sm font-bold text-stone-900">
                  {readableCourseTitle(whatCourse.title)}
                </p>
                {whatTopics.length > 0 ? (
                  <ul className="space-y-2">
                    {whatTopics.map((topicName) => (
                      <li key={topicName}>
                        <button
                          type="button"
                          onClick={() =>
                            selectTopicForHow(whatCourse.id, topicName)
                          }
                          className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border border-violet-200/70 bg-white px-4 py-3 text-left touch-manipulation hover:border-violet-400 hover:bg-violet-50/40"
                        >
                          <span className="text-sm font-bold text-stone-900">
                            {topicName}
                          </span>
                          <ArrowRight
                            className="h-4 w-4 shrink-0 text-stone-400"
                            aria-hidden
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <StudyThisCard compact landOnHaul />
                )}
              </div>
            ) : myLearning.length > 0 ? (
              <ul className="mt-6 space-y-2">
                {myLearning.map((course) => (
                  <li key={course.id}>
                    <button
                      type="button"
                      onClick={() =>
                        selectCourseForWhat(course.id, "learning")
                      }
                      className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border border-violet-200/70 bg-white px-4 py-3 text-left touch-manipulation hover:border-violet-400 hover:bg-violet-50/40"
                    >
                      <span>
                        <span className="block text-sm font-bold text-stone-900">
                          {readableCourseTitle(course.title)}
                        </span>
                        {course.focusTopic ? (
                          <span className="mt-0.5 block text-xs text-stone-500">
                            {course.focusTopic}
                          </span>
                        ) : null}
                      </span>
                      <ArrowRight
                        className="h-4 w-4 shrink-0 text-stone-400"
                        aria-hidden
                      />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-6 text-sm text-stone-600">
                Nothing yet — bring a document or start something new.
              </p>
            )}
          </section>
        ) : null}

        {effectivePortal === "new" ? (
          <section
            data-hub-portal="new"
            data-hub-learn-something-new
            className="rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50/40 via-white to-stone-50 p-6 sm:p-8"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-900">
              Learn Something New
            </p>
            <h2 className="mt-2 text-2xl font-black text-stone-900">
              What do you want to learn?
            </h2>
            <p className="mt-1 max-w-xl text-sm text-stone-600">
              Type any subject — no LMS course required. Next you&apos;ll choose
              how to learn it.
            </p>
            <div className="mt-6">
              <StudyThisCard compact landOnHaul />
            </div>
          </section>
        ) : null}
      </div>
    );
  }

  return (
    <div
      data-study-haul-journey="welcome"
      data-hub-learning-front-door
      data-beta-start-learning
      className="space-y-8"
    >
      <header className="max-w-2xl space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand">
          Study Haul
        </p>
        <h1 className="text-3xl font-black tracking-tight text-stone-900 sm:text-4xl">
          Welcome to Study Haul
        </h1>
        <p className="text-base leading-relaxed text-stone-600 sm:text-lg">
          Your learning center. Decide what you&apos;re here to learn — then how
          you want to work with it.
        </p>
      </header>

      <div data-study-primary-actions className="space-y-3">
        <ContinueLearningExperienceCard
          courseId={selectedCourseId || urlCourseId || undefined}
        />
        <LearnerGrowthContinuityStrip teaser={growthContinuityTeaser} />
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900">
            What are you here to learn?
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Choose a doorway. You won&apos;t see every Study Haul feature at
            once.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <WelcomeDoor
            id="my-courses"
            title="My Courses"
            description="School and LMS-connected classes."
            Icon={GraduationCap}
            tone="teal"
            onClick={() => openPortal("courses")}
          />
          <WelcomeDoor
            id="my-learning"
            title="My Learning"
            description="Personal library — import PDFs, slides, notes, URLs."
            Icon={BookMarked}
            tone="violet"
            onClick={() => openPortal("learning")}
          />
          <WelcomeDoor
            id="learn-something-new"
            title="Learn Something New"
            description="Type any topic and begin — no setup required."
            Icon={Sparkles}
            tone="amber"
            onClick={() => openPortal("new")}
          />
        </div>
      </section>

      <section
        data-learning-habits-entry
        className="grid gap-4 rounded-3xl border border-stone-200 bg-stone-50/80 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
      >
        <div>
          <h2 className="text-lg font-bold text-stone-900">Learning & Habits</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-stone-600">
            Discover how you learn, strengthen your study habits, and find approaches
            that help you understand and remember more.
          </p>
        </div>
        <Link
          href="/study/learning-habits"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-800 px-4 text-sm font-bold text-white touch-manipulation hover:bg-teal-700"
        >
          Explore My Learning
        </Link>
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-stone-200/80 pt-5">
        <a
          href="#start-studying"
          data-study-start-session
          className="inline-flex min-h-11 items-center rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-bold text-white touch-manipulation hover:bg-stone-800"
        >
          Start a Study Session
        </a>
      </div>

      <div id="start-studying" className="scroll-mt-24">
        {sessionBuilder}
      </div>
    </div>
  );
}

function WelcomeDoor({
  id,
  title,
  description,
  Icon,
  tone,
  onClick,
}: {
  id: string;
  title: string;
  description: string;
  Icon: typeof GraduationCap;
  tone: "teal" | "violet" | "amber";
  onClick: () => void;
}) {
  const tones = {
    teal: "border-teal-200 hover:border-teal-400 hover:bg-teal-50/50",
    violet: "border-violet-200 hover:border-violet-400 hover:bg-violet-50/50",
    amber: "border-amber-200 hover:border-amber-400 hover:bg-amber-50/50",
  };
  const wells = {
    teal: "bg-teal-100 text-teal-900",
    violet: "bg-violet-100 text-violet-900",
    amber: "bg-amber-100 text-amber-950",
  };
  return (
    <button
      type="button"
      data-hub-welcome-door={id}
      onClick={onClick}
      className={`flex min-h-[9.5rem] flex-col items-start gap-3 rounded-2xl border bg-white p-4 text-left touch-manipulation transition ${tones[tone]}`}
    >
      <span
        className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${wells[tone]}`}
        aria-hidden
      >
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-base font-bold text-stone-900">{title}</span>
        <span className="mt-1 block text-xs leading-snug text-stone-600">
          {description}
        </span>
      </span>
    </button>
  );
}
