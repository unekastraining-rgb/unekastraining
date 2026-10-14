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
    expect(
      shouldTryNextProvider(
        new Error("You exceeded your current quota, please check your plan"),
      ),
    ).toBe(true);
    expect(shouldTryNextProvider(new Error("RESOURCE_EXHAUSTED"))).toBe(true);
  });

  it("retries on empty completions, timeouts, and 5xx", () => {
    expect(shouldTryNextProvider(new Error("Gemini returned an empty completion."))).toBe(
      true,
    );
    expect(shouldTryNextProvider(new Error("fetch failed: timeout"))).toBe(true);
    expect(shouldTryNextProvider(new Error("502 Bad Gateway"))).toBe(true);
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

  it("skips a weak provider on quality retry", async () => {
    const service = new FallbackAIService([
      new MockProvider("gemini", () => ({
        content: "weak",
        model: "gemini",
        provider: "gemini",
      })),
      new MockProvider("groq", () => ({
        content: "strong",
        model: "llama",
        provider: "groq",
      })),
    ]);

    const result = await service.complete([{ role: "user", content: "hi" }], {
      skipProviders: ["gemini"],
    });
    expect(result.content).toBe("strong");
    expect(result.provider).toBe("groq");
  });

  it("falls through gemini → groq → openrouter on successive failures", async () => {
    const service = new FallbackAIService([
      new MockProvider("gemini", () => {
        throw new Error("You exceeded your current quota");
      }),
      new MockProvider("groq", () => {
        throw new Error("rate_limit");
      }),
      new MockProvider("openrouter", () => ({
        content: "from openrouter",
        model: "free",
        provider: "openrouter",
      })),
    ]);

    const result = await service.complete([{ role: "user", content: "quiz me" }]);
    expect(result.content).toBe("from openrouter");
    expect(result.provider).toBe("openrouter");
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
    const gemini = process.env.GEMINI_API_KEY;
    const groq = process.env.GROQ_API_KEY;
    const openrouter = process.env.OPENROUTER_API_KEY;
    const openai = process.env.OPENAI_API_KEY;
    delete process.env.AI_PROVIDER_CHAIN;
    delete process.env.AI_PROVIDER;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.OPENAI_API_KEY;
    expect(getAIProviderChain()).toEqual(["gemini", "groq", "openrouter"]);
    process.env.AI_PROVIDER_CHAIN = original;
    process.env.AI_PROVIDER = legacy;
    process.env.GEMINI_API_KEY = gemini;
    process.env.GROQ_API_KEY = groq;
    process.env.OPENROUTER_API_KEY = openrouter;
    process.env.OPENAI_API_KEY = openai;
  });

  it("uses only configured free providers, with OpenAI as last-resort Pro", () => {
    const original = process.env.AI_PROVIDER_CHAIN;
    const legacy = process.env.AI_PROVIDER;
    const gemini = process.env.GEMINI_API_KEY;
    const groq = process.env.GROQ_API_KEY;
    const openrouter = process.env.OPENROUTER_API_KEY;
    const openai = process.env.OPENAI_API_KEY;
    delete process.env.AI_PROVIDER_CHAIN;
    delete process.env.AI_PROVIDER;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    process.env.OPENAI_API_KEY = "sk-test";
    expect(getAIProviderChain()).toEqual(["openai"]);
    process.env.GROQ_API_KEY = "gsk-test";
    expect(getAIProviderChain()).toEqual(["groq"]);
    expect(getAIProviderChain({ includeOpenAIPro: true })).toEqual([
      "groq",
      "openai",
    ]);
    process.env.AI_PROVIDER_CHAIN = original;
    process.env.AI_PROVIDER = legacy;
    process.env.GEMINI_API_KEY = gemini;
    process.env.GROQ_API_KEY = groq;
    process.env.OPENROUTER_API_KEY = openrouter;
    process.env.OPENAI_API_KEY = openai;
  });

  it("skips AI_PROVIDER_CHAIN entries that have no API key", () => {
    const original = process.env.AI_PROVIDER_CHAIN;
    const legacy = process.env.AI_PROVIDER;
    const gemini = process.env.GEMINI_API_KEY;
    const groq = process.env.GROQ_API_KEY;
    const openrouter = process.env.OPENROUTER_API_KEY;
    const openai = process.env.OPENAI_API_KEY;
    delete process.env.AI_PROVIDER;
    process.env.AI_PROVIDER_CHAIN = "gemini,groq,openrouter";
    process.env.GEMINI_API_KEY = "gem-test";
    delete process.env.GROQ_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.OPENAI_API_KEY;
    expect(getAIProviderChain()).toEqual(["gemini"]);
    process.env.GROQ_API_KEY = "gsk-test";
    expect(getAIProviderChain()).toEqual(["gemini", "groq"]);
    process.env.AI_PROVIDER_CHAIN = original;
    process.env.AI_PROVIDER = legacy;
    process.env.GEMINI_API_KEY = gemini;
    process.env.GROQ_API_KEY = groq;
    process.env.OPENROUTER_API_KEY = openrouter;
    process.env.OPENAI_API_KEY = openai;
  });
});
