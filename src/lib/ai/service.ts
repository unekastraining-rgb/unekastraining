import { OpenAIProvider } from "./providers/openai";
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
      this.provider = new OpenAIProvider();
    }

    return this.provider;
  }
}

export const aiService = new AIService();
