import { describe, expect, it, vi, afterEach } from "vitest";

import { logOpsEvent } from "./safe-log";

describe("logOpsEvent", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("emits structured JSON with event name and safe meta", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    logOpsEvent("adaptive.failure", { status: 500, kind: "start_error" });
    expect(spy).toHaveBeenCalledOnce();
    const line = spy.mock.calls[0]?.[0];
    expect(typeof line).toBe("string");
    const parsed = JSON.parse(line as string) as Record<string, unknown>;
    expect(parsed.event).toBe("adaptive.failure");
    expect(parsed.status).toBe(500);
    expect(parsed.kind).toBe("start_error");
    expect(parsed.ts).toEqual(expect.any(String));
  });

  it("strips secret-like keys and truncates long strings", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    logOpsEvent("server.error", {
      password: "nope",
      sessionToken: "abc",
      api_key: "k",
      note: "x".repeat(200),
    });
    const parsed = JSON.parse(spy.mock.calls[0]?.[0] as string) as Record<
      string,
      unknown
    >;
    expect(parsed.password).toBeUndefined();
    expect(parsed.sessionToken).toBeUndefined();
    expect(parsed.api_key).toBeUndefined();
    expect(String(parsed.note).endsWith("…")).toBe(true);
    expect(String(parsed.note).length).toBeLessThanOrEqual(120);
  });
});
