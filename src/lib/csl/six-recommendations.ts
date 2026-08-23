import type { SixComponent } from "./six";
import { SIX_ACTIVITIES } from "./six";
import { sixGuideHref } from "./six-guides";
import { db } from "@/lib/db";

export interface SixRecommendation {
  topicId: string;
  topicName: string;
  courseId: string;
  courseTitle: string;
  proficiency: number;
  understanding: number;
  recall: number;
  application: number;
  reviewCount: number;
  component: SixComponent;
  componentTitle: string;
  componentEmoji: string;
  reason: string;
  href: string;
}

interface MasterySignals {
  proficiency: number;
  understanding: number;
  recall: number;
  application: number;
  reviewCount: number;
}

export function recommendSixForMastery(signals: MasterySignals): {
  component: SixComponent;
  reason: string;
} {
  const { understanding, recall, application, reviewCount } = signals;

  if (reviewCount === 0) {
    return {
      component: "chunking",
      reason: "You haven't studied this yet — start by breaking it into chunks.",
    };
  }

  if (understanding < 0.45) {
    return {
      component: "detailed-explanation",
      reason: "Understanding is low — walk through it step by step.",
    };
  }

  if (understanding < 0.55) {
    return {
      component: "chunking",
      reason: "Organize the pieces before going deeper.",
    };
  }

  if (application < 0.5 && application <= recall) {
    return {
      component: "hands-on-practice",
      reason: "You grasp the idea — now apply it with practice problems.",
    };
  }

  if (recall < 0.5) {
    return {
      component: "active-recall",
      reason: "Test yourself without notes to strengthen retention.",
    };
  }

  if (recall < 0.65 && understanding >= 0.55) {
    return {
      component: "feynman",
      reason: "Explain it simply to expose gaps before the exam.",
    };
  }

  if (application < understanding - 0.1) {
    return {
      component: "visualization",
      reason: "Map relationships visually to connect abstract ideas.",
    };
  }

  return {
    component: "feynman",
    reason: "Solidify what you know with a teach-back session.",
  };
}

function activityMeta(component: SixComponent) {
  const activity = SIX_ACTIVITIES.find((item) => item.id === component);
  return {
    title: activity?.title ?? component,
    emoji: activity?.emoji ?? "📚",
  };
}

export async function getSixRecommendations(
  userId: string,
  limit = 6,
  courseId?: string,
): Promise<SixRecommendation[]> {
  const topics = await db.topic.findMany({
    where: {
      course: { userId },
      ...(courseId ? { courseId } : {}),
    },
    include: {
      course: { select: { id: true, title: true } },
      masteries: {
        where: { userId },
        take: 1,
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  const candidates = topics
    .map((topic) => {
      const mastery = topic.masteries[0];
      const signals: MasterySignals = {
        proficiency: mastery?.proficiency ?? 0,
        understanding: mastery?.understanding ?? 0,
        recall: mastery?.recall ?? 0,
        application: mastery?.application ?? 0,
        reviewCount: mastery?.reviewCount ?? 0,
      };

      return { topic, signals };
    })
    .filter(({ signals }) => signals.proficiency < 0.65 || signals.reviewCount === 0)
    .sort((a, b) => {
      if (a.signals.reviewCount === 0 && b.signals.reviewCount > 0) return -1;
      if (b.signals.reviewCount === 0 && a.signals.reviewCount > 0) return 1;
      return a.signals.proficiency - b.signals.proficiency;
    })
    .slice(0, limit);

  return candidates.map(({ topic, signals }) => {
    const { component, reason } = recommendSixForMastery(signals);
    const meta = activityMeta(component);

    return {
      topicId: topic.id,
      topicName: topic.name,
      courseId: topic.course.id,
      courseTitle: topic.course.title,
      proficiency: Math.round(signals.proficiency * 100),
      understanding: Math.round(signals.understanding * 100),
      recall: Math.round(signals.recall * 100),
      application: Math.round(signals.application * 100),
      reviewCount: signals.reviewCount,
      component,
      componentTitle: meta.title,
      componentEmoji: meta.emoji,
      reason,
      href: sixGuideHref(component, {
        courseId: topic.course.id,
        topicId: topic.id,
        topicName: topic.name,
      }),
    };
  });
}

export function buildSixHrefForTopic(input: {
  topicId: string;
  topicName: string;
  courseId: string;
  proficiency?: number;
  understanding?: number;
  recall?: number;
  application?: number;
  reviewCount?: number;
}): string {
  const { component } = recommendSixForMastery({
    proficiency: input.proficiency ?? 0,
    understanding: input.understanding ?? 0,
    recall: input.recall ?? 0,
    application: input.application ?? 0,
    reviewCount: input.reviewCount ?? 0,
  });

  return sixGuideHref(component, {
    courseId: input.courseId,
    topicId: input.topicId,
    topicName: input.topicName,
  });
}
