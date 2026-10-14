"use client";

import Link from "next/link";

import { preferredGameChallengeIdForConcept } from "@/lib/learning/activities/structured/concept-game-challenge";
import {
  buildCapabilityHref,
  listContextualCapabilities,
  type StudyCapability,
} from "@/lib/study/capability-registry";

/**
 * Bundle K — Learning / topic contextual launches into canonical capabilities.
 * Only shows capabilities relevant to topic + KL practiceForms.
 * Bundle M — Games with a concept-mapped challenge deep-link that challengeId.
 */
export function ContextualCapabilityStrip({
  topicOrSubject,
  practiceForms,
  courseId,
  conceptId,
  materialId,
  topic,
}: {
  topicOrSubject?: string | null;
  practiceForms?: readonly string[] | null;
  courseId?: string | null;
  conceptId?: string | null;
  materialId?: string | null;
  topic?: string | null;
}) {
  const caps = listContextualCapabilities({
    topicOrSubject,
    practiceForms,
  });

  if (caps.length === 0) return null;

  const gameChallengeId = preferredGameChallengeIdForConcept(conceptId);

  const ctx = {
    courseId,
    conceptId,
    materialId,
    topic,
    challengeId: gameChallengeId,
  };

  return (
    <nav
      data-contextual-capability-strip
      aria-label="Related study options"
      className="flex flex-wrap gap-2"
    >
      {caps.slice(0, 8).map((cap: StudyCapability) => (
        <Link
          key={cap.id}
          href={buildCapabilityHref(cap, {
            ...ctx,
            challengeId: cap.id === "games" ? ctx.challengeId : null,
          })}
          data-capability-launch={cap.id}
          className="inline-flex min-h-11 items-center rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-800 touch-manipulation hover:border-teal-300 hover:bg-teal-50/50"
        >
          {cap.label}
        </Link>
      ))}
    </nav>
  );
}
