import { CorePageShell } from "./core-page-shell";

export const dynamic = "force-dynamic";

export default async function CorePage({
  searchParams,
}: {
  searchParams: Promise<{ noteId?: string }>;
}) {
  const params = await searchParams;
  return <CorePageShell noteId={params.noteId?.trim() || undefined} />;
}
