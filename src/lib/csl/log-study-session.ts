export async function logStudySessionClient(input: {
  activityType: string;
  courseId?: string | null;
  durationSeconds?: number;
  cardsReviewed?: number;
  notesCreated?: number;
  startedAt?: string;
}) {
  try {
    await fetch("/api/study/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    // non-blocking
  }
}
