"use client";

import { collectMoodleCoursesForImport } from "@/lib/lms/moodle-collect";
import { normalizeMoodleBaseUrl } from "@/lib/lms/moodle-url";

function wrapBrowserNetworkError(error: unknown): Error {
  const message = error instanceof Error ? error.message : "Moodle sync failed.";
  if (message === "Failed to fetch" || message.includes("NetworkError")) {
    return new Error(
      "Your browser could not reach Moodle. Stay on campus Wi‑Fi or VPN. If you're using the hosted Study Haul app, run it locally (npm run dev) on a machine that can access moodle.lsua.edu.",
    );
  }
  return error instanceof Error ? error : new Error(message);
}

export async function syncMoodleFromBrowser(
  baseUrl: string,
  token: string,
): Promise<{ message: string }> {
  const root = normalizeMoodleBaseUrl(baseUrl);
  let courses;
  try {
    courses = await collectMoodleCoursesForImport(root, token);
  } catch (error) {
    throw wrapBrowserNetworkError(error);
  }

  const response = await fetch("/api/lms/moodle/ingest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ courses }),
  });
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error ?? "Import failed.");
  }
  return { message: data.result?.message ?? "Moodle sync complete." };
}
