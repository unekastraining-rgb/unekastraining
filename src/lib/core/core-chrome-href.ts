/**
 * Build a /core href by patching query keys. Used by Shelf-style <Link>s so
 * Safari gets a real navigation target (buttons stay dead on many iPads).
 */
export function buildCoreChromeHref(
  searchParams: URLSearchParams | { toString(): string; get(name: string): string | null },
  patch: Record<string, string | null>,
): string {
  const params = new URLSearchParams(searchParams.toString());
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === "") params.delete(key);
    else params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/core?${qs}` : "/core";
}
