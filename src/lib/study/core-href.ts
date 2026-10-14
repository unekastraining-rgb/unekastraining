export function coreCourseHref(options: {
  courseId: string;
  materialId?: string | null;
  noteId?: string | null;
  autoSession?: boolean;
  /** When true, Core shows the material import wizard (AI vs raw + destination). */
  import?: boolean;
}): string {
  const params = new URLSearchParams();
  params.set("courseId", options.courseId);
  if (options.noteId) params.set("noteId", options.noteId);
  if (options.materialId) params.set("materialId", options.materialId);
  if (options.import) params.set("import", "1");
  if (options.autoSession) params.set("session", "20");
  return `/core?${params.toString()}`;
}
