"use client";

import { useState, useEffect } from "react";

interface TopicNode {
  id: string;
  name: string;
  proficiency: number;
  confidence: number;
  understanding: number;
  recall: number;
  application: number;
  reviewCount: number;
}

interface CourseModule {
  id: string;
  title: string;
  topics: TopicNode[];
}

export function MasteryTree({ courseId }: { courseId: string }) {
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMasteryTree() {
      try {
        const res = await fetch(`/api/mastery?courseId=${courseId}`);
        const data = await res.json();
        if (data.success) {
          setModules(data.data);
        }
      } catch (error) {
        console.error("Failed to load mastery telemetry tree:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMasteryTree();
  }, [courseId]);

  if (loading) {
    return (
      <div className="card-soft p-8 text-center text-xs text-stone-500 animate-pulse">
        Loading mastery tree...
      </div>
    );
  }

  return (
    <div className="card-soft space-y-6 p-6">
      <div className="border-b border-orange-100 pb-4">
        <h3 className="text-lg font-bold text-stone-900">Course mastery hierarchy</h3>
        <p className="mt-1 text-xs text-stone-500">
          Proficiency across topics in this course.
        </p>
      </div>

      <div className="space-y-6">
        {modules.length === 0 || modules.every((mod) => mod.topics.length === 0) ? (
          <p className="text-sm text-stone-500">
            No mastery data yet. Study with Lucky, quizzes, or flashcards to populate this tree.
          </p>
        ) : (
          modules.map((mod) => (
            <div key={mod.id} className="space-y-3 rounded-2xl border border-orange-100 bg-orange-50/30 p-4">
              <h4 className="text-sm font-bold text-teal-700">{mod.title}</h4>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {mod.topics.map((topic) => (
                  <div
                    key={topic.id}
                    className="space-y-2 rounded-xl border border-orange-100 bg-white p-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-800">{topic.name}</span>
                      <span className="font-bold text-teal-700">{topic.proficiency}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-orange-100">
                      <div
                        className={`h-full transition-all duration-500 ${
                          topic.proficiency > 75
                            ? "bg-emerald-500"
                            : topic.proficiency > 40
                              ? "bg-amber-500"
                              : "bg-orange-400"
                        }`}
                        style={{ width: `${topic.proficiency}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-stone-500">
                      <span>Reviews: {topic.reviewCount}</span>
                      <span>Confidence: {topic.confidence}%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 pt-1 text-[9px] text-stone-500">
                      <div>
                        <span>Understand</span>
                        <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-stone-100">
                          <div
                            className="h-full bg-sky-500"
                            style={{ width: `${topic.understanding}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <span>Recall</span>
                        <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-stone-100">
                          <div
                            className="h-full bg-violet-500"
                            style={{ width: `${topic.recall}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <span>Apply</span>
                        <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-stone-100">
                          <div
                            className="h-full bg-amber-500"
                            style={{ width: `${topic.application}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
