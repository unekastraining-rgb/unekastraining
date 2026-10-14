/**
 * Smoke: prove Gemini → Groq → OpenRouter failover without live API keys (strategy #2).
 * Run: npm run smoke:failover-mock
 */
import { FallbackAIService } from "../src/lib/ai/fallback";
import type {
  AICompletionResult,
  AIMessage,
  AIServiceProvider,
} from "../src/lib/ai/types";

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

async function main() {
  const service = new FallbackAIService([
    new MockProvider("gemini", () => {
      throw new Error("Gemini free tier quota exceeded");
    }),
    new MockProvider("groq", () => {
      throw new Error("429 rate_limit");
    }),
    new MockProvider("openrouter", () => ({
      content: '{"ok":true}',
      model: "mock-free",
      provider: "openrouter",
    })),
  ]);

  const result = await service.complete([{ role: "user", content: "ping" }]);

  if (result.provider !== "openrouter") {
    console.error(`FAIL: expected openrouter after gemini→groq exhaustion, got ${result.provider}`);
    process.exit(1);
  }

  console.log("✓ Mock failover smoke PASS");
  console.log("  chain: gemini (quota) → groq (rate limit) → openrouter");
  console.log("  provider:", result.provider);
}

main().catch((error) => {
  console.error("FAIL:", error instanceof Error ? error.message : error);
  process.exit(1);
});
