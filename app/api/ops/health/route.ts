import { NextResponse } from "next/server";

import { runHealthCheck } from "@/lib/ops/health";

/**
 * GET /api/ops/health — lightweight operator/load-balancer probe.
 * Never returns secrets or connection strings.
 */
export async function GET() {
  const report = await runHealthCheck();
  const status = report.status === "error" ? 503 : 200;
  return NextResponse.json(
    {
      success: report.ok,
      status: report.status,
      version: report.version,
      checks: report.checks,
      checkedAt: report.checkedAt,
    },
    { status },
  );
}
