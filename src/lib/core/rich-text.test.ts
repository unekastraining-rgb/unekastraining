import { describe, expect, it } from "vitest";

import {
  htmlFromPlainText,
  plainTextFromHtml,
  resolveTextBoxHtml,
  sanitizeRichHtml,
} from "./rich-text";

describe("rich-text", () => {
  it("round-trips plain text through html helpers", () => {
    expect(htmlFromPlainText("Hello\nworld")).toContain("<br>");
    expect(plainTextFromHtml("<b>Hello</b>")).toBe("Hello");
  });

  it("prefers stored html for text boxes", () => {
    expect(
      resolveTextBoxHtml({ text: "plain", html: "<b>bold</b>" }),
    ).toBe("<b>bold</b>");
    expect(resolveTextBoxHtml({ text: "plain only" })).toContain("plain only");
  });

  it("strips dangerous tags while keeping formatting", () => {
    const cleaned = sanitizeRichHtml(
      '<b>ok</b><script>alert(1)</script><span style="color: red">hi</span>',
    );
    expect(cleaned).toContain("<b>ok</b>");
    expect(cleaned).toContain("color: red");
    expect(cleaned.toLowerCase()).not.toContain("script");
  });
});
