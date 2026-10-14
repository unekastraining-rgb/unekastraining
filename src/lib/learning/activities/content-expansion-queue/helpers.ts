/**
 * Shared authoring helpers for the content expansion queue.
 * Not a learning engine — fixture convenience only.
 */

import type { StructuredChallenge } from "@/lib/learning/activities/structured/service";

export type Scaffold = NonNullable<StructuredChallenge["scaffolds"]>[number];

export function hint(
  label: string,
  content: string,
  level: 1 | 2 | 3 = 1,
): Scaffold {
  return {
    kind: "HINT",
    label,
    content,
    level,
    revealPolicy: "ON_REQUEST",
    doesNotRevealAnswer: true,
  };
}

export function step(
  label: string,
  content: string,
  level: 1 | 2 | 3 = 2,
): Scaffold {
  return {
    kind: "STEP",
    label,
    content,
    level,
    revealPolicy: "ON_REQUEST",
    doesNotRevealAnswer: true,
  };
}

export function checklist(
  label: string,
  content: string,
): Scaffold {
  return {
    kind: "CHECKLIST",
    label,
    content,
    level: 3,
    revealPolicy: "ON_REQUEST",
    doesNotRevealAnswer: true,
  };
}
