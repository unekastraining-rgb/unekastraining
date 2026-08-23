function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, "");
}

export interface BlackboardColumnMeta {
  id: string;
  name: string;
  dueDate?: string | null;
  scorePossible?: number | null;
  externalGrade?: boolean;
}

export interface BlackboardUserGrade {
  userId?: string;
  columnId?: string;
  status?: string;
  score?: number | null;
  text?: string | null;
  displayGrade?: {
    score?: number;
    possible?: number;
    text?: string;
  };
}

export async function fetchBlackboardUserId(
  baseUrl: string,
  accessToken: string,
): Promise<string | null> {
  const url = `${normalizeBaseUrl(baseUrl)}/learn/api/public/v1/users/me`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { id?: string };
  return data.id ?? null;
}

export function parseBlackboardColumn(raw: {
  id: string;
  name?: string;
  dueDate?: string;
  externalGrade?: boolean;
  score?: { possible?: number };
  grading?: { due?: string };
}): BlackboardColumnMeta | null {
  if (!raw.id || !raw.name?.trim()) return null;
  const name = raw.name.trim();
  const lower = name.toLowerCase();
  if (lower.includes("total") || lower === "weighted total") return null;

  return {
    id: raw.id,
    name,
    dueDate: raw.grading?.due ?? raw.dueDate ?? null,
    scorePossible: raw.score?.possible ?? null,
    externalGrade: raw.externalGrade === true,
  };
}

export async function fetchBlackboardGradebookColumns(
  baseUrl: string,
  accessToken: string,
  courseId: string,
): Promise<BlackboardColumnMeta[]> {
  const headers = { Authorization: `Bearer ${accessToken}` };
  const root = normalizeBaseUrl(baseUrl);

  for (const version of ["v2", "v1"] as const) {
    const url = `${root}/learn/api/public/${version}/courses/${courseId}/gradebook/columns?limit=200`;
    const response = await fetch(url, { headers, cache: "no-store" });
    if (!response.ok) continue;

    const data = (await response.json()) as {
      results?: Array<{
        id: string;
        name?: string;
        dueDate?: string;
        externalGrade?: boolean;
        score?: { possible?: number };
        grading?: { due?: string };
      }>;
    };

    return (data.results ?? [])
      .map(parseBlackboardColumn)
      .filter((column): column is BlackboardColumnMeta => column !== null)
      .filter((column) => !column.externalGrade);
  }

  return [];
}

export async function fetchBlackboardUserColumnGrade(
  baseUrl: string,
  accessToken: string,
  courseId: string,
  columnId: string,
  userId: string,
): Promise<BlackboardUserGrade | null> {
  const headers = { Authorization: `Bearer ${accessToken}` };
  const root = normalizeBaseUrl(baseUrl);

  for (const version of ["v2", "v1"] as const) {
    const directUrl = `${root}/learn/api/public/${version}/courses/${courseId}/gradebook/columns/${columnId}/users/${userId}`;
    const direct = await fetch(directUrl, { headers, cache: "no-store" });
    if (direct.ok) {
      return (await direct.json()) as BlackboardUserGrade;
    }
    if (direct.status !== 404 && direct.status !== 403) break;
  }

  const listUrl = `${root}/learn/api/public/v1/courses/${courseId}/gradebook/columns/${columnId}/users?limit=50`;
  const listResponse = await fetch(listUrl, { headers, cache: "no-store" });
  if (!listResponse.ok) return null;

  const payload = (await listResponse.json()) as { results?: BlackboardUserGrade[] };
  return (
    payload.results?.find((entry) => entry.userId === userId) ??
    payload.results?.[0] ??
    null
  );
}

export function parseBlackboardUserGrade(
  grade: BlackboardUserGrade | null,
  columnPossible?: number | null,
): {
  grade: number | null;
  maxGrade: number | null;
  graded: boolean;
  letter: string | null;
} {
  if (!grade) {
    return { grade: null, maxGrade: columnPossible ?? null, graded: false, letter: null };
  }

  const numeric =
    typeof grade.score === "number" && Number.isFinite(grade.score)
      ? grade.score
      : typeof grade.displayGrade?.score === "number" && Number.isFinite(grade.displayGrade.score)
        ? grade.displayGrade.score
        : null;

  const possible =
    columnPossible ??
    grade.displayGrade?.possible ??
    (numeric !== null ? null : null);

  const letter =
    grade.text?.trim() ||
    grade.displayGrade?.text?.trim() ||
    null;

  const graded =
    grade.status === "Graded" ||
    numeric !== null ||
    Boolean(letter);

  return {
    grade: numeric,
    maxGrade: typeof possible === "number" && Number.isFinite(possible) ? possible : null,
    graded,
    letter,
  };
}
