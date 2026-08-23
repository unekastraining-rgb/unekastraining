export type SubjectKind = "reading" | "math" | "science" | "writing" | "general";

export type LessonWidget =
  | {
      type: "reading";
      passage: string;
      question: string;
      highlightPhrase?: string | null;
    }
  | {
      type: "math";
      problem: string;
      answer: string;
      unit?: string | null;
      steps?: string[] | null;
    }
  | {
      type: "science";
      scenario: string;
      question: string;
      choices: string[];
      correctIndex: number;
      explanation?: string | null;
    }
  | {
      type: "writing";
      prompt: string;
      wordBank?: string[] | null;
      sampleAnswer?: string | null;
    }
  | {
      type: "reflect";
      prompt: string;
    };

const SUBJECT_PATTERNS: Array<{ kind: SubjectKind; pattern: RegExp }> = [
  { kind: "reading", pattern: /read|ela|literacy|phonics|comprehension|vocab/i },
  { kind: "math", pattern: /math|algebra|geometry|fraction|number|multiply|divide/i },
  { kind: "science", pattern: /science|biology|chem|physics|earth|space|experiment/i },
  { kind: "writing", pattern: /writ|grammar|essay|spell|language arts/i },
];

export function detectSubjectKind(subject: string | null | undefined): SubjectKind {
  if (!subject?.trim()) return "general";
  for (const { kind, pattern } of SUBJECT_PATTERNS) {
    if (pattern.test(subject)) return kind;
  }
  return "general";
}

export function subjectLabel(kind: SubjectKind): string {
  switch (kind) {
    case "reading":
      return "Reading";
    case "math":
      return "Math";
    case "science":
      return "Science";
    case "writing":
      return "Writing";
    default:
      return "General";
  }
}

export function subjectEmoji(kind: SubjectKind): string {
  switch (kind) {
    case "reading":
      return "📖";
    case "math":
      return "🔢";
    case "science":
      return "🔬";
    case "writing":
      return "✍️";
    default:
      return "🌟";
  }
}
