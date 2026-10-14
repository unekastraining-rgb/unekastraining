/**
 * 2P-27 — Owned material context for Unified Tutor.
 * Ordinary Q&A must not auto-create evidence (caller sets evidenceIntent).
 */

import { loadMaterialForUser } from "@/lib/materials/workbook-from-material";
import { presentLearnerFacingProvenance } from "./provenance";

const TUTOR_MATERIAL_CONTEXT_CAP = 4500;

export type OwnedMaterialTutorContext = {
  materialId: string;
  title: string;
  provenanceLabel: string;
  sourceText: string;
};

/**
 * Load truncated extracted text for an owned material.
 * Returns null when material is missing or foreign (no cross-learner leak).
 */
export async function loadOwnedMaterialTutorContext(
  userId: string,
  materialId: string,
): Promise<OwnedMaterialTutorContext | null> {
  const material = await loadMaterialForUser(userId, materialId);
  if (!material) return null;

  const text = (material.extractedText ?? "").trim();
  if (!text) {
    return {
      materialId: material.id,
      title: material.title,
      provenanceLabel: presentLearnerFacingProvenance({
        materialTitle: material.title,
      }).label,
      sourceText: `Material title: ${material.title}\n(No extracted text available yet.)`,
    };
  }

  const truncated = text.length > TUTOR_MATERIAL_CONTEXT_CAP;
  const sourceText = truncated
    ? `${text.slice(0, TUTOR_MATERIAL_CONTEXT_CAP)}\n\n[Material context truncated for length]`
    : text;

  return {
    materialId: material.id,
    title: material.title,
    provenanceLabel: presentLearnerFacingProvenance({
      materialTitle: material.title,
    }).label,
    sourceText: `${presentLearnerFacingProvenance({ materialTitle: material.title }).label}\n\n${sourceText}`,
  };
}
