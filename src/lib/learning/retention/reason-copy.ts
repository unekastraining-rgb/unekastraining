/**
 * 2P-38 — Learner-friendly retention copy (no engine jargon).
 */

import type { RetentionReason } from "@/lib/learning/retention/types";

export function retentionReasonLabel(reason: RetentionReason): string {
  switch (reason) {
    case "RECENT_FAILURE":
      return "Let's revisit this one.";
    case "MISCONCEPTION":
      return "A little more practice here.";
    case "MISSED_QUESTION":
      return "This is something you've been practicing.";
    case "RETENTION_GAP":
    case "RECALL_GAP":
      return "Let's see what you remember.";
    case "ADAPTIVE_COMPLETION":
      return "From your recent practice.";
    case "WEAK_MASTERY":
      return "Let's see what you remember.";
    case "FLASHCARD_DUE":
      return "Time for a quick recall.";
    case "DUE_REVIEW":
      return "Let's see what you remember.";
    case "MANUAL_REVIEW":
      return "Review when you're ready.";
    default:
      return "Let's see what you remember.";
  }
}
