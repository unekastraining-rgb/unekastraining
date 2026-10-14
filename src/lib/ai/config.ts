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

function providerHasKey(name: AIProviderName): boolean {
  switch (name) {
    case "gemini":
      return Boolean(process.env.GEMINI_API_KEY?.trim());
    case "groq":
      return Boolean(process.env.GROQ_API_KEY?.trim());
    case "openrouter":
      return Boolean(process.env.OPENROUTER_API_KEY?.trim());
    case "openai":
      return Boolean(process.env.OPENAI_API_KEY?.trim());
    default:
      return false;
  }
}

export function isAIProviderConfigured(name: AIProviderName): boolean {
  return providerHasKey(name);
}

/** Which free-tier keys are present — for Settings / diagnostics (never exposes secrets). */
export function getFreeAIProviderStatus(): {
  gemini: boolean;
  groq: boolean;
  openrouter: boolean;
  openai: boolean;
  activeChain: AIProviderName[];
} {
  return {
    gemini: providerHasKey("gemini"),
    groq: providerHasKey("groq"),
    openrouter: providerHasKey("openrouter"),
    openai: providerHasKey("openai"),
    activeChain: getAIProviderChain(),
  };
}

export type AIProviderChainOptions = {
  /** Product Pro toggle: append OpenAI after the free chain when its key exists. */
  includeOpenAIPro?: boolean;
};

/**
 * Free tier: Gemini → Groq → OpenRouter (ChatGPT-level quiz path without OpenAI).
 * OpenAI is optional Pro — via Settings `aiUseOpenAIPro`, AI_PROVIDER / AI_PROVIDER_CHAIN,
 * or as a last resort when no free keys are configured.
 *
 * Providers listed in AI_PROVIDER_CHAIN without API keys are skipped so quota on
 * Gemini can still fall through to Groq/OpenRouter when those keys exist.
 */
export function getAIProviderChain(
  options?: AIProviderChainOptions,
): AIProviderName[] {
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
    const keyed = parsed.filter(providerHasKey);
    if (keyed.length > 0) {
      return appendOpenAIPro(keyed, options?.includeOpenAIPro);
    }
  }

  if (process.env.AI_PROVIDER?.trim()) {
    const preferred = getAIProviderName();
    const freeConfigured = DEFAULT_FREE_AI_CHAIN.filter(providerHasKey);
    const rest = freeConfigured.filter((name) => name !== preferred);
    // Prefer the pinned provider first, then keep free-tier failover when other keys exist.
    if (rest.length > 0 || providerHasKey(preferred)) {
      const chain = [preferred, ...rest].filter(
        (name, index, all) => all.indexOf(name) === index && providerHasKey(name),
      );
      if (chain.length > 0) {
        return appendOpenAIPro(chain, options?.includeOpenAIPro);
      }
    }
    return appendOpenAIPro([preferred], options?.includeOpenAIPro);
  }

  const freeConfigured = DEFAULT_FREE_AI_CHAIN.filter(providerHasKey);
  if (freeConfigured.length > 0) {
    return appendOpenAIPro(freeConfigured, options?.includeOpenAIPro);
  }

  if (providerHasKey("openai")) return ["openai"];

  return DEFAULT_FREE_AI_CHAIN;
}

function appendOpenAIPro(
  chain: AIProviderName[],
  includeOpenAIPro?: boolean,
): AIProviderName[] {
  if (!includeOpenAIPro || !providerHasKey("openai")) return chain;
  if (chain.includes("openai")) return chain;
  return [...chain, "openai"];
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
}

export function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

export function getGroqModel(): string {
  return process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";
}

export function getOpenRouterModel(): string {
  // Prefer a strong free Gemini path on OpenRouter so failover stays ChatGPT-level
  // (openrouter/free can pick weak/random models).
  return process.env.OPENROUTER_MODEL?.trim() || "google/gemini-2.5-flash";
}

/** Vision-capable OpenRouter model for syllabus/photo OCR cold start. */
export function getOpenRouterVisionModel(): string {
  return (
    process.env.OPENROUTER_VISION_MODEL?.trim() ||
    process.env.OPENROUTER_MODEL?.trim() ||
    "google/gemini-2.5-flash"
  );
}
