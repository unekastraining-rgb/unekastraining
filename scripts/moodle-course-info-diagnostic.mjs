#!/usr/bin/env node
/**
 * Read-only diagnostic for Course Info planning.
 * Outputs sanitized response shapes — no secrets in output.
 */
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env");
    const text = readFileSync(envPath, "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (!m) continue;
      const key = m[1];
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // ignore
  }
}

loadEnv();

const BASE_URL = (process.env.MOODLE_URL ?? "").replace(/\?.*$/, "").replace(/\/$/, "");
const TOKEN = (process.env.MOODLE_TOKEN ?? "").trim();

function sanitize(value, depth = 0) {
  if (value === null || value === undefined) return value;
  if (depth > 6) return "[nested]";
  if (typeof value === "string") {
    if (value.length > 200 && (value.startsWith("data:") || value.includes("base64"))) {
      return `[string ${value.length} chars, truncated]`;
    }
    if (value.includes("@") && value.includes(".")) return "[email redacted]";
    if (value.length > 300) return `${value.slice(0, 300)}… [${value.length} chars]`;
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return [];
    const sample = sanitize(value[0], depth + 1);
    return { _arrayLength: value.length, _sampleItem: sample };
  }
  if (typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = sanitize(v, depth + 1);
    }
    return out;
  }
  return value;
}

async function callMoodle(wsfunction, extraParams = {}) {
  const params = new URLSearchParams({
    wstoken: TOKEN,
    wsfunction,
    moodlewsrestformat: "json",
    ...extraParams,
  });
  const url = `${BASE_URL}/webservice/rest/server.php?${params.toString()}`;

  const result = {
    wsfunction,
    httpStatus: null,
    ok: false,
    errorcode: null,
    message: null,
    exception: null,
    shape: null,
  };

  try {
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(30_000) });
    result.httpStatus = response.status;
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      result.message = "invalid JSON";
      return result;
    }
    if (data?.exception) {
      result.errorcode = data.errorcode ?? null;
      result.message = data.message ?? data.exception;
      result.exception = data.exception;
      return result;
    }
    result.ok = true;
    result.shape = sanitize(data);
    return result;
  } catch (error) {
    result.message = error instanceof Error ? error.message : String(error);
    return result;
  }
}

async function main() {
  if (!BASE_URL || !TOKEN) {
    console.error("MOODLE_URL and MOODLE_TOKEN required in .env");
    process.exit(1);
  }

  const report = { site: BASE_URL, tests: [] };

  const siteInfo = await callMoodle("core_webservice_get_site_info");
  report.tests.push(siteInfo);
  const functionNames = siteInfo.ok
    ? (siteInfo.shape?.functions?._sampleItem
        ? "see full count below"
        : null)
    : null;

  const enrolled = await callMoodle(
    "core_course_get_enrolled_courses_by_timeline_classification",
    { classification: "all", limit: "50", offset: "0" },
  );
  report.tests.push(enrolled);

  let courseId = null;
  if (enrolled.ok && enrolled.shape?.courses?._sampleItem?.id) {
    courseId = enrolled.shape.courses._sampleItem.id;
  } else if (enrolled.ok && enrolled.shape?.courses?._arrayLength) {
    // need raw id - re-fetch one course id only
    const raw = await fetch(
      `${BASE_URL}/webservice/rest/server.php?` +
        new URLSearchParams({
          wstoken: TOKEN,
          wsfunction: "core_course_get_enrolled_courses_by_timeline_classification",
          moodlewsrestformat: "json",
          classification: "all",
          limit: "5",
          offset: "0",
        }),
    );
    const rawData = await raw.json();
    courseId = rawData?.courses?.find((c) => c.id > 1)?.id ?? rawData?.courses?.[0]?.id;
  }

  report.primaryCourseId = courseId;

  if (courseId) {
    report.tests.push(
      await callMoodle("core_course_get_contents", { courseid: String(courseId) }),
    );
    report.tests.push(
      await callMoodle("mod_assign_get_assignments", { "courseids[0]": String(courseId) }),
    );
    const now = Math.floor(Date.now() / 1000);
    const later = now + 120 * 24 * 3600;
    report.tests.push(
      await callMoodle("core_calendar_get_calendar_events", {
        "events[courseids][0]": String(courseId),
        "options[userevents]": "0",
        "options[siteevents]": "0",
        "options[timestart]": String(now),
        "options[timeend]": String(later),
      }),
    );
    // Extra: instructor-related mobile WS
    for (const [fn, extraParams] of [
      ["mod_book_get_books_by_courses", { "courseids[0]": String(courseId) }],
      ["mod_page_get_pages_by_courses", { "courseids[0]": String(courseId) }],
      ["core_enrol_get_enrolled_users", { courseid: String(courseId) }],
    ]) {
      const extra = await callMoodle(fn, extraParams);
      report.tests.push(extra);
    }
  }

  // Function list count from raw site_info
  if (siteInfo.ok) {
    const raw = await fetch(
      `${BASE_URL}/webservice/rest/server.php?` +
        new URLSearchParams({
          wstoken: TOKEN,
          wsfunction: "core_webservice_get_site_info",
          moodlewsrestformat: "json",
        }),
    );
    const rawSite = await raw.json();
    report.tokenFunctionCount = rawSite.functions?.length ?? 0;
    report.studyHaulFunctions = [
      "core_webservice_get_site_info",
      "core_course_get_enrolled_courses_by_timeline_classification",
      "core_course_get_contents",
      "mod_assign_get_assignments",
      "mod_assign_get_grades",
      "core_calendar_get_calendar_events",
      "mod_book_get_books_by_courses",
      "mod_page_get_pages_by_courses",
      "core_enrol_get_enrolled_users",
    ].map((name) => ({
      name,
      onToken: Boolean(rawSite.functions?.some((f) => f.name === name)),
    }));
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
