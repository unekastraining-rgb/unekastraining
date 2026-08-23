import { db } from "@/lib/db";

export async function countQuizAttempts(userId: string): Promise<number> {
  if (!("quizAttempt" in db) || typeof db.quizAttempt?.count !== "function") {
    return 0;
  }

  return db.quizAttempt.count({ where: { userId } });
}
