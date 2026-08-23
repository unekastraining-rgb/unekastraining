import path from "path";

/** Persistent data root (DB + uploads). Set to `/data` on Fly.io volume. */
export function getDataDir(): string {
  const configured = process.env.DATA_DIR?.trim();
  if (configured) return configured;
  return process.cwd();
}

export function uploadsDir(...segments: string[]): string {
  return path.join(getDataDir(), "uploads", ...segments);
}
