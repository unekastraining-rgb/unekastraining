import {
  fetchBlackboardGradebookColumns,
  fetchBlackboardUserColumnGrade,
  fetchBlackboardUserId,
  parseBlackboardUserGrade,
} from "@/lib/lms/blackboard-grades";

export interface BlackboardDiagnoseStep {
  id: string;
  label: string;
  ok: boolean;
  status?: number;
  detail?: string;
}

export interface BlackboardDiagnoseReport {
  ok: boolean;
  baseUrl: string;
  steps: BlackboardDiagnoseStep[];
  summary: string;
  sampleGrade?: {
    courseId: string;
    courseName: string;
    columnName: string;
    gradeLabel: string;
  };
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, "");
}

async function probe(
  label: string,
  id: string,
  url: string,
  accessToken: string,
): Promise<{ step: BlackboardDiagnoseStep; payload?: unknown }> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  const step: BlackboardDiagnoseStep = {
    id,
    label,
    ok: response.ok,
    status: response.status,
    detail: response.ok ? "OK" : `HTTP ${response.status}`,
  };

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    if (text) {
      step.detail = `${step.detail}: ${text.slice(0, 180)}`;
    }
    return { step };
  }

  const payload = await response.json().catch(() => null);
  return { step, payload };
}

export async function diagnoseBlackboardConnection(
  baseUrl: string,
  accessToken: string,
): Promise<BlackboardDiagnoseReport> {
  const root = normalizeBaseUrl(baseUrl);
  const steps: BlackboardDiagnoseStep[] = [];

  const userProbe = await probe(
    "Authenticate (users/me)",
    "auth",
    `${root}/learn/api/public/v1/users/me`,
    accessToken,
  );
  steps.push(userProbe.step);
  const userId =
    userProbe.payload && typeof userProbe.payload === "object"
      ? ((userProbe.payload as { id?: string }).id ?? null)
      : null;

  const coursesProbe = await probe(
    "List courses",
    "courses",
    `${root}/learn/api/public/v1/courses?limit=5`,
    accessToken,
  );
  steps.push(coursesProbe.step);

  const courses =
    coursesProbe.payload &&
    typeof coursesProbe.payload === "object" &&
    Array.isArray((coursesProbe.payload as { results?: unknown[] }).results)
      ? ((coursesProbe.payload as { results: Array<{ id: string; name?: string; courseId?: string }> })
          .results)
      : [];

  let sampleGrade: BlackboardDiagnoseReport["sampleGrade"];

  if (userId && courses.length > 0) {
    const course = courses[0];
    const courseKey = course.courseId ?? course.id;
    const columns = await fetchBlackboardGradebookColumns(root, accessToken, courseKey);

    steps.push({
      id: "gradebook",
      label: `Gradebook columns (${course.name ?? courseKey})`,
      ok: columns.length > 0,
      detail:
        columns.length > 0
          ? `Found ${columns.length} column${columns.length === 1 ? "" : "s"}`
          : "No gradebook columns returned (check course role or API version)",
    });

    if (columns.length > 0) {
      const column = columns[0];
      const userGrade = await fetchBlackboardUserColumnGrade(
        root,
        accessToken,
        courseKey,
        column.id,
        userId,
      );
      const parsed = parseBlackboardUserGrade(userGrade, column.scorePossible);

      const gradeLabel =
        parsed.grade != null && parsed.maxGrade != null
          ? `${parsed.grade}/${parsed.maxGrade}`
          : parsed.letter ?? (parsed.graded ? "Graded" : "No grade yet");

      steps.push({
        id: "grade",
        label: `Sample grade (${column.name})`,
        ok: true,
        detail: gradeLabel,
      });

      sampleGrade = {
        courseId: courseKey,
        courseName: course.name ?? courseKey,
        columnName: column.name,
        gradeLabel,
      };
    }
  } else if (userProbe.step.ok) {
    const resolvedUserId = userId ?? (await fetchBlackboardUserId(root, accessToken));
    steps.push({
      id: "user-id",
      label: "Resolve user id",
      ok: Boolean(resolvedUserId),
      detail: resolvedUserId ?? "Could not resolve Blackboard user id",
    });
  }

  const ok = steps.every((step) => step.ok);
  const failed = steps.filter((step) => !step.ok);

  return {
    ok,
    baseUrl: root,
    steps,
    summary: ok
      ? `Blackboard connection looks good${sampleGrade ? ` — sample: ${sampleGrade.gradeLabel}` : ""}.`
      : `Blackboard check failed at: ${failed.map((step) => step.label).join(", ")}.`,
    sampleGrade,
  };
}
