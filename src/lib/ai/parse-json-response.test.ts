import { describe, expect, it } from "vitest";

import { friendlyUserFacingAiError, parseAiJson, repairTruncatedJson } from "@/lib/ai/parse-json-response";

describe("parseAiJson", () => {
  it("parses fenced JSON", () => {
    const value = parseAiJson<{ ok: boolean }>('```json\n{"ok":true}\n```');
    expect(value.ok).toBe(true);
  });

  it("does not treat a Java listing as the error message", () => {
    const listing = `public class Welcome {
  public static void main(String[] args) {
    System.out.println("Welcome to Java!");
  }
}`;
    expect(() => parseAiJson(listing, "Could not build a quiz from this reading.")).toThrow(
      "Could not build a quiz from this reading.",
    );
    expect(friendlyUserFacingAiError(new Error(listing), "Could not finish that.")).toBe(
      "Could not finish that.",
    );
  });

  it("ignores ```java fences when looking for JSON", () => {
    const mixed = `\`\`\`java
public class Welcome { }
\`\`\`
\`\`\`json
{"ok":true}
\`\`\``;
    expect(parseAiJson<{ ok: boolean }>(mixed).ok).toBe(true);
  });

  it("repairs truncated strings", () => {
    const repaired = repairTruncatedJson('{"steps":[{"title":"Hello');
    const value = JSON.parse(repaired) as { steps: Array<{ title: string }> };
    expect(value.steps[0]?.title).toBe("Hello");
  });
});
