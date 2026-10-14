/**
 * Phase 2G-38 — Assessment Adapter contract + in-memory registry.
 *
 * Extension point only: register/resolve by opaque key.
 * Empty factory by design — production adapters (e.g. Quiz, 2G-44) register
 * explicitly via their own helpers. Does not choose adapters from AssessmentPlan
 * or run activities.
 */

import type { AssessmentPlan } from "@/lib/learning/assessment/workflow";
import type { LearningObjectTypeName } from "@/lib/learning/types";

/**
 * Minimal resolution result — identifies mechanism, does not launch.
 */
export type AssessmentActivityResolution = {
  adapterKey: string;
  activityType: LearningObjectTypeName;
};

/**
 * Opaque context passed to adapters for capability checks / resolution.
 * Adapters must not treat this as authorization or launch credentials.
 */
export type AssessmentAdapterContext = {
  plan: AssessmentPlan;
  learnerId?: string;
};

/**
 * Assessment activity adapter — mechanism descriptor, not a subject.
 * Registry only stores/looks up adapters; it does not invoke them for
 * run/grade/evidence side effects.
 *
 * Optional `prepare` (2G-43): returns opaque activity-specific metadata only.
 * Must not start/navigate/grade or write evidence.
 */
export type AssessmentAdapter = {
  /** Opaque stable key (e.g. future "quiz", "coding") — not a subject name. */
  key: string;
  canHandle(context: AssessmentAdapterContext): boolean;
  resolve(context: AssessmentAdapterContext): AssessmentActivityResolution;
  /**
   * Optional preparation contribution — opaque refs only.
   * Invoked by `prepareAssessmentActivity` when a registry is supplied.
   * May be async when identity lookup is required (e.g. owned Quiz).
   */
  prepare?(
    context: AssessmentAdapterPrepareContext,
  ):
    | AssessmentActivityPrepareContribution
    | null
    | undefined
    | Promise<AssessmentActivityPrepareContribution | null | undefined>;
};

/**
 * Context for optional adapter.prepare — includes prior resolution.
 */
export type AssessmentAdapterPrepareContext = AssessmentAdapterContext & {
  resolution: AssessmentActivityResolution;
};

/**
 * Adapter-owned opaque fields merged into the universal descriptor.
 * `unavailable: true` means identity could not be established (fail prepare).
 * Never questions, scores, grades, or executable callbacks.
 */
export type AssessmentActivityPrepareContribution = {
  activityRef?: { kind: string; id: string };
  unavailable?: boolean;
};

export type AssessmentAdapterRegisterResult =
  | { ok: true }
  | { ok: false; reason: "invalid_key" | "duplicate_key" | "invalid_adapter" };

export type AssessmentAdapterResolveResult =
  | { ok: true; adapter: AssessmentAdapter }
  | { ok: false; reason: "not_found" | "invalid_key" };

function normalizeAdapterKey(key: unknown): string | null {
  if (typeof key !== "string") return null;
  const trimmed = key.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isAssessmentAdapter(value: unknown): value is AssessmentAdapter {
  if (value == null || typeof value !== "object") return false;
  const adapter = value as Partial<AssessmentAdapter>;
  return (
    typeof adapter.key === "string" &&
    typeof adapter.canHandle === "function" &&
    typeof adapter.resolve === "function"
  );
}

/**
 * Instance-based registry — no module singleton, deterministic Map order by insertion.
 */
export class AssessmentAdapterRegistry {
  private readonly adapters = new Map<string, AssessmentAdapter>();

  register(adapter: AssessmentAdapter): AssessmentAdapterRegisterResult {
    if (!isAssessmentAdapter(adapter)) {
      return { ok: false, reason: "invalid_adapter" };
    }
    const key = normalizeAdapterKey(adapter.key);
    if (!key) {
      return { ok: false, reason: "invalid_key" };
    }
    if (this.adapters.has(key)) {
      return { ok: false, reason: "duplicate_key" };
    }
    this.adapters.set(key, { ...adapter, key });
    return { ok: true };
  }

  resolve(key: string): AssessmentAdapterResolveResult {
    const normalized = normalizeAdapterKey(key);
    if (!normalized) {
      return { ok: false, reason: "invalid_key" };
    }
    const adapter = this.adapters.get(normalized);
    if (!adapter) {
      return { ok: false, reason: "not_found" };
    }
    return { ok: true, adapter };
  }

  list(): AssessmentAdapter[] {
    return [...this.adapters.values()];
  }

  has(key: string): boolean {
    const normalized = normalizeAdapterKey(key);
    return normalized != null && this.adapters.has(normalized);
  }
}

/** Factory — preferred entry point (no global mutable registry). */
export function createAssessmentAdapterRegistry(): AssessmentAdapterRegistry {
  return new AssessmentAdapterRegistry();
}
