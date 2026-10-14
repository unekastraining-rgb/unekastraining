import { NextResponse } from "next/server";

import { LMSProvider } from "@/generated/prisma";
import { fetchCanvasCourses } from "@/lib/lms/sync";
import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";
import { openLmsToken } from "@/lib/security/lms-token-crypto";

type DiagnoseStep = { ok: boolean; label: string; detail?: string };

function normalizeCanvasBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, "");
}

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = (await request.json()) as { baseUrl?: string; accessToken?: string };

    let baseUrl = body.baseUrl?.trim() ?? "";
    let token = body.accessToken?.trim() ?? "";

    if (!baseUrl || !token) {
      const saved = await db.lMSConnection.findFirst({
        where: { userId: user.id, provider: LMSProvider.CANVAS },
      });
      baseUrl = baseUrl || saved?.baseUrl?.trim() || "";
      token = token || openLmsToken(saved?.accessToken)?.trim() || "";
    }

    const steps: DiagnoseStep[] = [];

    if (!baseUrl) {
      steps.push({
        ok: false,
        label: "Canvas URL",
        detail: "Enter your school root, e.g. https://yourschool.instructure.com",
      });
      return NextResponse.json({
        success: false,
        report: { summary: "Missing Canvas site URL.", steps },
      });
    }

    const normalized = normalizeCanvasBaseUrl(baseUrl);
    steps.push({ ok: true, label: "Canvas URL", detail: normalized });

    if (!token) {
      steps.push({
        ok: false,
        label: "Access token",
        detail: "Paste a Canvas personal access token, or use Connect Canvas with OAuth.",
      });
      return NextResponse.json({
        success: false,
        report: { summary: "Missing Canvas token.", steps },
      });
    }

    steps.push({ ok: true, label: "Access token", detail: "Present (not shown)." });

    try {
      const courses = await fetchCanvasCourses(normalized, token);
      const withSyllabus = courses.filter((course) => course.syllabus_body?.trim()).length;
      steps.push({
        ok: true,
        label: "Canvas API",
        detail: `${courses.length} active course${courses.length === 1 ? "" : "s"} found${
          withSyllabus > 0
            ? ` · ${withSyllabus} with syllabus text for cold-start topics`
            : " · module names will be used when syllabus is empty"
        }.`,
      });

      if (courses.length > 0) {
        const sample = courses.slice(0, 3).map((c) => c.course_code || c.name).join(", ");
        steps.push({
          ok: true,
          label: "Sample courses",
          detail: sample,
        });
      }

      return NextResponse.json({
        success: true,
        report: {
          summary:
            "Canvas API works from Study Haul. Save connection (auto-sync) or tap Sync now to import topics for Blurt / Lucky.",
          steps,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not reach Canvas.";
      steps.push({
        ok: false,
        label: "Canvas API",
        detail: message.includes("401")
          ? "Unauthorized — check the token scope (needs read courses) or generate a new token."
          : message.includes("404")
            ? "Not found — verify the Canvas URL is your school root, not a course page."
            : message,
      });

      return NextResponse.json({
        success: false,
        report: {
          summary: "Canvas API check failed.",
          steps,
        },
      });
    }
  } catch (error) {
    console.error("Canvas diagnose failed:", error);
    return NextResponse.json(
      { success: false, error: "Canvas diagnose failed." },
      { status: 500 },
    );
  }
}
