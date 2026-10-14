import { logOpsEvent } from "@/lib/ops/safe-log";

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
    const skip = new Set(
      (options?.skipProviders ?? []).map((name) => name.toLowerCase()),
    );

    for (let index = 0; index < this.providers.length; index += 1) {
      const provider = this.providers[index]!;
      if (skip.has(provider.name.toLowerCase())) {
        failures.push({
          provider: provider.name,
          message: "skipped for quality retry",
        });
        continue;
      }
      try {
        const result = await provider.complete(messages, options);
        return {
          ...result,
          provider: result.provider ?? provider.name,
        };
      } catch (error) {
        const message = getAIErrorMessage(error);
        failures.push({ provider: provider.name, message });
        const hasNext = this.providers
          .slice(index + 1)
          .some((item) => !skip.has(item.name.toLowerCase()));

        if (!hasNext || !shouldTryNextProvider(error)) {
          if (hasNext && !shouldTryNextProvider(error)) {
            throw error instanceof Error ? error : new Error(message);
          }
          break;
        }

        const next = this.providers
          .slice(index + 1)
          .find((item) => !skip.has(item.name.toLowerCase()));
        console.warn(
          `[ai] ${provider.name} unavailable (${message}). Trying ${next?.name ?? "next"}…`,
        );
      }
    }

    logOpsEvent("ai.provider.failure", {
      providersTried: failures.length,
    });
    throw new AIProviderChainExhaustedError(failures);
  }
}
