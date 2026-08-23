export function htmlToPlainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export async function fetchPluginFileText(
  token: string,
  fileUrl: string,
): Promise<string> {
  const url = new URL(fileUrl);
  if (!url.searchParams.has("token")) {
    url.searchParams.set("token", token);
  }

  const response = await fetch(url.toString(), {
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) return "";

  const text = await response.text();
  if (text.trimStart().startsWith("<")) {
    return htmlToPlainText(text);
  }
  return text.trim();
}

export function unixToIso(unix: number | null | undefined): string | undefined {
  if (!unix) return undefined;
  const date = new Date(unix * 1000);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

export function formatDisplayDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
