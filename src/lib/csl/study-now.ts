import type { LuckyActivity } from "./lucky";
import type { SixComponent } from "./six";
import { isMetaSyllabusTopic } from "./six-worked-lesson";
import { sixGuideHref } from "./six-guides";
import { luckyQuizHref, sixChunkingHref, withColdStartTopic, withCourseContext } from "@/lib/study/loop-hrefs";

export type StudyMinutes = 5 | 10 | 20 | 30 | 45 | 60;

export interface StudyNowTopicPick {
  topicId: string;
  topicName: string;
  courseId: string;
  courseTitle: string;
  component: SixComponent;
  componentTitle: string;
  href: string;
  reason: string;
  proficiency: number;
}

export interface StudyBlock {
  id: string;
  minutes: number;
  label: string;
  activity: SixComponent | LuckyActivity | "planner" | "missed-review";
  href?: string;
  subtitle?: string;
  topicName?: string;
}

export interface StudyNowPlan {
  totalMinutes: StudyMinutes;
  summary: string;
  blocks: StudyBlock[];
  focusTopics?: StudyNowTopicPick[];
}

function block(
  id: string,
  minutes: number,
  label: string,
  activity: StudyBlock["activity"],
  href?: string,
  extra?: Pick<StudyBlock, "subtitle" | "topicName">,
): StudyBlock {
  return { id, minutes, label, activity, href, ...extra };
}

function sixBlockFromTopic(topic: StudyNowTopicPick, minutes: number, index = 0): StudyBlock {
  return block(
    `six-focus-${topic.topicId}-${index}`,
    minutes,
    `Six · ${topic.componentTitle}: ${topic.topicName}`,
    topic.component,
    topic.href,
    {
      subtitle: `${topic.courseTitle} · ${topic.proficiency}% mastery`,
      topicName: topic.topicName,
    },
  );
}

function allocateSixMinutes(total: StudyMinutes, topicCount: number): number[] {
  if (topicCount <= 0) return [];
  // Micro Six still owns the loop on a 5-minute clock (then Lucky fills the rest).
  if (total <= 5) return [3];

  if (total <= 10) {
    return [Math.min(8, total - 2)];
  }

  if (total <= 20) {
    return topicCount > 1 ? [10, 5] : [12];
  }

  if (total <= 30) {
    return topicCount > 1 ? [12, 8] : [15];
  }

  if (total <= 45) {
    return topicCount > 1 ? [15, 10] : [18];
  }

  return topicCount > 1 ? [20, 12] : [25];
}

function scaleBlocksToTotal(blocks: StudyBlock[], totalMinutes: number): StudyBlock[] {
  const sum = blocks.reduce((acc, item) => acc + item.minutes, 0);
  if (sum === totalMinutes || sum === 0) return blocks;

  const scaled = blocks.map((item) => ({
    ...item,
    minutes: Math.max(3, Math.round((item.minutes / sum) * totalMinutes)),
  }));

  const scaledSum = scaled.reduce((acc, item) => acc + item.minutes, 0);
  const delta = totalMinutes - scaledSum;
  if (delta !== 0 && scaled.length > 0) {
    scaled[scaled.length - 1]!.minutes += delta;
  }

  return scaled.filter((item) => item.minutes > 0);
}

function buildRetentionBlocks(
  minutes: StudyMinutes,
  context: {
    hasUpcomingDeadline?: boolean;
    missedQuestions?: number;
    dueFlashcards?: number;
  },
): StudyBlock[] {
  const { hasUpcomingDeadline, missedQuestions = 0, dueFlashcards = 0 } = context;
  const blocks: StudyBlock[] = [];

  if (minutes >= 20) {
    blocks.push(block("quiz", 7, "Lucky quiz", "quiz", "/quizzes"));
  }

  if (minutes >= 30) {
    blocks.push(
      block(
        "practice",
        8,
        hasUpcomingDeadline ? "Assignment focus" : "Hands-on practice",
        hasUpcomingDeadline ? "planner" : "hands-on-practice",
        hasUpcomingDeadline ? "/dashboard" : sixGuideHref("hands-on-practice"),
      ),
    );
  }

  if (dueFlashcards > 0) {
    blocks.push(
      block("flashcards", 5, "Spaced flashcards", "flashcards", "/flashcards"),
    );
  } else if (missedQuestions > 0) {
    blocks.push(
      block(
        "missed",
        5,
        "Missed-question review",
        "missed-review",
        "/quizzes?filter=missed",
      ),
    );
  } else if (minutes >= 45) {
    blocks.push(
      block("mixed", 8, "Mixed review", "mixed-review", "/study/mixed"),
    );
  } else if (minutes >= 10) {
    blocks.push(
      block(
        "flashcards",
        5,
        "Active recall",
        "active-recall",
        sixGuideHref("active-recall"),
      ),
    );
  }

  return blocks;
}

/** Syllabus/LMS topics when Six recommendations are empty (no mastery yet). */
export function buildColdStartFocusTopics(input: {
  courseId: string;
  courseTitle: string;
  topicNames: string[];
  limit?: number;
}): StudyNowTopicPick[] {
  const limit = input.limit ?? 2;
  const eligible = input.topicNames
    .map((name) => name.trim())
    .filter((name) => name && !isMetaSyllabusTopic(name))
    .slice(0, limit);

  return eligible.map((topicName, index) => ({
    topicId: `cold-start-${index}`,
    topicName,
    courseId: input.courseId,
    courseTitle: input.courseTitle,
    component: "chunking" as SixComponent,
    componentTitle: "Chunking",
    href: sixChunkingHref(input.courseId, topicName),
    reason: "Cold start from LMS/syllabus topics — no upload required.",
    proficiency: 0,
  }));
}

export function buildStudyNowPlan(
  minutes: StudyMinutes,
  context: {
    hasUpcomingDeadline?: boolean;
    weakTopics?: number;
    missedQuestions?: number;
    dueFlashcards?: number;
  } = {},
  focusTopics: StudyNowTopicPick[] = [],
): StudyNowPlan {
  const { hasUpcomingDeadline, missedQuestions = 0, dueFlashcards = 0 } = context;
  const topics = focusTopics.slice(0, 2);

  if (topics.length > 0 && minutes >= 5) {
    const sixMinutes = allocateSixMinutes(minutes, topics.length);
    const sixBlocks = topics
      .slice(0, sixMinutes.length)
      .map((topic, index) => sixBlockFromTopic(topic, sixMinutes[index] ?? 10, index));

    const sixTotal = sixBlocks.reduce((acc, item) => acc + item.minutes, 0);
    const remaining = Math.max(0, minutes - sixTotal);
    let retentionBlocks = buildRetentionBlocks(
      remaining >= 20 ? 20 : remaining >= 10 ? 10 : 5,
      { hasUpcomingDeadline, missedQuestions, dueFlashcards },
    );

    // Always close Core → Six → Lucky — even on a 5-minute clock.
    if (!retentionBlocks.some((item) => item.activity === "quiz")) {
      retentionBlocks = [
        block(
          "quiz",
          Math.min(7, Math.max(2, remaining || 2)),
          "Lucky quiz",
          "quiz",
          "/quizzes",
        ),
        ...retentionBlocks,
      ];
    }

    let blocks = [...sixBlocks, ...retentionBlocks];
    blocks = scaleBlocksToTotal(blocks, minutes);

    const primary = topics[0]!;
    const summary =
      topics.length > 1
        ? `Six focus on ${primary.topicName} and ${topics[1]!.topicName}, then Lucky retention.`
        : `Six focus on ${primary.topicName} (${primary.proficiency}% mastery), then Lucky retention.`;

    return {
      totalMinutes: minutes,
      summary,
      blocks,
      focusTopics: topics,
    };
  }

  if (minutes <= 5) {
    return {
      totalMinutes: minutes,
      summary: "Micro Six → Lucky burst — not a flashcard dump.",
      blocks: [
        block(
          "chunking",
          3,
          "Chunk one idea",
          "chunking",
          sixGuideHref("chunking"),
        ),
        block("quiz", 2, "Lucky quiz", "quiz", "/quizzes"),
      ],
    };
  }

  if (minutes <= 10) {
    return {
      totalMinutes: minutes,
      summary: "Short Six warm-up, then Lucky recall.",
      blocks: [
        block(
          "chunking",
          5,
          "Chunk or explain one topic",
          "chunking",
          sixGuideHref("chunking"),
        ),
        block(
          "review",
          5,
          missedQuestions > 0 ? "Missed-question review" : "Quick quiz",
          missedQuestions > 0 ? "missed-review" : "quiz",
          missedQuestions > 0 ? "/quizzes?filter=missed" : "/quizzes",
        ),
      ],
    };
  }

  if (minutes <= 20) {
    return {
      totalMinutes: minutes,
      summary: "Understand, then test yourself.",
      blocks: [
        block(
          "feynman",
          8,
          "Six — explain or visualize",
          "feynman",
          sixGuideHref("feynman"),
        ),
        block("quiz", 7, "Lucky quiz", "quiz", "/quizzes"),
        block(
          "spaced",
          5,
          dueFlashcards > 0 ? "Spaced flashcards" : "Missed questions",
          dueFlashcards > 0 ? "flashcards" : "missed-review",
          dueFlashcards > 0 ? "/flashcards" : "/quizzes?filter=missed",
        ),
      ],
    };
  }

  if (minutes <= 30) {
    return {
      totalMinutes: minutes,
      summary: hasUpcomingDeadline
        ? "Deadline-focused: practice then quiz."
        : "Balanced Six → practice → Lucky session.",
      blocks: [
        block(
          "explain",
          10,
          "Six explanation",
          "detailed-explanation",
          sixGuideHref("detailed-explanation"),
        ),
        block(
          "practice",
          10,
          hasUpcomingDeadline ? "Assignment focus" : "Hands-on practice",
          hasUpcomingDeadline ? "planner" : "hands-on-practice",
          hasUpcomingDeadline ? "/dashboard" : sixGuideHref("hands-on-practice"),
        ),
        block("quiz", 5, "Lucky quiz", "quiz", "/quizzes"),
        block(
          "recall",
          5,
          missedQuestions > 0 ? "Missed-question review" : "Active recall",
          missedQuestions > 0 ? "missed-review" : "active-recall",
          missedQuestions > 0 ? "/quizzes?filter=missed" : sixGuideHref("active-recall"),
        ),
      ],
    };
  }

  const fullBlocks: StudyBlock[] = [
    block(
      "chunk",
      10,
      "Review notes / chunk topics",
      "chunking",
      sixGuideHref("chunking"),
    ),
    block(
      "practice",
      15,
      "Hands-on practice",
      "hands-on-practice",
      sixGuideHref("hands-on-practice"),
    ),
    block("quiz", 10, "Lucky quiz", "quiz", "/quizzes"),
    block(
      "mixed",
      context.weakTopics && context.weakTopics > 0 ? 10 : 5,
      "Missed questions & spaced review",
      "mixed-review",
      "/quizzes?filter=missed",
    ),
    block("flashcards", 5, "Flashcard spaced review", "flashcards", "/flashcards"),
  ];

  return {
    totalMinutes: minutes,
    summary: "Full CSL loop: Core review → Six → Lucky → mastery check.",
    blocks: fullBlocks.slice(0, minutes >= 60 ? 5 : 4),
  };
}

const SIX_TOPIC_ACTIVITIES = new Set<SixComponent>([
  "chunking",
  "detailed-explanation",
  "feynman",
  "visualization",
  "hands-on-practice",
  "active-recall",
]);

/** Attach course + topic context so Hub Study Now lands in Core→Six→Lucky, not generic pages. */
export function enrichStudyNowBlocksForCourse(
  blocks: StudyBlock[],
  input: {
    courseId?: string | null;
    courseTitle?: string | null;
    focusTopics?: StudyNowTopicPick[];
  },
): StudyBlock[] {
  const focusTopic = input.focusTopics?.[0];
  const effectiveCourseId = input.courseId?.trim() || focusTopic?.courseId || null;
  const effectiveCourseTitle =
    input.courseTitle?.trim() || focusTopic?.courseTitle || null;
  const focusTopicName = focusTopic?.topicName?.trim() || null;

  return blocks.map((item) => {
    let enriched = item;

    if (item.activity === "quiz" && effectiveCourseId) {
      enriched = {
        ...enriched,
        href: luckyQuizHref(effectiveCourseId, null, focusTopicName),
        subtitle:
          enriched.subtitle ??
          `${effectiveCourseTitle ?? "Course"} · auto-build from topics`,
        topicName: focusTopicName ?? enriched.topicName,
      };
    }

    if (enriched.topicName || !effectiveCourseId) {
      return enriched.href && effectiveCourseId
        ? {
            ...enriched,
            href: withColdStartTopic(
              withCourseContext(enriched.href, effectiveCourseId),
              enriched.topicName ?? focusTopicName,
            ),
          }
        : enriched;
    }

    if (SIX_TOPIC_ACTIVITIES.has(enriched.activity as SixComponent)) {
      const topicParam = encodeURIComponent(focusTopicName ?? effectiveCourseTitle ?? "notes");
      const baseHref = enriched.href ?? sixGuideHref(enriched.activity as SixComponent);
      const href = baseHref.startsWith("/study/six/")
        ? `${baseHref}${baseHref.includes("?") ? "&" : "?"}courseId=${encodeURIComponent(effectiveCourseId)}&topic=${topicParam}`
        : baseHref;

      enriched = {
        ...enriched,
        topicName: focusTopicName ?? effectiveCourseTitle ?? enriched.topicName,
        subtitle: enriched.subtitle ?? effectiveCourseTitle ?? undefined,
        href,
      };
    }

    if (enriched.href && effectiveCourseId) {
      enriched = {
        ...enriched,
        href: withColdStartTopic(
          withCourseContext(enriched.href, effectiveCourseId),
          focusTopicName,
        ),
      };
    }

    return enriched;
  });
}
