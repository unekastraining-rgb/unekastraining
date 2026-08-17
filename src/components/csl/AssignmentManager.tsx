"use client";

import React, { useState, useEffect } from "react";

interface Assignment {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  status: string;
  course?: { name: string; code?: string };
}

interface Course {
  id: string;
  name: string;
}

export default function AssignmentManager() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [courseId, setCourseId] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [asnRes, courseRes] = await Promise.all([
        fetch("/api/assignments"),
        fetch("/api/courses"),
      ]);

      const asnJson = await asnRes.json();
      const courseJson = await courseRes.json();

      if (asnJson.success) setAssignments(asnJson.assignments);
      if (courseJson.success) {
        setCourses(courseJson.courses);
        if (courseJson.courses.length > 0) setCourseId(courseJson.courses[0].id);
      }
    } catch (err) {
      console.error("Failed to load assignment data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !courseId) return;

    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, dueDate, courseId }),
      });

      const json = await res.json();
      if (json.success) {
        setTitle("");
        setDescription("");
        setDueDate("");
        fetchData();
      }
    } catch (err) {
      console.error("Failed to create assignment:", err);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "SUBMITTED" ? "PENDING" : "SUBMITTED";
    try {
      await fetch("/api/assignments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId: id, status: nextStatus }),
      });
      fetchData();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  if (loading) {
    return (
      <div className="p-12 bg-zinc-950 border border-zinc-800 rounded-xl text-center text-zinc-500 text-xs animate-pulse font-mono">
        Loading assignments registry...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-zinc-100 font-mono">
      {/* Header */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-xl flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Assignment Tracker</h2>
          <p className="text-xs text-zinc-400 mt-1">Monitor deliverables, deadlines, and completion statuses.</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs text-rose-400">
          <span>{assignments.filter(a => a.status !== "SUBMITTED").length} Pending</span>
        </div>
      </div>

      {/* Create Form */}
      <form onSubmit={handleCreate} className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-xl space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-rose-400">Add New Assignment</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Assignment Title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-rose-500"
          />
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-rose-500"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-rose-500"
          />
          <button
            type="submit"
            className="bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-lg text-xs font-semibold transition-colors"
          >
            Add Assignment
          </button>
        </div>
      </form>

      {/* Assignment List */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-xl space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">All Deliverables</h3>
        {assignments.length === 0 ? (
          <p className="text-xs text-zinc-500 italic py-6 text-center">No assignments found.</p>
        ) : (
          <div className="space-y-3">
            {assignments.map((asn) => (
              <div key={asn.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl gap-4">
                <div>
                  <span className="text-[10px] text-indigo-400 uppercase tracking-widest">{asn.course?.name || "Course"}</span>
                  <h4 className="text-sm font-bold text-zinc-200 mt-0.5">{asn.title}</h4>
                  <p className="text-[11px] text-zinc-400 mt-1">Due: {new Date(asn.dueDate).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${asn.status === "SUBMITTED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
                    {asn.status}
                  </span>
                  <button
                    onClick={() => handleToggleStatus(asn.id, asn.status)}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-lg transition-colors"
                  >
                    {asn.status === "SUBMITTED" ? "Mark Pending" : "Mark Submitted"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}