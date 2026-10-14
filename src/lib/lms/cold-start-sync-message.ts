/** Appends cold-start seed summary so Canvas/Moodle sync confirms Blurt/Lucky readiness. */
export function formatColdStartSyncMessage(
  baseMessage: string,
  input: {
    syllabiImported: number;
    topicsCreated: number;
    courseTitles: string[];
  },
): string {
  const coldStartBits = [
    input.syllabiImported > 0
      ? `${input.syllabiImported} syllabus${input.syllabiImported === 1 ? "" : "es"}`
      : null,
    input.topicsCreated > 0
      ? `${input.topicsCreated} topic${input.topicsCreated === 1 ? "" : "s"} for Lucky cold start`
      : null,
  ].filter(Boolean);

  if (coldStartBits.length === 0) return baseMessage;

  const courseHint =
    input.courseTitles.length > 0
      ? ` (${input.courseTitles.slice(0, 4).join(", ")}${input.courseTitles.length > 4 ? "…" : ""})`
      : "";

  return `${baseMessage.replace(/\.$/, "")}; seeded ${coldStartBits.join(" and ")}${courseHint}. Open Blurt or Core → Study from topics.`;
}
