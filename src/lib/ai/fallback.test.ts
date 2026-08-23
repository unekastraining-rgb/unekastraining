import { describe, expect, it } from "vitest";

import {
  AIProviderChainExhaustedError,
  shouldTryNextProvider,
} from "@/lib/ai/errors";
import { FallbackAIService } from "@/lib/ai/fallback";
import { getAIProviderChain } from "@/lib/ai/config";
import type {
  AICompletionResult,
  AIMessage,
  AIServiceProvider,
} from "@/lib/ai/types";

class MockProvider implements AIServiceProvider {
  constructor(
    readonly name: string,
    private readonly handler: (
      messages: AIMessage[],
    ) => Promise<AICompletionResult> | AICompletionResult,
  ) {}

  complete(messages: AIMessage[]) {
    return Promise.resolve(this.handler(messages));
  }
}

describe("shouldTryNextProvider", () => {
  it("retries on quota and rate limits", () => {
    expect(shouldTryNextProvider(new Error("Gemini free tier quota exceeded"))).toBe(
      true,
    );
    expect(shouldTryNextProvider(new Error("429 Too Many Requests"))).toBe(true);
  });

  it("does not retry on invalid input", () => {
    expect(
      shouldTryNextProvider(new Error("At least one non-system message is required.")),
    ).toBe(false);
  });
});

describe("FallbackAIService", () => {
  it("falls back when the first provider is exhausted", async () => {
    const service = new FallbackAIService([
      new MockProvider("gemini", () => {
        throw new Error("quota exceeded");
      }),
      new MockProvider("groq", () => ({
        content: "ok",
        model: "llama",
        provider: "groq",
      })),
    ]);

    const result = await service.complete([{ role: "user", content: "hi" }]);
    expect(result.content).toBe("ok");
    expect(result.provider).toBe("groq");
  });

  it("throws when every provider fails", async () => {
    const service = new FallbackAIService([
      new MockProvider("gemini", () => {
        throw new Error("quota exceeded");
      }),
      new MockProvider("groq", () => {
        throw new Error("rate limit");
      }),
    ]);

    await expect(
      service.complete([{ role: "user", content: "hi" }]),
    ).rejects.toBeInstanceOf(AIProviderChainExhaustedError);
  });
});

describe("getAIProviderChain", () => {
  it("defaults to the free provider chain", () => {
    const original = process.env.AI_PROVIDER_CHAIN;
    const legacy = process.env.AI_PROVIDER;
    delete process.env.AI_PROVIDER_CHAIN;
    delete process.env.AI_PROVIDER;
    expect(getAIProviderChain()).toEqual(["gemini", "groq", "openrouter"]);
    process.env.AI_PROVIDER_CHAIN = original;
    process.env.AI_PROVIDER = legacy;
  });
});
