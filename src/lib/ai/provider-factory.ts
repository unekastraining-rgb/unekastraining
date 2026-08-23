import type { AIProviderName } from "./config";
import { GeminiProvider } from "./providers/gemini";
import { GroqProvider, tryCreateGroqProvider } from "./providers/groq";
import {
  OpenRouterProvider,
  tryCreateOpenRouterProvider,
} from "./providers/openrouter";
import { OpenAIProvider } from "./providers/openai";
import type { AIServiceProvider } from "./types";

export function tryCreateGeminiProvider(): GeminiProvider | null {
  try {
    return new GeminiProvider();
  } catch {
    return null;
  }
}

export function tryCreateOpenAIProvider(): OpenAIProvider | null {
  try {
    return new OpenAIProvider();
  } catch {
    return null;
  }
}

export function createAIProvider(name: AIProviderName): AIServiceProvider | null {
  switch (name) {
    case "gemini":
      return tryCreateGeminiProvider();
    case "groq":
      return tryCreateGroqProvider();
    case "openrouter":
      return tryCreateOpenRouterProvider();
    case "openai":
      return tryCreateOpenAIProvider();
    default:
      return null;
  }
}

export function buildConfiguredAIProviders(
  chain: AIProviderName[],
): AIServiceProvider[] {
  const providers: AIServiceProvider[] = [];
  const seen = new Set<string>();

  for (const name of chain) {
    if (seen.has(name)) continue;
    seen.add(name);

    const provider = createAIProvider(name);
    if (provider) providers.push(provider);
  }

  return providers;
}
