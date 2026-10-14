export interface StudyTopicSubtopic {
  name: string;
  description: string;
}

export interface StudyTopicProfile {
  kind: "study_topic";
  title: string;
  subject?: string | null;
  focus?: string | null;
  summary: string;
  subtopics: StudyTopicSubtopic[];
  suggestedTechniques: string[];
  createdAt: string;
}

export function isStudyTopicProfile(value: unknown): value is StudyTopicProfile {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as StudyTopicProfile).kind === "study_topic"
  );
}

/**
 * True when text is (or embeds) Learn Something New StudyTopicProfile JSON.
 * That profile is organizational planning metadata — not instructional course material.
 */
export function looksLikeStudyTopicProfileSource(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (/"kind"\s*:\s*"study_topic"/.test(t)) return true;
  try {
    const parsed: unknown = JSON.parse(t);
    return isStudyTopicProfile(parsed);
  } catch {
    return false;
  }
}
