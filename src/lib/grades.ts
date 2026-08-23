export function formatGradeLabel(assignment: {
  grade?: number | null;
  maxGrade?: number | null;
  description?: string | null;
}): string | null {
  if (assignment.grade != null && assignment.maxGrade != null) {
    return `${assignment.grade}/${assignment.maxGrade}`;
  }
  if (assignment.grade != null) {
    return String(assignment.grade);
  }
  const match = assignment.description?.match(/Grade:\s*(.+)/i);
  return match?.[1]?.trim() ?? null;
}

export function courseGradeSummary(
  assignments: Array<{ grade?: number | null; maxGrade?: number | null }>,
): { average: number; gradedCount: number } | null {
  const scored = assignments.filter(
    (assignment) =>
      assignment.grade != null &&
      assignment.maxGrade != null &&
      assignment.maxGrade > 0,
  );
  if (scored.length === 0) return null;

  const total = scored.reduce(
    (sum, assignment) =>
      sum + (assignment.grade! / assignment.maxGrade!) * 100,
    0,
  );

  return {
    average: Math.round(total / scored.length),
    gradedCount: scored.length,
  };
}
