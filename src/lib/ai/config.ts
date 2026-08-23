export type AIProviderName = "gemini" | "groq" | "openrouter" | "openai";

export const DEFAULT_FREE_AI_CHAIN: AIProviderName[] = [
  "gemini",
  "groq",
  "openrouter",
];

export function getAIProviderName(): AIProviderName {
  const configured = process.env.AI_PROVIDER?.toLowerCase();

  if (configured === "gemini") return "gemini";
  if (configured === "groq") return "groq";
  if (configured === "openrouter") return "openrouter";
  if (configured === "openai") return "openai";

  if (process.env.GEMINI_API_KEY?.trim()) return "gemini";
  if (process.env.GROQ_API_KEY?.trim()) return "groq";
  if (process.env.OPENROUTER_API_KEY?.trim()) return "openrouter";
  if (process.env.OPENAI_API_KEY?.trim()) return "openai";

  return "gemini";
}

export function getAIProviderChain(): AIProviderName[] {
  const raw = process.env.AI_PROVIDER_CHAIN?.trim();
  if (raw) {
    const parsed = raw
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(
        (entry): entry is AIProviderName =>
          entry === "gemini" ||
          entry === "groq" ||
          entry === "openrouter" ||
          entry === "openai",
      );
    if (parsed.length > 0) return parsed;
  }

  if (process.env.AI_PROVIDER?.trim()) {
    return [getAIProviderName()];
  }

  return DEFAULT_FREE_AI_CHAIN;
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash";
}

export function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

export function getGroqModel(): string {
  return process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";
}

export function getOpenRouterModel(): string {
  return process.env.OPENROUTER_MODEL?.trim() || "openrouter/free";
}
