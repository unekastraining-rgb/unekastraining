import { HubBackBar } from "@/components/hub/HubBackBar";
import { HubSubpageShell } from "@/components/hub/HubSubpageShell";
import { LearnerGrowthCenterPanel } from "@/components/study/LearnerGrowthCenterPanel";
import { resolveLearnerGrowthContinuityForUser } from "@/lib/learning/learner-growth";
import {
  presentUniversalLearnerContext,
  resolveUniversalLearnerContext,
} from "@/lib/learning/universal-learner-context";
import { getOrCreateDefaultUser } from "@/lib/user";

export const dynamic = "force-dynamic";

/**
 * 2P-21 / 2P-43 — Learner Growth Center.
 * Presentation only: ConceptMastery + LearningAttempt + Adaptive resume continuity.
 * No competing engines. Canonical route /study/learner-model; /study/learner redirects here.
 */
export default async function LearnerGrowthCenterPage() {
  let user: { id: string };
  try {
    user = await getOrCreateDefaultUser();
  } catch {
    return (
      <HubSubpageShell>
        <HubBackBar title="Learner Growth Center" planningActive="study" />
        <div
          data-growth-center-error
          data-learner-model-error
          className="mx-auto max-w-2xl px-4 py-10 text-center"
        >
          <h1 className="text-xl font-bold text-stone-900">
            Sign in to view your learning growth
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Your learner model is private to your account. Open Study Hub after
            signing in.
          </p>
          <a
            href="/study"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Back to Study Hub
          </a>
        </div>
      </HubSubpageShell>
    );
  }

  let resolved: Awaited<
    ReturnType<typeof resolveLearnerGrowthContinuityForUser>
  > | null = null;
  try {
    resolved = await resolveLearnerGrowthContinuityForUser(user.id);
  } catch {
    resolved = null;
  }

  if (!resolved) {
    return (
      <HubSubpageShell>
        <HubBackBar title="Learner Growth Center" planningActive="study" />
        <div
          data-growth-center-error
          data-learner-model-error
          role="alert"
          className="mx-auto max-w-2xl px-4 py-10 text-center"
        >
          <h1 className="text-xl font-bold text-stone-900">
            Could not load your learning
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Something went wrong loading concept mastery. Try again from Study
            Hub — your notes and study tools are still available.
          </p>
          <a
            href="/study"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Back to Study Hub
          </a>
        </div>
      </HubSubpageShell>
    );
  }

  const { continuity, evidenceUnavailable, truncated } = resolved;

  // 2P-29 — optional normalized context for the focus concept (read-only; no evidence).
  let learnerContextPresentation = null as ReturnType<
    typeof presentUniversalLearnerContext
  > | null;
  const focusConceptId = continuity.growth.focusConceptId;
  if (focusConceptId) {
    try {
      const ulc = await resolveUniversalLearnerContext({
        learnerId: user.id,
        conceptId: focusConceptId,
        includeMaterial: true,
        includeActiveRun: true,
      });
      learnerContextPresentation = presentUniversalLearnerContext(ulc);
    } catch {
      learnerContextPresentation = null;
    }
  }

  return (
    <HubSubpageShell>
      <HubBackBar title="Learner Growth Center" planningActive="study" />
      <LearnerGrowthCenterPanel
        growth={continuity.growth}
        activeRunByConceptId={continuity.activeRunByConceptId}
        continuity={continuity}
        truncated={truncated}
        evidenceUnavailable={evidenceUnavailable}
        learnerContextPresentation={learnerContextPresentation}
      />
    </HubSubpageShell>
  );
}
