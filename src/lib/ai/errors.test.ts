import { describe, expect, it } from "vitest";

import {
  AIProviderChainExhaustedError,
  isLikelyTransientCapacityError,
  shouldTryNextProvider,
} from "@/lib/ai/errors";

describe("shouldTryNextProvider", () => {
  it("failovers on Gemini high-demand / 503 errors", () => {
    expect(
      shouldTryNextProvider(
        new Error(
          "[GoogleGenerativeAI Error]: [503 Service Unavailable] This model is currently experiencing high demand.",
        ),
      ),
    ).toBe(true);
  });

  it("failovers on quota and rate limits", () => {
    expect(shouldTryNextProvider(new Error("You exceeded your current quota"))).toBe(true);
    expect(shouldTryNextProvider(new Error("rate_limit exceeded"))).toBe(true);
  });

  it("does not failover on invalid prompt configuration", () => {
    expect(
      shouldTryNextProvider(new Error("At least one non-system message is required")),
    ).toBe(false);
  });

  it("detects transient capacity errors for audit soft-skip", () => {
    expect(
      isLikelyTransientCapacityError(
        new Error("[503 Service Unavailable] This model is currently experiencing high demand."),
      ),
    ).toBe(true);
    expect(
      isLikelyTransientCapacityError(
        new Error("Gemini free tier quota exceeded. Add GROQ_API_KEY for failover."),
      ),
    ).toBe(true);
    expect(isLikelyTransientCapacityError(new Error("invalid api key"))).toBe(false);
  });

  it("soft-skips audit when free chain exhausted on quota only", () => {
    expect(
      isLikelyTransientCapacityError(
        new AIProviderChainExhaustedError([
          { provider: "gemini", message: "Gemini free tier quota exceeded" },
        ]),
      ),
    ).toBe(true);
    expect(
      isLikelyTransientCapacityError(
        new AIProviderChainExhaustedError([
          { provider: "gemini", message: "At least one non-system message is required" },
        ]),
      ),
    ).toBe(false);
  });
});
