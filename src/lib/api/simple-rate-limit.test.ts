/**
 * 2P-51 — Simple rate limit unit tests.
 */
import { describe, expect, it, beforeEach } from "vitest";

import {
  checkSimpleRateLimit,
  clientIpFromRequest,
  resetSimpleRateLimitBuckets,
  loginRateLimitTruthSummary,
} from "@/lib/api/simple-rate-limit";

describe("2P-51 simple rate limit", () => {
  beforeEach(() => {
    resetSimpleRateLimitBuckets();
  });

  it("allows under the limit and blocks after", () => {
    const now = 1_000_000;
    expect(
      checkSimpleRateLimit({ key: "k", limit: 2, windowMs: 60_000, now }).allowed,
    ).toBe(true);
    expect(
      checkSimpleRateLimit({ key: "k", limit: 2, windowMs: 60_000, now }).allowed,
    ).toBe(true);
    const blocked = checkSimpleRateLimit({
      key: "k",
      limit: 2,
      windowMs: 60_000,
      now,
    });
    expect(blocked.allowed).toBe(false);
    if (!blocked.allowed) {
      expect(blocked.retryAfterMs).toBeGreaterThan(0);
    }
  });

  it("resets after window", () => {
    checkSimpleRateLimit({ key: "w", limit: 1, windowMs: 100, now: 0 });
    expect(
      checkSimpleRateLimit({ key: "w", limit: 1, windowMs: 100, now: 0 }).allowed,
    ).toBe(false);
    expect(
      checkSimpleRateLimit({ key: "w", limit: 1, windowMs: 100, now: 101 })
        .allowed,
    ).toBe(true);
  });

  it("reads client IP from forwarded headers", () => {
    const req = new Request("http://localhost/api/auth/login", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(clientIpFromRequest(req)).toBe("1.2.3.4");
    expect(loginRateLimitTruthSummary().loginGuarded).toBe(true);
    expect(loginRateLimitTruthSummary().inventsDistributedRateLimiter).toBe(
      false,
    );
  });
});
