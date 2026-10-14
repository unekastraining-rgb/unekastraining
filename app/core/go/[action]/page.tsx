import { redirect } from "next/navigation";

import { isCoreGoAction } from "@/lib/core/core-go-actions";
import { CorePageShell } from "../../core-page-shell";

export const dynamic = "force-dynamic";

/**
 * Shelf-identical activation: a real pathname change.
 * Safari/iPad will follow plain <a href="/core/go/tools"> even when
 * Next client handlers are dead from hydration issues.
 */
export default async function CoreGoActionPage({
  params,
}: {
  params: Promise<{ action: string }>;
}) {
  const { action } = await params;
  if (!isCoreGoAction(action)) {
    redirect("/core");
  }
  return <CorePageShell launchAction={action} />;
}
