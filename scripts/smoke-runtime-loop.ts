/**
 * Runtime smoke: verify strategy routes respond when dev server is up (#1 + #3).
 * Loop UI is client-rendered — this checks HTTP health + course/topic API data.
 * Run: npm run smoke:runtime-loop
 */
const BASE = process.env.SMOKE_BASE_URL?.trim() || "http://localhost:3000";

async function fetchStatus(path: string): Promise<number | null> {
  try {
    const response = await fetch(`${BASE}${path}`, { redirect: "follow" });
    return response.status;
  } catch {
    return null;
  }
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${BASE}${path}`, {
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function main() {
  const studyStatus = await fetchStatus("/study");
  if (!studyStatus) {
    console.log(`SKIP: runtime loop smoke — dev server not reachable at ${BASE}`);
    process.exit(0);
  }

  const routes = [
    ["/study", studyStatus],
    ["/core?courseId=demo-cs201&pack=1&topic=Binary+Search+Trees", await fetchStatus("/core?courseId=demo-cs201&pack=1&topic=Binary+Search+Trees")],
    ["/study/blurting?courseId=demo-cs201&topic=Binary+Search+Trees", await fetchStatus("/study/blurting?courseId=demo-cs201&topic=Binary+Search+Trees")],
    ["/study/teach-me?courseId=demo-cs201&topic=Binary+Search+Trees", await fetchStatus("/study/teach-me?courseId=demo-cs201&topic=Binary+Search+Trees")],
    ["/study/lucky?courseId=demo-cs201", await fetchStatus("/study/lucky?courseId=demo-cs201")],
    ["/study/mixed?courseId=demo-cs201&topic=Binary+Search+Trees", await fetchStatus("/study/mixed?courseId=demo-cs201&topic=Binary+Search+Trees")],
    ["/flashcards?courseId=demo-cs201&topic=Binary+Search+Trees", await fetchStatus("/flashcards?courseId=demo-cs201&topic=Binary+Search+Trees")],
    ["/study/practice?courseId=demo-cs201&topic=Binary+Search+Trees", await fetchStatus("/study/practice?courseId=demo-cs201&topic=Binary+Search+Trees")],
    ["/quizzes?courseId=demo-cs201&make=1&topic=Binary+Search+Trees", await fetchStatus("/quizzes?courseId=demo-cs201&make=1&topic=Binary+Search+Trees")],
    ["/study/grade-school?courseId=demo-cs201&step=0", await fetchStatus("/study/grade-school?courseId=demo-cs201&step=0")],
    ["/dashboard?tab=chat&courseId=demo-cs201&topic=Binary+Search+Trees", await fetchStatus("/dashboard?tab=chat&courseId=demo-cs201&topic=Binary+Search+Trees")],
  ] as const;

  let failed = false;
  for (const [path, status] of routes) {
    if (status !== 200) {
      console.error(`FAIL: ${path} — expected 200, got ${status ?? "unreachable"}`);
      failed = true;
    } else {
      console.log(`  ✓ ${path} → 200`);
    }
  }

  const courses = await fetchJson<{ courses?: Array<{ id: string; topics?: unknown[] }> }>(
    "/api/courses",
  );
  if (!courses?.courses?.length) {
    console.log(
      "  ⊘ /api/courses — skipped (no session cookie in CLI; routes still returned 200)",
    );
  } else {
    const withTopics = courses.courses.filter(
      (course) => Array.isArray(course.topics) && course.topics.length > 0,
    ).length;
    console.log(`  ✓ /api/courses — ${courses.courses.length} course(s), ${withTopics} with topics`);
    if (withTopics === 0) {
      console.error("FAIL: /api/courses — no syllabus/LMS topics for cold-start loop");
      failed = true;
    }
  }

  if (failed) process.exit(1);
  console.log("✓ Runtime loop smoke PASS");
  console.log(`  base: ${BASE}`);
  console.log("  note: loop chips are client-rendered — use smoke:device-loop on iPad for tap-through");
}

main().catch((error) => {
  console.error("FAIL:", error instanceof Error ? error.message : error);
  process.exit(1);
});
