#!/usr/bin/env node
/**
 * Live Blackboard connection test.
 *
 * Usage:
 *   BLACKBOARD_BASE_URL=https://your-school.blackboard.com \
 *   BLACKBOARD_ACCESS_TOKEN=your-token \
 *   npx tsx scripts/test-blackboard.ts
 */

import "dotenv/config";

import { diagnoseBlackboardConnection } from "../src/lib/lms/blackboard-diagnose";

async function main() {
  const baseUrl = process.env.BLACKBOARD_BASE_URL ?? process.env.LMS_BASE_URL ?? "";
  const accessToken =
    process.env.BLACKBOARD_ACCESS_TOKEN ?? process.env.LMS_ACCESS_TOKEN ?? "";

  if (!baseUrl || !accessToken) {
    console.error(
      "Set BLACKBOARD_BASE_URL and BLACKBOARD_ACCESS_TOKEN (or LMS_BASE_URL / LMS_ACCESS_TOKEN).",
    );
    process.exit(1);
  }

  const report = await diagnoseBlackboardConnection(baseUrl, accessToken);
  for (const step of report.steps) {
    const mark = step.ok ? "OK" : "FAIL";
    console.log(`[${mark}] ${step.label}${step.detail ? ` — ${step.detail}` : ""}`);
  }
  console.log("");
  console.log(report.summary);
  process.exit(report.ok ? 0 : 1);
}

void main();
