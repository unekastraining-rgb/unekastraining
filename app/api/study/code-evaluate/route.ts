import { NextResponse } from "next/server";

import { StudyActivityType } from "@/generated/prisma";
import { aiService } from "@/lib/ai";
import { loadCourseSourceText } from "@/lib/ai/course-source";
import { createStudySession } from "@/lib/csl/study-sessions";
import { updateTopicMastery } from "@/lib/quizzes/mastery";
import {
  aiSourceInstruction,
  getUserAppSettings,
} from "@/lib/settings/app-settings";
import { getOrCreateDefaultTopic } from "@/lib/topics";
import { getOrCreateDefaultUser } from "@/lib/user";

const PROBLEMS: Record<string, { title: string; prompt: string; starter: string }> = {
  javascript: {
    title: "Two Sum (JavaScript)",
    prompt:
      "Write a function `twoSum(nums, target)` that returns indices of two numbers adding to target. Assume exactly one solution exists.",
    starter: "function twoSum(nums, target) {\n  // your code\n}\n",
  },
  python: {
    title: "Valid Parentheses (Python)",
    prompt:
      "Write `is_valid(s: str) -> bool` returning whether brackets (), {}, [] are properly closed and nested.",
    starter: "def is_valid(s: str) -> bool:\n    # your code\n    pass\n",
  },
  java: {
    title: "Reverse Linked List (Java)",
    prompt:
      "Sketch a method `reverseList(ListNode head)` that reverses a singly linked list and returns the new head.",
    starter: "class Solution {\n    public ListNode reverseList(ListNode head) {\n        // your code\n    }\n}\n",
  },
};

export async function GET() {
  return NextResponse.json({
    success: true,
    data: Object.entries(PROBLEMS).map(([language, problem]) => ({
      language,
      ...problem,
    })),
  });
}

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();
    const { courseId, language, code, problemTitle, problemPrompt, durationSeconds } = body;

    if (!code?.trim()) {
      return NextResponse.json(
        { success: false, error: "code is required." },
        { status: 400 },
      );
    }

    const appSettings = await getUserAppSettings(user.id);
    const source = courseId
      ? await loadCourseSourceText(user.id, courseId, 6000)
      : null;

    const problem =
      problemPrompt ||
      PROBLEMS[language as string]?.prompt ||
      "Solve the assigned practice problem.";

    const result = await aiService.complete(
      [
        {
          role: "system",
          content:
            "You grade CS practice submissions for a student learning platform. Respond JSON only. Focus on correctness, edge cases, complexity, and style.",
        },
        {
          role: "user",
          content: `Problem: ${problemTitle || "Practice problem"}
${problem}

${source ? `Course context (${source.courseTitle}):\n${source.text}` : ""}

Language: ${language || "unspecified"}
${aiSourceInstruction(appSettings.aiSourceMode)}

STUDENT CODE:
${code}

Return ONLY JSON:
{
  "score": 0-100,
  "summary": "one sentence",
  "correctness": "assessment",
  "edgeCases": ["..."],
  "improvements": ["..."],
  "complexity": "time/space notes"
}`,
        },
      ],
      { temperature: 0.2, maxTokens: 2048 },
    );

    const fenced = result.content.match(/```(?:json)?\s*([\s\S]*?)```/);
    const evaluation = JSON.parse((fenced?.[1] ?? result.content).trim()) as {
      score: number;
      summary: string;
      correctness: string;
      edgeCases: string[];
      improvements: string[];
      complexity: string;
    };

    if (courseId) {
      const topicId = (await getOrCreateDefaultTopic(courseId)).id;
      await updateTopicMastery(
        user.id,
        topicId,
        Math.min(1, Math.max(0, evaluation.score / 100)),
        "application",
      );
    }

    await createStudySession({
      userId: user.id,
      activityType: StudyActivityType.PRACTICE,
      courseId: courseId ?? null,
      durationSeconds: Math.max(120, Number(durationSeconds) || 600),
    });

    return NextResponse.json({ success: true, data: evaluation });
  } catch (error) {
    console.error("Failed to evaluate code:", error);
    const message =
      error instanceof Error ? error.message : "Failed to evaluate code.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
