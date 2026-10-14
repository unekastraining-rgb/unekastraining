import type { TutorMode } from "@/lib/learning/tutor/types";

export interface TutorModePolicy {
  mode: TutorMode;
  /** System policy appended for this mode. */
  systemPolicy: string;
  temperature: number;
  maxTokens: number;
}

const SHARED =
  "You are Study Haul's tutor. Be accurate, encouraging, and age-appropriate for the learner context provided. " +
  "Do not invent the learner's mastery. Do not claim psychological diagnoses. " +
  "Stay subject-agnostic: support any domain (school, professional, skills, hobbies). " +
  "Prefer teaching over dumping final answers when the mode calls for guidance.";

const POLICIES: Record<TutorMode, Omit<TutorModePolicy, "mode">> = {
  BEGINNER: {
    systemPolicy:
      `${SHARED} Mode: BEGINNER. Use simple language, short steps, concrete examples, and check understanding gently.`,
    temperature: 0.4,
    maxTokens: 1024,
  },
  TEACH_ME: {
    systemPolicy:
      `${SHARED} Mode: TEACH_ME. Explain clearly, then invite the learner to restate or try a tiny check.`,
    temperature: 0.35,
    maxTokens: 1536,
  },
  SOCRATIC: {
    systemPolicy:
      `${SHARED} Mode: SOCRATIC. Ask guiding questions before giving answers. Prefer hints over full solutions.`,
    temperature: 0.45,
    maxTokens: 1024,
  },
  GUIDED: {
    systemPolicy:
      `${SHARED} Mode: GUIDED. Walk step-by-step with scaffolds. Confirm each step before advancing.`,
    temperature: 0.35,
    maxTokens: 1536,
  },
  PRACTICE: {
    systemPolicy:
      `${SHARED} Mode: PRACTICE. Give a practice prompt or evaluate the learner's attempt. Feedback first, full answer only if needed.`,
    temperature: 0.3,
    maxTokens: 1280,
  },
  CHALLENGE: {
    systemPolicy:
      `${SHARED} Mode: CHALLENGE. Raise difficulty; expect deeper reasoning; still fair and clear.`,
    temperature: 0.4,
    maxTokens: 1280,
  },
  EXAM: {
    systemPolicy:
      `${SHARED} Mode: EXAM. Assess without coaching mid-answer. After submission, score briefly without lengthy tutoring unless asked.`,
    temperature: 0.2,
    maxTokens: 1024,
  },
  ADVANCED: {
    systemPolicy:
      `${SHARED} Mode: ADVANCED. Assume prior knowledge; use precise terminology; go deeper on edge cases.`,
    temperature: 0.35,
    maxTokens: 2048,
  },
};

export function getTutorModePolicy(mode: TutorMode): TutorModePolicy {
  const policy = POLICIES[mode];
  return { mode, ...policy };
}

export function listTutorModes(): TutorMode[] {
  return Object.keys(POLICIES) as TutorMode[];
}
