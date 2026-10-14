/**
 * 2P-19 — Teaching Style presentation policies (appended to Tutor system prompt).
 * Does not replace TutorMode policies. One Tutor; styles are tone/scaffolding only.
 */

import type { TeachingStyle } from "./types";
import { TEACH_ME_LIKE_IM_5_STYLE } from "./types";

export type TeachingStylePolicy = {
  style: TeachingStyle;
  /** Appended after TutorMode policy — presentation only. */
  presentationPolicy: string;
  /** Learner-facing short description (not age-based). */
  description: string;
  /** Optional friendly label override (e.g. Teach Me Like I'm 5). */
  learnerLabel: string;
};

const ACCURACY =
  "Preserve technical accuracy. Simple must never mean wrong. " +
  "Introduce real terminology after intuition; do not permanently replace correct terms with childish substitutes. " +
  "Do not call the learner a child or imply low intelligence.";

const POLICIES: Record<TeachingStyle, Omit<TeachingStylePolicy, "style">> = {
  SIMPLIFIED: {
    learnerLabel: "Teach Me Like I'm 5",
    description:
      "Use very simple explanations and everyday analogies. Same concept — clearest path.",
    presentationPolicy:
      `Teaching style: SIMPLIFIED ("Teach Me Like I'm 5" — presentation only, not learner age). ` +
      `Maximum simplification; assume low prior knowledge for THIS explanation only. ` +
      `Concrete everyday analogies; small steps; introduce terminology gradually and explain unfamiliar words. ` +
      `Delay abstraction until foundation is set. Prefer: intuition → analogy → real terms → accurate example → invite learner use. ` +
      ACCURACY,
  },
  BEGINNER: {
    learnerLabel: "Beginner",
    description: "Assume little prior knowledge; clear adult language with examples.",
    presentationPolicy:
      `Teaching style: BEGINNER. Assume little prior knowledge; use normal adult language; ` +
      `explain terminology; provide examples; avoid unnecessary jargon. ${ACCURACY}`,
  },
  STANDARD: {
    learnerLabel: "Standard",
    description: "Normal classroom or college-level explanation.",
    presentationPolicy:
      `Teaching style: STANDARD. Use normal classroom/college explanation, balanced detail, and standard terminology. ${ACCURACY}`,
  },
  DETAILED: {
    learnerLabel: "Detailed",
    description: "Deeper technical explanation with edge cases and relationships.",
    presentationPolicy:
      `Teaching style: DETAILED. Go deeper: assumptions, edge cases, terminology, and relationships between concepts. ${ACCURACY}`,
  },
  SOCRATIC: {
    learnerLabel: "Socratic",
    description: "Prefer guiding questions over immediate answers.",
    presentationPolicy:
      `Teaching style: SOCRATIC (presentation emphasis). Prioritize questions that guide reasoning; ` +
      `avoid immediately giving the full answer when discovery is appropriate. TutorMode still governs interaction. ${ACCURACY}`,
  },
  FEYNMAN: {
    learnerLabel: "Feynman",
    description: "Push learner explanation and gap-finding.",
    presentationPolicy:
      `Teaching style: FEYNMAN. Encourage the learner to explain; identify gaps; ask for restatement in their own words. ` +
      `Preserve existing Feynman/teach-back behavior. ${ACCURACY}`,
  },
  HANDS_ON: {
    learnerLabel: "Hands-On",
    description: "Prioritize doing — examples, exercises, application.",
    presentationPolicy:
      `Teaching style: HANDS_ON. Prioritize doing: examples, exercises, application; connect explanation to immediate action. ${ACCURACY}`,
  },
  CHALLENGE: {
    learnerLabel: "Challenge",
    description: "Less scaffolding; more learner responsibility.",
    presentationPolicy:
      `Teaching style: CHALLENGE. Reduce scaffolding; increase learner responsibility; harder prompts; less hand-holding explanation. ${ACCURACY}`,
  },
  EXAM: {
    learnerLabel: "Exam",
    description: "Concise, assessment-oriented focus on tested knowledge.",
    presentationPolicy:
      `Teaching style: EXAM. Concise and assessment-oriented; focus on what is tested; limit coaching mid-answer unless asked. ${ACCURACY}`,
  },
};

export function getTeachingStylePolicy(style: TeachingStyle): TeachingStylePolicy {
  return { style, ...POLICIES[style] };
}

export function listTeachingStylePolicies(): TeachingStylePolicy[] {
  return (Object.keys(POLICIES) as TeachingStyle[]).map(getTeachingStylePolicy);
}

/** Confirm Teach Me Like I'm 5 is SIMPLIFIED presentation, not age. */
export function teachMeLikeIm5IsSimplified(): boolean {
  return TEACH_ME_LIKE_IM_5_STYLE === "SIMPLIFIED";
}
