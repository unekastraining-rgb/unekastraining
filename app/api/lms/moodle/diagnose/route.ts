import { NextResponse } from "next/server";

import { LMSProvider } from "@/generated/prisma";
import { fetchMoodleEnrolledCourses } from "@/lib/lms/moodle-api";
import { resolveMoodleCredentials } from "@/lib/lms/moodle-env";
import { normalizeMoodleBaseUrl } from "@/lib/lms/moodle-url";
import { getOrCreateDefaultUser } from "@/lib/user";

type DiagnoseStep = { ok: boolean; label: string; detail?: string };

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = (await request.json()) as { baseUrl?: string; accessToken?: string };

    let baseUrl = body.baseUrl?.trim() ?? "";
    let token = body.accessToken?.trim() ?? "";

    if (!baseUrl || !token) {
      const resolved = await resolveMoodleCredentials(user.id, { persistEnv: false });
      baseUrl = resolved?.baseUrl ?? "";
      token = resolved?.accessToken ?? "";
    }

    const steps: DiagnoseStep[] = [];

    if (!baseUrl) {
      steps.push({ ok: false, label: "Site URL", detail: "Enter https://moodle.lsua.edu (root only, not the token page)." });
      return NextResponse.json({
        success: false,
        report: { summary: "Missing Moodle site URL.", steps },
      });
    }

    const root = normalizeMoodleBaseUrl(baseUrl);
    if (root !== baseUrl.replace(/\/$/, "")) {
      steps.push({
        ok: true,
        label: "URL normalized",
        detail: `Using ${root} (token/login page paths are stripped).`,
      });
    } else {
      steps.push({ ok: true, label: "Site URL", detail: root });
    }

    if (!token) {
      steps.push({ ok: false, label: "Token", detail: "Paste your Web Services token from Manage tokens." });
      return NextResponse.json({
        success: false,
        report: { summary: "Missing Moodle token.", steps },
      });
    }

    steps.push({ ok: true, label: "Token", detail: "Present (not shown)." });

    try {
      const courses = await fetchMoodleEnrolledCourses(root, token);
      steps.push({
        ok: true,
        label: "Server can reach Moodle",
        detail: `Found ${courses.length} enrolled course${courses.length === 1 ? "" : "s"}.`,
      });
      return NextResponse.json({
        success: true,
        report: {
          summary: "Moodle API works from this Study Haul server. You can use Sync now.",
          steps,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not reach Moodle.";
      const isNetwork =
        message.includes("Could not reach Moodle") ||
        message === "fetch failed" ||
        message.includes("Failed to fetch");

      steps.push({
        ok: false,
        label: "Server → Moodle",
        detail: isNetwork
          ? "This server cannot reach your campus Moodle (common on cloud hosting). Use Sync from this device in Settings while on campus Wi‑Fi or VPN."
          : message,
      });

      return NextResponse.json({
        success: false,
        report: {
          summary: isNetwork
            ? "Campus Moodle is not reachable from our server — use browser sync on your device."
            : "Moodle API check failed.",
          steps,
        },
      });
    }
  } catch (error) {
    console.error("Moodle diagnose failed:", error);
    return NextResponse.json(
      { success: false, error: "Moodle diagnose failed." },
      { status: 500 },
    );
  }
}
