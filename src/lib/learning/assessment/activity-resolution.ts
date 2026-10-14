/**
 * Phase 2G-42 — Thin Assessment Activity Resolution boundary.
 *
 * AssessmentPlan → AssessmentAdapterRegistry → AssessmentActivityResolution.
 * Identity only — no activity start, no default adapter, no evidence writes,
 * no AdaptiveSequenceRun mutation.
 */

import type {
  AssessmentAdapterRegistry,
  AssessmentActivityResolution,
} from "@/lib/learning/assessment/adapter-registry";
import type { AssessmentPlan } from "@/lib/learning/assessment/workflow";

export type ResolveAssessmentActivityFailureReason =
  | "plan_not_ready"
  | "activity_resolution_unavailable"
  | "not_found"
  | "invalid_key"
  | "adapter_cannot_handle"
  | "invalid_request";

export type ResolveAssessmentActivityResult =
  | {
      ok: true;
      resolution: AssessmentActivityResolution;
      /**
       * Echoed learner id for the resolution boundary / future adapter context.
       * Not an authorization decision — ownership stays at call-site (e.g. 2G-40 API).
       */
      learnerId: string;
    }
  | {
      ok: false;
      reason: ResolveAssessmentActivityFailureReason;
    };

function normalizeLearnerId(learnerId: unknown): string {
  return typeof learnerId === "string" ? learnerId.trim() : "";
}

function normalizeAdapterKey(key: unknown): string | null {
  if (typeof key !== "string") return null;
  const trimmed = key.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Resolve an abstract assessment activity from a ready AssessmentPlan.
 *
 * Requires an explicit `plan.adapterKey` — does not invent defaults.
 * Concept ownership is intentionally not performed here (documented: call-site /
 * future adapter prepare); this phase only wires the registry seam.
 */
export function resolveAssessmentActivity(
  plan: AssessmentPlan,
  learnerId: string,
  registry: AssessmentAdapterRegistry,
): ResolveAssessmentActivityResult {
  if (plan == null || typeof plan !== "object" || registry == null) {
    return { ok: false, reason: "invalid_request" };
  }

  if (plan.status !== "ready") {
    return { ok: false, reason: "plan_not_ready" };
  }

  const adapterKey = normalizeAdapterKey(plan.adapterKey);
  if (!adapterKey) {
    // Ready plans without adapterKey remain valid plans — resolution simply unavailable.
    return { ok: false, reason: "activity_resolution_unavailable" };
  }

  const lookup = registry.resolve(adapterKey);
  if (!lookup.ok) {
    return { ok: false, reason: lookup.reason };
  }

  const normalizedLearnerId = normalizeLearnerId(learnerId);
  const context = {
    plan,
    ...(normalizedLearnerId ? { learnerId: normalizedLearnerId } : {}),
  };

  if (!lookup.adapter.canHandle(context)) {
    return { ok: false, reason: "adapter_cannot_handle" };
  }

  const resolution = lookup.adapter.resolve(context);

  return {
    ok: true,
    resolution: {
      adapterKey: resolution.adapterKey,
      activityType: resolution.activityType,
    },
    learnerId: normalizedLearnerId,
  };
}
