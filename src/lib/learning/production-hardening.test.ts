/**
 * 2P-34 — Focused production hardening unit coverage.
 * Ownership, idempotency helpers, session secret, HTTP error mapping.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockCourseFindFirst,
  mockMaterialFindFirst,
  mockTopicFindFirst,
  mockLearningAttemptFindMany,
} = vi.hoisted(() => ({
  mockCourseFindFirst: vi.fn(),
  mockMaterialFindFirst: vi.fn(),
  mockTopicFindFirst: vi.fn(),
  mockLearningAttemptFindMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    course: { findFirst: mockCourseFindFirst },
    courseMaterial: { findFirst: mockMaterialFindFirst },
    topic: { findFirst: mockTopicFindFirst },
    learningAttempt: { findMany: mockLearningAttemptFindMany },
  },
}));

import { UnauthorizedError } from "@/lib/user";
import {
  jsonErrorFromUnknown,
  unauthorizedJsonResponse,
} from "@/lib/api/http-errors";
import { resolveOwnedNoteLinks } from "@/lib/notes/owned-note-links";
import {
  normalizeIdempotencyKey,
  rememberIdempotentActivityCompletion,
  peekIdempotentActivityCompletion,
  findRecentIdempotentActivityCompletion,
} from "@/lib/learning/activities/activity-idempotency";
import { encodeSession, decodeSession } from "@/lib/auth/session-token";

describe("2P-34 owned note links", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("drops foreign course/material/topic IDs", async () => {
    mockCourseFindFirst.mockResolvedValue(null);
    mockMaterialFindFirst.mockResolvedValue(null);
    mockTopicFindFirst.mockResolvedValue(null);

    const links = await resolveOwnedNoteLinks("user-a", {
      courseId: "foreign-course",
      materialId: "foreign-material",
      topicId: "foreign-topic",
    });

    expect(links).toEqual({
      courseId: null,
      materialId: null,
      topicId: null,
    });
    expect(mockCourseFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "foreign-course", userId: "user-a" },
      }),
    );
  });

  it("keeps owned course + matching material", async () => {
    mockCourseFindFirst.mockResolvedValue({ id: "course-1" });
    mockMaterialFindFirst.mockResolvedValue({
      id: "mat-1",
      courseId: "course-1",
    });
    mockTopicFindFirst.mockResolvedValue(null);

    const links = await resolveOwnedNoteLinks("user-a", {
      courseId: "course-1",
      materialId: "mat-1",
    });

    expect(links.courseId).toBe("course-1");
    expect(links.materialId).toBe("mat-1");
  });

  it("drops material when it belongs to a different course than requested", async () => {
    mockCourseFindFirst.mockResolvedValue({ id: "course-1" });
    mockMaterialFindFirst.mockResolvedValue({
      id: "mat-2",
      courseId: "course-other",
    });

    const links = await resolveOwnedNoteLinks("user-a", {
      courseId: "course-1",
      materialId: "mat-2",
    });

    expect(links.courseId).toBe("course-1");
    expect(links.materialId).toBeNull();
  });
});

describe("2P-34 activity idempotency helpers", () => {
  it("normalizes valid keys and rejects short/malformed", () => {
    expect(normalizeIdempotencyKey("abcdefgh")).toBe("abcdefgh");
    expect(normalizeIdempotencyKey("  key-with.dots:ok_1  ")).toBe(
      "key-with.dots:ok_1",
    );
    expect(normalizeIdempotencyKey("short")).toBeNull();
    expect(normalizeIdempotencyKey("bad key spaces!!")).toBeNull();
    expect(normalizeIdempotencyKey(null)).toBeNull();
  });

  it("remembers and peeks in-process completions", () => {
    const completion = {
      learningAttemptId: "att-1",
      conceptId: "c1",
      outcome: "SUCCESS",
      score: 1,
    };
    rememberIdempotentActivityCompletion(
      "u1",
      "c1",
      "ch1",
      "idem-key-12345",
      completion,
    );
    expect(
      peekIdempotentActivityCompletion("u1", "c1", "ch1", "idem-key-12345"),
    ).toEqual(completion);
    expect(
      peekIdempotentActivityCompletion("u1", "c1", "ch1", "other-key-99999"),
    ).toBeNull();
  });

  it("findRecent falls back to LearningAttempt sourceRefJson", async () => {
    mockLearningAttemptFindMany.mockResolvedValue([
      {
        id: "att-db",
        conceptId: "c1",
        outcome: "PARTIAL",
        score: 0.5,
        sourceRefJson: JSON.stringify({
          idempotencyKey: "db-key-abcdef",
          activityId: "ch1",
        }),
      },
    ]);

    const hit = await findRecentIdempotentActivityCompletion({
      learnerId: "u1",
      conceptId: "c1",
      challengeId: "ch1",
      idempotencyKey: "db-key-abcdef",
    });

    expect(hit?.learningAttemptId).toBe("att-db");
    expect(hit?.outcome).toBe("PARTIAL");
  });
});

describe("2P-34 HTTP Unauthorized mapping", () => {
  it("maps UnauthorizedError to 401 JSON", async () => {
    const res = unauthorizedJsonResponse(new UnauthorizedError());
    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
    const body = await res!.json();
    expect(body).toEqual({ success: false, error: "Unauthorized." });
  });

  it("jsonErrorFromUnknown prefers 401 for UnauthorizedError", async () => {
    const res = jsonErrorFromUnknown(
      new UnauthorizedError(),
      "Failed to load notes.",
    );
    expect(res.status).toBe(401);
  });

  it("jsonErrorFromUnknown uses fallback for other errors", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = jsonErrorFromUnknown(new Error("boom"), "Failed to load notes.");
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to load notes.");
    errSpy.mockRestore();
  });
});

describe("2P-34 session secret production gate", () => {
  const originalSecret = process.env.SESSION_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = originalSecret;
    vi.unstubAllEnvs();
  });

  it("allows encode/decode in development with fallback secret", () => {
    vi.stubEnv("NODE_ENV", "development");
    delete process.env.SESSION_SECRET;
    const token = encodeSession({
      userId: "u1",
      exp: Date.now() + 60_000,
    });
    expect(decodeSession(token)?.userId).toBe("u1");
  });

  it("rejects insecure default SESSION_SECRET in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.SESSION_SECRET = "dev-insecure-session-secret-change-me";
    expect(() =>
      encodeSession({ userId: "u1", exp: Date.now() + 60_000 }),
    ).toThrow(/SESSION_SECRET/);
  });

  it("accepts a real SESSION_SECRET in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.SESSION_SECRET = "production-strong-secret-value-xyz";
    const token = encodeSession({
      userId: "u1",
      exp: Date.now() + 60_000,
    });
    expect(decodeSession(token)?.userId).toBe("u1");
  });
});
