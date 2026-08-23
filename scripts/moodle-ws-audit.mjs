#!/usr/bin/env node
/**
 * One-off Moodle Mobile Web Service audit.
 * Usage: MOODLE_URL=... MOODLE_TOKEN=... node scripts/moodle-ws-audit.mjs
 * Does NOT modify application code.
 */

const BASE_URL = (process.env.MOODLE_URL ?? "https://moodle.lsua.edu").replace(/\?.*$/, "").replace(/\/$/, "");
const TOKEN = (process.env.MOODLE_TOKEN ?? "").trim();

function maskToken(url) {
  return url.replace(/wstoken=[^&]+/, "wstoken=***REDACTED***");
}

function summarize(value, maxLen = 2000) {
  const json = JSON.stringify(value, null, 2);
  if (json.length <= maxLen) return json;
  return `${json.slice(0, maxLen)}\n... [truncated, ${json.length} chars total]`;
}

async function callMoodle(wsfunction, extraParams = {}) {
  const params = new URLSearchParams({
    wstoken: TOKEN,
    wsfunction,
    moodlewsrestformat: "json",
    ...extraParams,
  });
  const url = `${BASE_URL}/webservice/rest/server.php?${params.toString()}`;
  const requestLog = maskToken(url);

  const result = {
    wsfunction,
    request: requestLog,
    httpStatus: null,
    moodleError: null,
    parsed: null,
    ok: false,
  };

  let response;
  try {
    response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(30_000) });
  } catch (error) {
    result.moodleError = {
      type: "network",
      message: error instanceof Error ? error.message : String(error),
      cause: error instanceof Error && error.cause ? String(error.cause) : undefined,
    };
    return result;
  }

  result.httpStatus = response.status;
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();

  if (text.trimStart().startsWith("<!") || text.includes("<!DOCTYPE")) {
    result.moodleError = {
      type: "html_response",
      message: "Moodle returned HTML instead of JSON",
      preview: text.slice(0, 300),
    };
    return result;
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    result.moodleError = {
      type: "invalid_json",
      message: "Response is not valid JSON",
      preview: text.slice(0, 300),
    };
    return result;
  }

  result.parsed = data;

  if (data && typeof data === "object" && data.exception) {
    result.moodleError = {
      type: "moodle_exception",
      exception: data.exception,
      errorcode: data.errorcode ?? null,
      message: data.message ?? data.exception,
    };
    return result;
  }

  if (!response.ok) {
    result.moodleError = {
      type: "http_error",
      message: `HTTP ${response.status}`,
    };
    return result;
  }

  result.ok = true;
  return result;
}

function logResult(label, result) {
  console.log("\n" + "=".repeat(72));
  console.log(`TEST: ${label}`);
  console.log("=".repeat(72));
  console.log("Moodle function:", result.wsfunction);
  console.log("HTTP request:", result.request);
  console.log("HTTP status:", result.httpStatus ?? "N/A (network failure)");
  if (result.moodleError) {
    console.log("Moodle error:", JSON.stringify(result.moodleError, null, 2));
  } else {
    console.log("Moodle error: none");
  }
  console.log("Parsed response:", summarize(result.parsed));
  console.log("Result:", result.ok ? "SUCCESS" : "FAIL");
}

function findSyllabusCandidates(contents) {
  const candidates = [];
  if (!Array.isArray(contents)) return candidates;

  for (const section of contents) {
    const sectionName = section.name ?? `Section ${section.section ?? "?"}`;
    for (const mod of section.modules ?? []) {
      const name = (mod.name ?? "").toLowerCase();
      const modtype = mod.modname ?? mod.modtype ?? "unknown";
      const looksLikeSyllabus =
        /syllabus|course outline|course information|course info/i.test(mod.name ?? "") ||
        (modtype === "resource" && /syllabus|outline/i.test(name)) ||
        (modtype === "folder" && /syllabus|outline/i.test(name)) ||
        (modtype === "page" && /syllabus|outline|welcome|information/i.test(name));

      if (looksLikeSyllabus || modtype === "resource" || modtype === "folder") {
        candidates.push({
          section: sectionName,
          moduleId: mod.id,
          instanceId: mod.instance,
          modtype,
          name: mod.name,
          url: mod.url ?? null,
          contents: mod.contents ?? null,
          description: mod.description ? String(mod.description).slice(0, 200) : null,
          flaggedAsSyllabus: looksLikeSyllabus,
        });
      }
    }
  }
  return candidates;
}

async function main() {
  if (!TOKEN) {
    console.error("Set MOODLE_TOKEN environment variable.");
    process.exit(1);
  }

  console.log("Moodle Web Service Audit");
  console.log("Site:", BASE_URL);
  console.log("Token length:", TOKEN.length, "chars");
  console.log("Scope: Moodle Mobile Web Service functions only");

  const results = [];

  // 1. Auth / current user
  const siteInfo = await callMoodle("core_webservice_get_site_info");
  logResult("Authentication & current user (core_webservice_get_site_info)", siteInfo);
  results.push({ label: "core_webservice_get_site_info", ...siteInfo });

  let userId = null;
  if (siteInfo.ok && siteInfo.parsed?.userid) {
    userId = siteInfo.parsed.userid;
  }

  // Alternative user info if site_info works
  if (userId) {
    const userInfo = await callMoodle("core_user_get_users_by_field", {
      field: "id",
      "values[0]": String(userId),
    });
    logResult("Current user details (core_user_get_users_by_field)", userInfo);
    results.push({ label: "core_user_get_users_by_field", ...userInfo });
  }

  // 2. Enrolled courses
  const enrolledTimeline = await callMoodle(
    "core_course_get_enrolled_courses_by_timeline_classification",
    { classification: "all", limit: "50", offset: "0" },
  );
  logResult(
    "Enrolled courses (core_course_get_enrolled_courses_by_timeline_classification)",
    enrolledTimeline,
  );
  results.push({
    label: "core_course_get_enrolled_courses_by_timeline_classification",
    ...enrolledTimeline,
  });

  const enrolledLegacy = await callMoodle("core_enrol_get_users_courses", {
    userid: String(userId ?? "0"),
  });
  logResult("Enrolled courses legacy (core_enrol_get_users_courses)", enrolledLegacy);
  results.push({ label: "core_enrol_get_users_courses", ...enrolledLegacy });

  // Pick first real course id
  let courseId = null;
  let courseName = null;
  const courseListRaw =
    enrolledTimeline.parsed?.courses ??
    (Array.isArray(enrolledTimeline.parsed) ? enrolledTimeline.parsed : null) ??
    enrolledLegacy.parsed ??
    [];
  const courseList = Array.isArray(courseListRaw) ? courseListRaw : [];

  for (const c of courseList) {
    if (c.id && c.id > 1) {
      courseId = c.id;
      courseName = c.fullname ?? c.shortname ?? String(c.id);
      break;
    }
  }

  console.log(`\n--- Selected course for deep tests: ${courseId} ${courseName ?? "(none)"} ---`);

  if (!courseId) {
    console.log("No enrolled course found; skipping course-scoped tests.");
  } else {
    // 3. Course contents / modules (syllabus discovery)
    const contents = await callMoodle("core_course_get_contents", {
      courseid: String(courseId),
    });
    logResult(`Course contents (core_course_get_contents) courseId=${courseId}`, contents);
    results.push({ label: "core_course_get_contents", ...contents });

    if (contents.ok) {
      const syllabusCandidates = findSyllabusCandidates(contents.parsed);
      console.log("\n--- Syllabus / resource module scan ---");
      console.log(
        summarize(
          {
            courseId,
            courseName,
            totalSections: Array.isArray(contents.parsed) ? contents.parsed.length : 0,
            syllabusCandidates,
            allModuleTypes: [
              ...new Set(
                (contents.parsed ?? []).flatMap((s) =>
                  (s.modules ?? []).map((m) => m.modname ?? m.modtype),
                ),
              ),
            ],
          },
          4000,
        ),
      );
    }

    // 4. Assignments
    const assignments = await callMoodle("mod_assign_get_assignments", {
      "courseids[0]": String(courseId),
    });
    logResult(`Assignments (mod_assign_get_assignments) courseId=${courseId}`, assignments);
    results.push({ label: "mod_assign_get_assignments", ...assignments });

    let assignmentId = null;
    const assignCourse = assignments.parsed?.courses?.find((c) => c.id === courseId);
    if (assignCourse?.assignments?.length) {
      assignmentId = assignCourse.assignments[0].id;
    }

    if (assignmentId) {
      const grades = await callMoodle("mod_assign_get_grades", {
        "assignmentids[0]": String(assignmentId),
      });
      logResult(`Assignment grades (mod_assign_get_grades) assignmentId=${assignmentId}`, grades);
      results.push({ label: "mod_assign_get_grades", ...grades });
    } else {
      console.log("\nNo assignments in first course; skipping mod_assign_get_grades.");
    }

    // 5. Calendar events
    const now = Math.floor(Date.now() / 1000);
    const later = now + 120 * 24 * 60 * 60;
    const calendar = await callMoodle("core_calendar_get_calendar_events", {
      "events[courseids][0]": String(courseId),
      "options[userevents]": "0",
      "options[siteevents]": "0",
      "options[timestart]": String(now),
      "options[timeend]": String(later),
    });
    logResult(`Calendar events (core_calendar_get_calendar_events) courseId=${courseId}`, calendar);
    results.push({ label: "core_calendar_get_calendar_events", ...calendar });
  }

  // Summary
  console.log("\n" + "#".repeat(72));
  console.log("SUMMARY");
  console.log("#".repeat(72));
  for (const r of results) {
    const err =
      r.moodleError?.errorcode ??
      r.moodleError?.message ??
      r.moodleError?.type ??
      "none";
    console.log(
      `${r.ok ? "OK " : "FAIL"} | ${r.label} | HTTP ${r.httpStatus ?? "—"} | ${err}`,
    );
  }
}

main().catch((error) => {
  console.error("Audit crashed:", error);
  process.exit(1);
});
