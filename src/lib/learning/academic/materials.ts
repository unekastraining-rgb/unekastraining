/**
 * Phase 14 — Connect course materials to the academic model (no second document store).
 */

import type { AcademicMaterial, AcademicSource } from "@/lib/learning/academic/types";

export function academicMaterialFromCourseMaterial(input: {
  userId: string;
  courseId: string;
  materialId: string;
  title: string;
  excerpt?: string | null;
  url?: string | null;
  source?: AcademicSource;
}): AcademicMaterial {
  return {
    id: `material:${input.materialId}`,
    source: input.source ?? "local",
    courseId: input.courseId,
    userId: input.userId,
    title: input.title,
    materialId: input.materialId,
    excerpt: input.excerpt ?? null,
    url: input.url ?? null,
  };
}

/**
 * Filter materials to owning user — ownership isolation.
 */
export function filterAcademicMaterialsForUser(
  userId: string,
  materials: readonly AcademicMaterial[],
): AcademicMaterial[] {
  return materials.filter((m) => m.userId === userId);
}
