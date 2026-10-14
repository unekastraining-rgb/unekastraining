/**
 * Smoke: print free-tier AI chain status (strategy #2 diagnostics).
 * Run: npm run check:ai-chain
 */
import "dotenv/config";

import { getFreeAIProviderStatus } from "../src/lib/ai/config";
import { listConfiguredAIProviders } from "../src/lib/ai";

function main() {
  const status = getFreeAIProviderStatus();
  console.log("configured:", listConfiguredAIProviders().join(", ") || "(none)");
  console.log("active chain:", status.activeChain.join(" → ") || "(none)");
  console.log(
    "keys:",
    `gemini=${status.gemini ? "yes" : "no"}`,
    `groq=${status.groq ? "yes" : "no"}`,
    `openrouter=${status.openrouter ? "yes" : "no"}`,
    `openai=${status.openai ? "yes" : "no"}`,
  );

  if (status.gemini && !status.groq && !status.openrouter) {
    console.warn(
      "WARN: only Gemini keyed — add GROQ_API_KEY or OPENROUTER_API_KEY for quota failover.",
    );
  }

  if (status.openai && !status.groq && !status.openrouter) {
    console.log(
      "note: OPENAI_API_KEY is Pro-tier optional; free chain is Gemini → Groq → OpenRouter.",
    );
  }

  if (status.activeChain.length === 0) {
    console.error("FAIL: no free-tier AI keys configured");
    process.exit(1);
  }
}

main();
