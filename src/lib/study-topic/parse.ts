import type { StudyTopicProfile } from "./types";
import { isStudyTopicProfile } from "./types";

export function parseStudyTopicFromMaterial(
  extractedText: string | null | undefined,
): StudyTopicProfile | null {
  if (!extractedText?.trim()) return null;
  try {
    const parsed = JSON.parse(extractedText) as unknown;
    if (!isStudyTopicProfile(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}
