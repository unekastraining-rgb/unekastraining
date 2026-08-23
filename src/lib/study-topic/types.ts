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
