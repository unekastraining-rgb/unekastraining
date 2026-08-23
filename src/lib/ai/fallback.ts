import {
  AIProviderChainExhaustedError,
  getAIErrorMessage,
  shouldTryNextProvider,
} from "./errors";
import type {
  AICompletionOptions,
  AICompletionResult,
  AIMessage,
  AIServiceProvider,
} from "./types";

export class FallbackAIService implements AIServiceProvider {
  readonly name = "fallback";

  constructor(private readonly providers: AIServiceProvider[]) {
    if (providers.length === 0) {
      throw new AIProviderChainExhaustedError([]);
    }
  }

  async complete(
    messages: AIMessage[],
    options?: AICompletionOptions,
  ): Promise<AICompletionResult> {
    const failures: Array<{ provider: string; message: string }> = [];

    for (let index = 0; index < this.providers.length; index += 1) {
      const provider = this.providers[index]!;
      try {
        const result = await provider.complete(messages, options);
        return {
          ...result,
          provider: result.provider ?? provider.name,
        };
      } catch (error) {
        const message = getAIErrorMessage(error);
        failures.push({ provider: provider.name, message });
        const hasNext = index < this.providers.length - 1;

        if (!hasNext || !shouldTryNextProvider(error)) {
          if (hasNext && !shouldTryNextProvider(error)) {
            throw error instanceof Error ? error : new Error(message);
          }
          break;
        }

        console.warn(
          `[ai] ${provider.name} unavailable (${message}). Trying ${this.providers[index + 1]!.name}…`,
        );
      }
    }

    throw new AIProviderChainExhaustedError(failures);
  }
}
