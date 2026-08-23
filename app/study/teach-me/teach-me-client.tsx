"use client";

import { useSearchParams } from "next/navigation";

import { GuidedStudyActivity } from "@/components/study/GuidedStudyActivity";

export function TeachMeClient({
  courses,
}: {
  courses: Array<{ id: string; title: string }>;
}) {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId") ?? undefined;
  const topic = searchParams.get("topic") ?? undefined;

  return (
    <GuidedStudyActivity
      mode="teach-me"
      title="Teach Me"
      subtitle="Explain the concept like you're teaching a friend. We'll check accuracy, completeness, and misconceptions."
      placeholder="Explain the concept in your own words..."
      initialCourses={courses}
      initialCourseId={courseId}
      initialTopic={topic}
    />
  );
}
