import { AIProviderChainExhaustedError } from "./errors";
import { getAIProviderChain, getOpenRouterVisionModel } from "./config";
import { FallbackAIService } from "./fallback";
import { buildConfiguredAIProviders } from "./provider-factory";
import { GeminiProvider } from "./providers/gemini";
import { OpenAICompatibleProvider } from "./providers/openai-compatible";
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
    return this.resolveProvider().name;
  }

  setProvider(provider: AIServiceProvider): void {
    this.provider = provider;
  }

  async complete(
    messages: AIMessage[],
    options?: AICompletionOptions,
  ): Promise<AICompletionResult> {
    // Rebuild when Pro is requested so Settings toggles take effect without restart.
    if (options?.includeOpenAIPro != null || !this.provider) {
      return this.resolveProvider(options?.includeOpenAIPro).complete(
        messages,
        options,
      );
    }
    return this.provider.complete(messages, options);
  }

  private resolveProvider(includeOpenAIPro?: boolean): AIServiceProvider {
    const chain = buildConfiguredAIProviders(
      getAIProviderChain({ includeOpenAIPro }),
    );
    if (chain.length === 0) {
      throw new AIProviderChainExhaustedError([]);
    }
    const resolved =
      chain.length === 1 ? chain[0]! : new FallbackAIService(chain);
    if (includeOpenAIPro == null) {
      this.provider = resolved;
    }
    return resolved;
  }
}

export const aiService = new AIService();

type VisionExtract = (
  prompt: string,
  imageBase64: string,
  mimeType: string,
) => Promise<string>;

/**
 * Free-tier OCR chain: Gemini → OpenRouter vision → OpenAI (optional Pro).
 * Powers syllabus/photo cold start without pasted chapters.
 */
export function getVisionExtractor(options?: {
  includeOpenAIPro?: boolean;
}):
  | { provider: string; extract: VisionExtract }
  | { provider: "none" }
{
  const gemini = buildConfiguredAIProviders(["gemini"])[0];
  if (gemini instanceof GeminiProvider) {
    return {
      provider: "gemini",
      extract: gemini.completeWithImage.bind(gemini),
    };
  }

  const openrouter = buildConfiguredAIProviders(["openrouter"])[0];
  if (openrouter instanceof OpenAICompatibleProvider) {
    const visionModel = getOpenRouterVisionModel();
    return {
      provider: "openrouter",
      extract: (prompt, imageBase64, mimeType) =>
        openrouter.completeWithImage(prompt, imageBase64, mimeType, {
          model: visionModel,
        }),
    };
  }

  if (options?.includeOpenAIPro && process.env.OPENAI_API_KEY?.trim()) {
    try {
      const compatible = new OpenAICompatibleProvider({
        name: "openai",
        apiKey: process.env.OPENAI_API_KEY.trim(),
        baseURL: "https://api.openai.com/v1",
        defaultModel: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
      });
      return {
        provider: "openai",
        extract: (prompt, imageBase64, mimeType) =>
          compatible.completeWithImage(prompt, imageBase64, mimeType),
      };
    } catch {
      // fall through
    }
  }

  return { provider: "none" };
}
