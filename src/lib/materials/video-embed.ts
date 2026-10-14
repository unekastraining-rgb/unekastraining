/** Turn material URLs into playable embeds for watch-and-note split. */

export function toVideoEmbedUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const url = raw.trim();

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.replace(/^\//, "").split("/")[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtube-nocookie.com" ||
      host === "music.youtube.com"
    ) {
      const id =
        parsed.searchParams.get("v") ||
        parsed.pathname.match(/\/(?:embed|shorts|live|v)\/([^/?#]+)/)?.[1];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
    }

    if (/\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(parsed.pathname)) {
      return url;
    }
  } catch {
    // bare YouTube ids / relative paths
    if (/^[\w-]{11}$/.test(url)) {
      return `https://www.youtube.com/embed/${url}`;
    }
    return null;
  }

  return null;
}

export function isDirectVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url);
}

/** Uploaded lecture files that should play in <video>, not the PDF viewer. */
export function isVideoFilePath(path: string | null | undefined): boolean {
  if (!path?.trim()) return false;
  return /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(path.trim());
}

export function isVideoMaterial(material: {
  type?: string | null;
  url?: string | null;
  filePath?: string | null;
}): boolean {
  if (material.type?.toUpperCase() === "VIDEO") return true;
  if (isVideoFilePath(material.filePath)) return true;
  if (material.url && toVideoEmbedUrl(material.url)) return true;
  return false;
}
