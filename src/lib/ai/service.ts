import { AIProviderChainExhaustedError } from "./errors";
import { getAIProviderChain } from "./config";
import { FallbackAIService } from "./fallback";
import { buildConfiguredAIProviders } from "./provider-factory";
import { GeminiProvider } from "./providers/gemini";
import type {
  AICompletionOptions,
  AICompletionResult,
  AIMessage,
  AIServiceProvider,
} from "./types";

export class AIService {
  private provider: AIServiceProvider | null;

  constructor(provider?: AIServiceProvider) {
    this.provider = provider ?? null;
  }

  getProviderName(): string {
    return this.getProvider().name;
  }

  setProvider(provider: AIServiceProvider): void {
    this.provider = provider;
  }

  async complete(
    messages: AIMessage[],
    options?: AICompletionOptions,
  ): Promise<AICompletionResult> {
    return this.getProvider().complete(messages, options);
  }

  private getProvider(): AIServiceProvider {
    if (!this.provider) {
      const chain = buildConfiguredAIProviders(getAIProviderChain());
      if (chain.length === 0) {
        throw new AIProviderChainExhaustedError([]);
      }
      this.provider =
        chain.length === 1 ? chain[0]! : new FallbackAIService(chain);
    }

    return this.provider;
  }
}

export const aiService = new AIService();

export function getVisionExtractor():
  | { provider: "gemini"; extract: GeminiProvider["completeWithImage"] }
  | { provider: "none" }
{
  const gemini = buildConfiguredAIProviders(["gemini"])[0];
  if (gemini instanceof GeminiProvider) {
    return {
      provider: "gemini",
      extract: gemini.completeWithImage.bind(gemini),
    };
  }

  return { provider: "none" };
}
