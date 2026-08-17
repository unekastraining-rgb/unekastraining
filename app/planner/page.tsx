"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Clock, BookOpen, CheckCircle2, AlertCircle, Plus } from "lucide-react";

interface Task {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  priority: string;
  completed: boolean;
}

export default function AcademicPlannerPage() {
  const [filter, setFilter] = useState("ALL");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newCourse, setNewCourse] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newPriority, setNewPriority] = useState("MEDIUM");

  // Fetch tasks from the Prisma backend API on mount
  useEffect(() => {
    fetch("/api/planner")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTasks(data.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load planner tasks:", err);
        setLoading(false);
      });
  }, []);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newCourse || !newDate) return;

    try {
      const res = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          course: newCourse,
          dueDate: newDate,
          priority: newPriority,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTasks([...tasks, data.data]);
        setNewTitle("");
        setNewCourse("");
        setNewDate("");
        setNewPriority("MEDIUM");
      }
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === "PENDING") return !task.completed;
    if (filter === "COMPLETED") return task.completed;
    return true;
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Calendar className="w-8 h-8 text-indigo-400" />
              Academic Planner & Syllabus Pipeline
            </h1>
            <p className="text-slate-400 mt-1">CSL Ecosystem — Phase 3 Database Connected</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-950 text-indigo-300 border border-indigo-800">
              <Clock className="w-3.5 h-3.5 mr-1.5" /> Fall Semester Active
            </span>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Total Assignments</span>
              <BookOpen className="w-5 h-5 text-indigo-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">{tasks.length}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Completed</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">{tasks.filter(t => t.completed).length}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Pending Action</span>
              <AlertCircle className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">{tasks.filter(t => !t.completed).length}</p>
          </div>
        </div>

        {/* Add Task Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-400" /> Add New Coursework Item
          </h2>
          <form onSubmit={addTask} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <input 
              type="text" 
              placeholder="Assignment Title" 
              value={newTitle} 
              onChange={(e) => setNewTitle(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              required
            />
            <input 
              type="text" 
              placeholder="Course Code / Name" 
              value={newCourse} 
              onChange={(e) => setNewCourse(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              required
            />
            <input 
              type="date" 
              value={newDate} 
              onChange={(e) => setNewDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              required
            />
            <select 
              value={newPriority} 
              onChange={(e) => setNewPriority(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="LOW">Low Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="HIGH">High Priority</option>
            </select>
            <button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg px-4 py-2 text-sm transition shadow-sm flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </form>
        </div>

        {/* Task Control & Filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-semibold text-white">Coursework Feed</h2>
            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 text-sm">
              <button 
                onClick={() => setFilter("ALL")} 
                className={`px-3 py-1.5 rounded-md transition ${filter === "ALL" ? "bg-indigo-600 text-white font-medium" : "text-slate-400 hover:text-white"}`}
              >
                All
              </button>
              <button 
                onClick={() => setFilter("PENDING")} 
                className={`px-3 py-1.5 rounded-md transition ${filter === "PENDING" ? "bg-indigo-600 text-white font-medium" : "text-slate-400 hover:text-white"}`}
              >
                Pending
              </button>
              <button 
                onClick={() => setFilter("COMPLETED")} 
                className={`px-3 py-1.5 rounded-md transition ${filter === "COMPLETED" ? "bg-indigo-600 text-white font-medium" : "text-slate-400 hover:text-white"}`}
              >
                Completed
              </button>
            </div>
          </div>

          {/* Task Feed */}
          <div className="space-y-3">
            {loading ? (
              <p className="text-slate-500 text-center py-8">Loading tasks from database...</p>
            ) : filteredTasks.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No tasks found. Add one above to get started!</p>
            ) : (
              filteredTasks.map((task) => (
                <div 
                  key={task.id} 
                  className={`p-4 border rounded-xl flex items-center justify-between transition ${task.completed ? "bg-slate-950/40 border-slate-900 opacity-60" : "bg-slate-950 border-slate-800 hover:border-slate-700"}`}
                >
                  <div className="flex items-center gap-4">
                    <input 
                      type="checkbox" 
                      checked={task.completed} 
                      onChange={() => toggleTask(task.id)}
                      className="w-5 h-5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900 cursor-pointer"
                    />
                    <div>
                      <p className={`font-medium ${task.completed ? "line-through text-slate-500" : "text-white"}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-indigo-400 font-medium">{task.course}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-xs text-slate-400">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                    task.priority === "HIGH" 
                      ? "bg-rose-950/50 text-rose-300 border-rose-900" 
                      : "bg-amber-950/50 text-amber-300 border-amber-900"
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </main>
  );
}