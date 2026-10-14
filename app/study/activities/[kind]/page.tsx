import { HubBackBar } from "@/components/hub/HubBackBar";
import { ActivityWorkspace } from "@/components/study/ActivityWorkspace";
import { ConceptEntryPicker } from "@/components/study/ConceptEntryPicker";
import { LearnerContextStrip } from "@/components/study/LearnerContextStrip";
import { db } from "@/lib/db";
import { resolveActivityLaunchConceptId } from "@/lib/learning/activities/resolve-activity-concept";
import {
  presentMaterialSourceCitation,
  resolveLearningMaterialContext,
} from "@/lib/learning/material-context";
import {
  presentUniversalLearnerContext,
  resolveUniversalLearnerContext,
} from "@/lib/learning/universal-learner-context";
import { getOrCreateDefaultUser } from "@/lib/user";

export const dynamic = "force-dynamic";

const KINDS = new Set([
  "coding",
  "sql",
  "writing",
  "lab",
  "simulation",
  "game",
  "project",
  "presentation",
  "math",
  "networking",
  "language",
]);

const KIND_PICKER_LABELS: Record<string, string> = {
  coding: "Coding",
  sql: "SQL",
  writing: "Writing practice",
  lab: "Labs",
  simulation: "Simulations",
  game: "Games",
  project: "Projects",
  presentation: "Presentations",
  math: "Math",
  networking: "Networking",
  language: "Language",
};

export default async function StudyActivityPage({
  params,
  searchParams,
}: {
  params: Promise<{ kind: string }>;
  searchParams: Promise<{
    conceptId?: string;
    courseId?: string;
    topic?: string;
    adaptiveRunId?: string;
    adaptiveStep?: string;
    materialId?: string;
    /** Bundle M — preserve catalog/deep-link challenge selection */
    challengeId?: string;
  }>;
}) {
  const { kind } = await params;
  const query = await searchParams;
  const challengeId = query.challengeId?.trim() || null;
  const user = await getOrCreateDefaultUser();

  if (!KINDS.has(kind)) {
    return (
      <>
        <HubBackBar title="Activity" planningActive="study" />
        <p className="mx-auto max-w-lg px-4 py-12 text-center text-stone-600">
          Unknown activity kind.
        </p>
      </>
    );
  }

  const resolved = await resolveActivityLaunchConceptId({
    userId: user.id,
    conceptId: query.conceptId,
    courseId: query.courseId,
    topic: query.topic,
    materialId: query.materialId,
  });
  const conceptId = resolved.conceptId;

  const profile = await db.learnerProfile.findUnique({
    where: { userId: user.id },
    select: {
      modalityPreferencesJson: true,
      accessibilityPreferencesJson: true,
    },
  });

  const materialResolution = conceptId
    ? await resolveLearningMaterialContext({
        userId: user.id,
        conceptId,
        explicitMaterialId: query.materialId ?? null,
        activityMaterialId: query.materialId ?? null,
      })
    : { context: null, prioritySource: "none" as const, createsEvidence: false as const };
  const materialCitation = presentMaterialSourceCitation(materialResolution.context);

  let learnerContextPresentation = null as ReturnType<
    typeof presentUniversalLearnerContext
  > | null;
  if (conceptId) {
    try {
      const ulc = await resolveUniversalLearnerContext({
        learnerId: user.id,
        conceptId,
        materialId: query.materialId ?? null,
        includeMaterial: true,
        includeActiveRun: true,
      });
      learnerContextPresentation = presentUniversalLearnerContext(ulc);
    } catch {
      learnerContextPresentation = null;
    }
  }

  const topicLabel = query.topic?.trim() || null;
  const label = KIND_PICKER_LABELS[kind] ?? "Practice";
  const continueBase = challengeId
    ? `/study/activities/${kind}?challengeId=${encodeURIComponent(challengeId)}`
    : `/study/activities/${kind}`;

  return (
    <>
      <HubBackBar title={label} planningActive="study" />
      {!conceptId ? (
        <ConceptEntryPicker
          activityKind={kind}
          activityLabel={label}
          continueHrefBase={continueBase}
        />
      ) : (
        <div className="mx-auto max-w-6xl space-y-3 px-4 pt-4">
          {topicLabel ? (
            <p
              data-activity-topic-context
              className="text-sm font-semibold text-stone-800"
            >
              {topicLabel}
            </p>
          ) : null}
          <LearnerContextStrip presentation={learnerContextPresentation} />
          <ActivityWorkspace
            kind={kind}
            conceptId={conceptId}
            initialChallengeId={challengeId}
            adaptiveRunId={query.adaptiveRunId ?? null}
            adaptiveStep={
              query.adaptiveStep != null && query.adaptiveStep !== ""
                ? Number(query.adaptiveStep)
                : null
            }
            materialCitation={materialCitation}
            modalityPreferencesJson={profile?.modalityPreferencesJson}
            accessibilityPreferencesJson={profile?.accessibilityPreferencesJson}
          />
        </div>
      )}
    </>
  );
}
