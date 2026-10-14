import { isMetaSyllabusTopic } from "@/lib/csl/six-worked-lesson";

/**
 * First syllabus/LMS topic suitable for Six / Blurt / Lucky cold start
 * (skips admin headings like “Instructor & Course Information”).
 */
export function pickColdStartTopic(
  topics: ReadonlyArray<{ name: string } | string>,
): string | null {
  for (const item of topics) {
    const name = (typeof item === "string" ? item : item.name).trim();
    if (name && !isMetaSyllabusTopic(name)) return name;
  }
  return null;
}
