import { describe, expect, it } from "vitest";

import { parseAiJson, repairTruncatedJson } from "@/lib/ai/parse-json-response";

describe("parseAiJson", () => {
  it("parses fenced JSON", () => {
    const value = parseAiJson<{ ok: boolean }>('```json\n{"ok":true}\n```');
    expect(value.ok).toBe(true);
  });

  it("repairs truncated strings", () => {
    const repaired = repairTruncatedJson('{"steps":[{"title":"Hello');
    const value = JSON.parse(repaired) as { steps: Array<{ title: string }> };
    expect(value.steps[0]?.title).toBe("Hello");
  });
});
