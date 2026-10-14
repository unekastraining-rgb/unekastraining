import { pickColdStartTopic } from "@/lib/study/cold-start-topic";

/** URL topic param wins over syllabus/LMS cold-start pick. */
export function resolveLoopFocusTopic(
  urlTopic: string | null | undefined,
  topics: readonly string[] = [],
): string | null {
  const fromUrl = urlTopic?.trim();
  if (fromUrl) return fromUrl;
  return pickColdStartTopic(topics) || null;
}
