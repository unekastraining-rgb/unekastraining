/**
 * 2G-70 WS19 — Persona / accessibility structural hooks (safe only).
 *
 * Presentation adaptation hooks — NOT a second learning engine.
 * Does not infer sensitive personal attributes.
 * Does not change diagnosis, evidence, or mastery.
 */

export type AccessibilityPresentationHooks = {
  /** Prefer reduced motion in learner-facing animations. */
  preferReducedMotion: boolean;
  /** Prefer larger touch targets / denser spacing adjustments. */
  preferLargerTargets: boolean;
  /** Prefer simplified copy density where surfaces support it. */
  preferSimplifiedCopy: boolean;
};

export type PersonaPresentationHooks = {
  /** Opaque modality preference keys from LearnerProfile JSON — never inferred. */
  modalityKeys: string[];
  accessibility: AccessibilityPresentationHooks;
};

const DEFAULT_ACCESSIBILITY: AccessibilityPresentationHooks = {
  preferReducedMotion: false,
  preferLargerTargets: false,
  preferSimplifiedCopy: false,
};

/**
 * Parse accessibilityPreferencesJson into safe structural hooks.
 * Unknown keys ignored. Never invents medical/sensitive attributes.
 */
export function resolveAccessibilityPresentationHooks(
  accessibilityPreferencesJson: string | null | undefined,
): AccessibilityPresentationHooks {
  if (!accessibilityPreferencesJson?.trim()) {
    return { ...DEFAULT_ACCESSIBILITY };
  }
  try {
    const parsed = JSON.parse(accessibilityPreferencesJson) as Record<
      string,
      unknown
    >;
    return {
      preferReducedMotion: Boolean(parsed.preferReducedMotion),
      preferLargerTargets: Boolean(parsed.preferLargerTargets),
      preferSimplifiedCopy: Boolean(parsed.preferSimplifiedCopy),
    };
  } catch {
    return { ...DEFAULT_ACCESSIBILITY };
  }
}

/**
 * Parse modalityPreferencesJson keys only — no inference of age/persona traits.
 */
export function resolvePersonaPresentationHooks(input: {
  modalityPreferencesJson?: string | null;
  accessibilityPreferencesJson?: string | null;
}): PersonaPresentationHooks {
  let modalityKeys: string[] = [];
  if (input.modalityPreferencesJson?.trim()) {
    try {
      const parsed = JSON.parse(input.modalityPreferencesJson) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        modalityKeys = Object.keys(parsed as Record<string, unknown>).filter(
          (k) => !/age|race|health|disability|medical|gender|religion/i.test(k),
        );
      }
    } catch {
      modalityKeys = [];
    }
  }

  return {
    modalityKeys,
    accessibility: resolveAccessibilityPresentationHooks(
      input.accessibilityPreferencesJson,
    ),
  };
}

export function personaAccessibilityTruthSummary(): {
  createsSecondLearningEngine: false;
  infersSensitiveAttributes: false;
  affectsDiagnosis: false;
  affectsEvidence: false;
  affectsMastery: false;
  structuralHooksOnly: true;
} {
  return {
    createsSecondLearningEngine: false,
    infersSensitiveAttributes: false,
    affectsDiagnosis: false,
    affectsEvidence: false,
    affectsMastery: false,
    structuralHooksOnly: true,
  };
}
