/**
 * 2G-71 WS M — Opt-in Assessment adapters for Coding / SQL / Writing.
 * ASSESS ≠ Quiz. Empty registry remains empty unless registered.
 */

import type {
  AssessmentAdapter,
  AssessmentAdapterRegistry,
} from "@/lib/learning/assessment/adapter-registry";
import { createAssessmentAdapterRegistry } from "@/lib/learning/assessment/adapter-registry";

function makeChallengeAdapter(input: {
  key: string;
  activityType:
    | "CODING_CHALLENGE"
    | "SQL_CHALLENGE"
    | "WRITING_EXERCISE"
    | "LAB"
    | "SIMULATION"
    | "GAME"
    | "PROJECT_TASK"
    | "PRESENTATION_PRACTICE";
}): AssessmentAdapter {
  return {
    key: input.key,
    canHandle(context) {
      return context.plan.adapterKey === input.key;
    },
    resolve() {
      return {
        adapterKey: input.key,
        activityType: input.activityType,
      };
    },
    prepare(context) {
      const conceptId = context.plan.conceptId?.trim();
      if (!conceptId) {
        return { unavailable: true };
      }
      return {
        activityRef: {
          kind: input.key,
          id: conceptId,
          href: `/study/activities/${input.key}?conceptId=${encodeURIComponent(conceptId)}`,
        },
      };
    },
  };
}

export function createCodingAssessmentAdapter(): AssessmentAdapter {
  return makeChallengeAdapter({
    key: "coding",
    activityType: "CODING_CHALLENGE",
  });
}

export function createSqlAssessmentAdapter(): AssessmentAdapter {
  return makeChallengeAdapter({
    key: "sql",
    activityType: "SQL_CHALLENGE",
  });
}

export function createWritingAssessmentAdapter(): AssessmentAdapter {
  return makeChallengeAdapter({
    key: "writing",
    activityType: "WRITING_EXERCISE",
  });
}

export function registerUniversalActivityAssessmentAdapters(
  registry: AssessmentAdapterRegistry = createAssessmentAdapterRegistry(),
): AssessmentAdapterRegistry {
  for (const adapter of [
    createCodingAssessmentAdapter(),
    createSqlAssessmentAdapter(),
    createWritingAssessmentAdapter(),
  ]) {
    registry.register(adapter);
  }
  return registry;
}
