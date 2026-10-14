/**
 * 2G-71 WS K — PERFORM producer from objective activity evaluations.
 * Coding (JS tests), Lab, and Presentation produce skillFacet=PERFORM.
 * Does NOT add PERFORM_GAP to Orchestrator.
 */

import { getCodingChallenge } from "@/lib/learning/activities/coding/challenges";
import { getStructuredChallenge } from "@/lib/learning/activities/structured/service";

export function activityProducesPerform(challengeId: string): boolean {
  const coding = getCodingChallenge(challengeId);
  if (coding) return true;
  const structured = getStructuredChallenge(challengeId);
  return Boolean(structured?.asPerform);
}

export function performProductImplementationStatus(): {
  maturity: "EVIDENCE-CLOSED";
  producers: string[];
  orchestratorPerformGapAdded: false;
  fakeProducer: false;
} {
  return {
    maturity: "EVIDENCE-CLOSED",
    producers: [
      "CODING_CHALLENGE (javascript vm + structural languages)",
      "LAB (structured observation rubric)",
      "PRESENTATION_PRACTICE (structured outline rubric)",
      "SQL_CHALLENGE (educational sql.js)",
      "NETWORKING_WORKSPACE (state + connectivity when facet=PERFORM)",
      "LANGUAGE_WORKSPACE (SPEAK phrase match when facet=PERFORM)",
    ],
    orchestratorPerformGapAdded: false,
    fakeProducer: false,
  };
}
