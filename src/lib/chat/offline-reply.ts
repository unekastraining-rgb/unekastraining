interface OfflineChatContext {
  courses: Array<{ title: string; code: string | null; semester: string | null }>;
  upcomingAssignments: Array<{
    title: string;
    dueDate: Date | null;
    courseTitle: string;
  }>;
  materialExcerpt?: string;
}

function formatDate(value: Date | null) {
  if (!value) return "no date set";
  return value.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function buildOfflineChatReply(
  message: string,
  context: OfflineChatContext,
): string {
  const lower = message.toLowerCase();

  if (context.upcomingAssignments.length > 0 && /due|deadline|assignment|homework|exam|quiz/.test(lower)) {
    const lines = context.upcomingAssignments
      .slice(0, 8)
      .map(
        (assignment) =>
          `• ${assignment.title} (${assignment.courseTitle}) — due ${formatDate(assignment.dueDate)}`,
      );
    return `AI chat isn't configured, but here are your upcoming deadlines:\n\n${lines.join("\n")}\n\nOpen the planner or assignments tab to manage these.`;
  }

  if (context.courses.length > 0 && /class|course|schedule|semester/.test(lower)) {
    const lines = context.courses
      .slice(0, 10)
      .map((course) => `• ${course.title}${course.code ? ` (${course.code})` : ""}`);
    return `AI chat isn't configured. Your classes:\n\n${lines.join("\n")}\n\nUpload a syllabus or sync your LMS to keep assignments current.`;
  }

  if (context.materialExcerpt && /syllabus|reading|material/.test(lower)) {
    const excerpt = context.materialExcerpt.slice(0, 1200);
    return `AI chat isn't configured. Here's an excerpt from your course materials:\n\n${excerpt}${context.materialExcerpt.length > 1200 ? "\n\n…" : ""}`;
  }

  const courseCount = context.courses.length;
  const dueCount = context.upcomingAssignments.length;

  return [
    "AI chat isn't configured on this server, but Study Haul still works.",
    "You can upload syllabi, manage assignments, use the planner, flashcards, and Core notes without AI.",
    courseCount > 0
      ? `You have ${courseCount} class${courseCount === 1 ? "" : "es"} and ${dueCount} upcoming deadline${dueCount === 1 ? "" : "s"}.`
      : "Add a class from Courses to get started.",
    "Add a free API key (Gemini, Groq, or OpenRouter) in Settings when you want smarter replies.",
  ].join("\n\n");
}
