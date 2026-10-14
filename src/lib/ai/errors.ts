export function getAIErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Whether to try the next provider in a free-tier fallback chain. */
export function shouldTryNextProvider(error: unknown): boolean {
  const message = getAIErrorMessage(error);
  const lower = message.toLowerCase();

  if (lower.includes("at least one non-system message")) {
    return false;
  }

  if (
    lower.includes("quota") ||
    lower.includes("rate limit") ||
    lower.includes("rate_limit") ||
    lower.includes("too many requests") ||
    lower.includes("resource exhausted") ||
    lower.includes("resource_exhausted") ||
    lower.includes("exceeded your current quota") ||
    lower.includes("overloaded") ||
    lower.includes("capacity") ||
    lower.includes("429") ||
    lower.includes("500") ||
    lower.includes("502") ||
    lower.includes("503") ||
    lower.includes("504") ||
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("etimedout") ||
    lower.includes("econnreset") ||
    lower.includes("fetch failed") ||
    lower.includes("network") ||
    lower.includes("empty completion") ||
    lower.includes("returned an empty") ||
    lower.includes("could not extract text") ||
    lower.includes("unavailable")
  ) {
    return true;
  }

  if (
    lower.includes("api key") ||
    lower.includes("unauthorized") ||
    lower.includes("authentication") ||
    lower.includes("invalid key") ||
    lower.includes("401") ||
    lower.includes("403")
  ) {
    return true;
  }

  if (
    lower.includes("model unavailable") ||
    lower.includes("no longer available") ||
    (lower.includes("not found") && lower.includes("model"))
  ) {
    return true;
  }

  return false;
}

/** Likely temporary provider overload or quota — not a quality or config failure. */
export function isLikelyTransientCapacityError(error: unknown): boolean {
  if (error instanceof AIProviderChainExhaustedError) {
    return (
      error.failures.length > 0 &&
      error.failures.every((failure) => shouldTryNextProvider(new Error(failure.message)))
    );
  }

  const lower = getAIErrorMessage(error).toLowerCase();
  return (
    lower.includes("503") ||
    lower.includes("502") ||
    lower.includes("504") ||
    lower.includes("high demand") ||
    lower.includes("overloaded") ||
    lower.includes("temporarily unavailable") ||
    lower.includes("quota") ||
    lower.includes("rate limit") ||
    lower.includes("rate_limit") ||
    lower.includes("resource exhausted") ||
    lower.includes("resource_exhausted") ||
    lower.includes("too many requests") ||
    (lower.includes("unavailable") && lower.includes("model"))
  );
}

export class AIProviderChainExhaustedError extends Error {
  readonly failures: Array<{ provider: string; message: string }>;

  constructor(failures: Array<{ provider: string; message: string }>) {
    const summary = failures.map((item) => `${item.provider}: ${item.message}`).join("; ");
    super(
      failures.length === 0
        ? "No AI providers are configured. Add GEMINI_API_KEY, then GROQ_API_KEY and/or OPENROUTER_API_KEY for free-tier failover (ChatGPT-level path without OpenAI)."
        : `All free AI providers are unavailable. ${summary}. Add GROQ_API_KEY / OPENROUTER_API_KEY so Gemini quota can fail over.`,
    );
    this.name = "AIProviderChainExhaustedError";
    this.failures = failures;
  }
}
