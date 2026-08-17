"use client";

import { useState, useEffect } from "react";

interface TopicNode {
  id: string;
  name: string;
  proficiency: number;
  confidence: number;
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
      <div className="p-8 bg-zinc-950 border border-zinc-800 rounded-xl text-center text-zinc-500 text-xs animate-pulse">
        Compiling mastery tree telemetry...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-zinc-950 border border-zinc-800 rounded-xl p-6 text-zinc-100 shadow-xl space-y-6">
      <div className="border-b border-zinc-800 pb-4">
        <h3 className="font-semibold text-lg tracking-wide">Course Mastery Hierarchy</h3>
        <p className="text-xs text-zinc-400 mt-1">Real-time proficiency tracking across curriculum nodes.</p>
      </div>

      <div className="space-y-6">
        {modules.map((mod) => (
          <div key={mod.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-indigo-400">{mod.title}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mod.topics.map((topic) => (
                <div key={topic.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex flex-col justify-between space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-zinc-200">{topic.name}</span>
                    <span className="text-zinc-400 font-mono">{topic.proficiency}%</span>
                  </div>
                  <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-800">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        topic.proficiency > 75 ? "bg-emerald-500" : topic.proficiency > 40 ? "bg-amber-500" : "bg-indigo-500"
                      }`}
                      style={{ width: `${topic.proficiency}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>Reviews: {topic.reviewCount}</span>
                    <span>Confidence: {topic.confidence}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}