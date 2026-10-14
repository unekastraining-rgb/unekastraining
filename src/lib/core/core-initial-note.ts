/** Serializable note payload for SSR → CoreNotesWorkspace. */
export type CoreInitialNote = {
  id: string;
  title: string | null;
  method: string;
  contentJson: string | null;
  content: string;
  course: { id: string; title: string; color: string | null } | null;
  material: { id: string; title: string; type: string } | null;
};
