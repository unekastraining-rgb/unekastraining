/**
 * Smoke: verify free-tier AI failover when multiple keys are configured (strategy #2).
 * Run: npm run smoke:failover
 *
 * With only Gemini keyed, prints SKIP for live failover and exits 0.
 * With Groq and/or OpenRouter keyed, proves skip-first-provider routing works.
 */
import "dotenv/config";

import { aiService, isAIConfigured, listConfiguredAIProviders } from "../src/lib/ai";
import { getFreeAIProviderStatus } from "../src/lib/ai/config";

const MINI_MESSAGES = [
  {
    role: "user" as const,
    content: 'Reply with JSON only: {"ok":true}',
  },
];

async function main() {
  const status = getFreeAIProviderStatus();
  const freeChain = status.activeChain.filter((name) => name !== "openai");

  console.log("configured:", listConfiguredAIProviders().join(", ") || "(none)");
  console.log("free chain:", freeChain.join(" → ") || "(none)");

  if (!isAIConfigured()) {
    console.error("FAIL: no AI keys");
    process.exit(1);
  }

  if (freeChain.length < 2) {
    console.log(
      "SKIP: live failover needs 2+ free-tier keys (add GROQ_API_KEY or OPENROUTER_API_KEY to .env).",
    );
    process.exit(0);
  }

  const skip = freeChain[0]!;
  console.log(`probing failover: skip ${skip}, expect ${freeChain.slice(1).join(" or ")}…`);

  const result = await aiService.complete(MINI_MESSAGES, {
    temperature: 0,
    maxTokens: 64,
    jsonMode: true,
    includeOpenAIPro: false,
    skipProviders: [skip],
  });

  const used = (result.provider ?? "").toLowerCase();
  if (!used || used === skip) {
    console.error(`FAIL: expected failover from ${skip}, got ${used || "(unknown)"}`);
    process.exit(1);
  }

  if (!freeChain.slice(1).includes(used as (typeof freeChain)[number])) {
    console.error(`FAIL: provider ${used} is not in expected failover chain`);
    process.exit(1);
  }

  console.log("PASS: failover smoke", `${skip} → ${used}`);
}

main().catch((error) => {
  console.error("FAIL:", error instanceof Error ? error.message : error);
  process.exit(1);
});
