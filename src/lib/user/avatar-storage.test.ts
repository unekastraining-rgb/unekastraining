import { describe, expect, it } from "vitest";

import {
  accountAvatarUrl,
  encodeAvatarData,
  isStoredAvatarUrl,
} from "@/lib/user/avatar-storage";

describe("avatar-storage", () => {
  it("builds a stable account avatar URL", () => {
    expect(accountAvatarUrl("user_123")).toBe("/api/user/avatar/user_123");
    expect(accountAvatarUrl("user_123", 99)).toBe("/api/user/avatar/user_123?v=99");
  });

  it("detects Study Haul-hosted avatar URLs", () => {
    expect(isStoredAvatarUrl("/api/user/avatar/user_1")).toBe(true);
    expect(isStoredAvatarUrl("https://lh3.googleusercontent.com/a/x")).toBe(false);
  });

  it("rejects oversized avatar payloads", () => {
    expect(() => encodeAvatarData(Buffer.alloc(901_000))).toThrow(/too large/i);
    expect(encodeAvatarData(Buffer.from("tiny")).length).toBeGreaterThan(0);
  });
});
