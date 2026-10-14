/**
 * Bundle I — Deterministic activity form selection from KL + learner evidence.
 * Not a second recommendation engine — uses practiceForms + demonstrated recognition.
 */

import type { LearnerConceptState } from "@/lib/learning/learner-state/types";
import {
  buildInteractiveActivityForConcept,
  listAvailableInteractiveForms,
} from "@/lib/learning/activity/runtime/build-interactive";
import type {
  InteractiveActivity,
  InteractiveForm,
} from "@/lib/learning/activity/runtime/types";

const RECOGNITION_FORMS: InteractiveForm[] = [
  "multiple_choice",
  "true_false",
  "multi_select",
];

const APPLICATION_FORMS: InteractiveForm[] = [
  "equation_solve",
  "code_predict",
  "code_write",
  "sql_write",
  "prediction",
  "scenario",
  "ordering",
  "diagram_label",
  "explain",
  "fill_in",
];

function hasDemonstratedRecognition(
  state: LearnerConceptState | null | undefined,
): boolean {
  if (!state) return false;
  return (
    (state.correctCount ?? 0) >= 1 ||
    ((state.attemptCount ?? 0) >= 2 && (state.correctCount ?? 0) >= 1)
  );
}

/**
 * Choose an interactive form supported by KL for this concept.
 * If recognition is already demonstrated, prefer application/transfer forms.
 */
export function selectInteractiveActivityForConcept(input: {
  conceptId: string;
  learnerState?: LearnerConceptState | null;
  preferForm?: InteractiveForm;
}): InteractiveActivity | null {
  if (input.preferForm) {
    const preferred = buildInteractiveActivityForConcept(
      input.conceptId,
      input.preferForm,
    );
    // Only accept preferred when the builder actually produced that form
    if (preferred && preferred.form === input.preferForm) return preferred;
  }

  const available = listAvailableInteractiveForms(input.conceptId);
  if (available.length === 0) {
    return buildInteractiveActivityForConcept(input.conceptId);
  }

  const skipRecognition = hasDemonstratedRecognition(input.learnerState);
  if (skipRecognition) {
    for (const form of APPLICATION_FORMS) {
      if (!available.includes(form)) continue;
      const built = buildInteractiveActivityForConcept(input.conceptId, form);
      if (built && !RECOGNITION_FORMS.includes(built.form)) return built;
    }
  }

  // Prefer first available application, else recognition
  for (const form of [...APPLICATION_FORMS, ...RECOGNITION_FORMS]) {
    if (!available.includes(form)) continue;
    const built = buildInteractiveActivityForConcept(input.conceptId, form);
    if (built) return built;
  }

  return buildInteractiveActivityForConcept(input.conceptId);
}
