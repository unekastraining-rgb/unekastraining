/**
 * Lightweight structured ops logging for controlled beta.
 * Never logs secrets, tokens, passwords, or raw learner content.
 */

export type OpsEventName =
  | "auth.failure"
  | "activity.failure"
  | "adaptive.failure"
  | "core.save.conflict"
  | "ai.provider.failure"
  | "lms.sync.failure"
  | "server.error"
  | "beta.feedback.created"
  | "ops.health.check";

const FORBIDDEN_KEY =
  /(password|secret|token|authorization|cookie|apikey|api_key|credential|session)/i;

function sanitizeMeta(
  meta: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!meta) return undefined;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (FORBIDDEN_KEY.test(key)) continue;
    if (typeof value === "string") {
      out[key] = value.length > 120 ? `${value.slice(0, 117)}…` : value;
      continue;
    }
    if (
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      out[key] = value;
      continue;
    }
    if (Array.isArray(value)) {
      out[key] = `array:${value.length}`;
      continue;
    }
    out[key] = "object";
  }
  return out;
}

/** Structured one-line JSON log for operators (stdout). */
export function logOpsEvent(
  event: OpsEventName,
  meta?: Record<string, unknown>,
): void {
  const payload = {
    ts: new Date().toISOString(),
    event,
    ...sanitizeMeta(meta),
  };
  console.info(JSON.stringify(payload));
}
