"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { isMetaSyllabusTopic } from "@/lib/csl/six-worked-lesson";
import { subscribeLmsSynced } from "@/lib/lms/sync-events";

export interface CourseTopicOption {
  id: string;
  name: string;
}

function normalizeTopics(
  topics: Array<{ id: string; name: string }> | undefined,
): CourseTopicOption[] {
  return (topics ?? [])
    .filter((topic) => topic.name.trim() && !isMetaSyllabusTopic(topic.name))
    .map((topic) => ({ id: topic.id, name: topic.name }));
}

/**
 * Loads course topics on the client (same session as web) for Study / Six / Blurt on iPad & phone.
 */
export function useCourseTopics(
  courseId: string,
  initialTopics: CourseTopicOption[] = [],
) {
  const seedRef = useRef(initialTopics);
  // eslint-disable-next-line react-hooks/refs -- latest seed for refresh without stale closure
  seedRef.current = initialTopics;

  const [topics, setTopics] = useState<CourseTopicOption[]>(() =>
    courseId && initialTopics.length > 0 ? initialTopics : [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!courseId) {
      setTopics([]);
      return;
    }

    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12_000);

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        credentials: "same-origin",
        signal: controller.signal,
      });
      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        course?: { topics?: Array<{ id: string; name: string }> };
      };
      if (!data.success) {
        throw new Error(data.error ?? "Could not load topics.");
      }
      setTopics(normalizeTopics(data.course?.topics));
    } catch (err) {
      if (controller.signal.aborted) {
        setError("Topics took too long to load. Try again.");
      } else {
        setError(err instanceof Error ? err.message : "Could not load topics.");
      }
      if (seedRef.current.length > 0) setTopics(seedRef.current);
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (!courseId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
      setTopics([]);
      setError(null);
      return;
    }
    if (seedRef.current.length > 0) setTopics(seedRef.current);
    void refresh();
  }, [courseId, refresh]);

  useEffect(() => {
    if (!courseId) return;
    return subscribeLmsSynced(() => {
      void refresh();
    });
  }, [courseId, refresh]);

  return { topics, loading, error, refresh };
}
