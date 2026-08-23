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
    lower.includes("overloaded") ||
    lower.includes("capacity") ||
    lower.includes("429") ||
    lower.includes("503")
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

export class AIProviderChainExhaustedError extends Error {
  readonly failures: Array<{ provider: string; message: string }>;

  constructor(failures: Array<{ provider: string; message: string }>) {
    const summary = failures.map((item) => `${item.provider}: ${item.message}`).join("; ");
    super(
      failures.length === 0
        ? "No AI providers are configured. Add GEMINI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY."
        : `All free AI providers are unavailable. ${summary}`,
    );
    this.name = "AIProviderChainExhaustedError";
    this.failures = failures;
  }
}
