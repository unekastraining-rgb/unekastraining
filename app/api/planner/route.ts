import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Fetch assignments and syllabus tasks from your local SQLite database via your shared db instance
    const tasks = await db.assignment.findMany({
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    console.error("Failed to fetch planner tasks:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, course, dueDate, priority } = body;

    const newTask = await db.assignment.create({
      data: {
        title,
        course,
        dueDate: new Date(dueDate),
        priority: priority || "MEDIUM",
        completed: false,
      },
    });

    return NextResponse.json({ success: true, data: newTask }, { status: 201 });
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create task" },
      { status: 500 }
    );
  }
}