import { pickColdStartTopic } from "@/lib/study/cold-start-topic";
import { chapterSubtopicsFromText } from "@/lib/syllabus/enrich-course-from-syllabus";

export type ColdStartCourseEntry = {
  id: string;
  title: string;
  focusTopic: string | null;
};

/** Build Core→Six→Lucky entry after LMS/OCR/demo topic seeding. */
export function lmsColdStartCourseEntry(
  courseId: string,
  title: string,
  topicSource: string | Array<{ name: string } | string>,
): ColdStartCourseEntry {
  const topicNames = Array.isArray(topicSource)
    ? topicSource.map((item) => (typeof item === "string" ? item : item.name))
    : chapterSubtopicsFromText(topicSource).map((topic) => topic.name);

  return {
    id: courseId,
    title,
    focusTopic: pickColdStartTopic(topicNames),
  };
}
