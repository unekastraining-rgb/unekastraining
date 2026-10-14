import { describe, expect, it } from "vitest";

import { packBalancedStudySource, splitStudySourceSections } from "@/lib/core/pack-study-source";

const chapter = [
  "1.1: Introduction",
  "Computers are programmed. A program is a set of instructions. ".repeat(40),
  "1.2: Hardware and Software",
  "Hardware is physical devices. CPU RAM storage input output. ".repeat(40),
  "1.3: How Computers Store Data",
  "Bits bytes binary ASCII Unicode two's complement floating point pixels. ".repeat(50),
  "1.4: How a Program Works",
  "Fetch decode execute assembly compiler interpreter. ".repeat(40),
  "1.5: Using Python",
  "Install Python. Interactive mode print Hello world. Script mode IDLE. ".repeat(45),
].join("\n");

describe("packBalancedStudySource", () => {
  it("keeps later sections instead of only the opening", () => {
    const packed = packBalancedStudySource(chapter, 3500);
    expect(packed.truncated).toBe(true);
    expect(packed.text).toContain("1.1:");
    expect(packed.text).toContain("1.5:");
    expect(packed.text.toLowerCase()).toContain("idle");
    expect(packed.sections.map((section) => section.heading)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("1.1"),
        expect.stringContaining("1.5"),
      ]),
    );
  });

  it("does not drop the middle when the front is long", () => {
    const packed = packBalancedStudySource(chapter, 4000);
    expect(packed.text.toLowerCase()).toContain("unicode");
    expect(packed.text.toLowerCase()).toContain("fetch");
  });

  it("keeps later numbered headings that have no colon", () => {
    const uncoloned = [
      "1.1 Introduction",
      "A program is a set of instructions. ".repeat(40),
      "1.4 How a Program Works",
      "Fetch decode execute cycle. ".repeat(40),
      "1.5 Using Python",
      "Interactive mode print Hello world. Script mode IDLE. ".repeat(40),
    ].join("\n");
    const packed = packBalancedStudySource(uncoloned, 2800);
    expect(packed.text).toContain("1.5");
    expect(packed.text.toLowerCase()).toContain("idle");
    expect(packed.sections.some((section) => section.heading.includes("1.5"))).toBe(true);
  });

  it("does not front-slice later sections when many headings exist", () => {
    const many = Array.from({ length: 12 }, (_, index) => {
      const n = `${1}.${index + 1}`;
      return `${n} Topic ${index + 1}\n${`Content for ${n} including keyword_${index + 1}. `.repeat(30)}`;
    }).join("\n");
    const packed = packBalancedStudySource(many, 3600);
    expect(packed.text).toContain("keyword_11");
    expect(packed.sections.some((section) => section.heading.includes("1.12"))).toBe(true);
  });
});

describe("splitStudySourceSections", () => {
  it("splits numbered chapter headings", () => {
    const sections = splitStudySourceSections(chapter);
    expect(sections.length).toBeGreaterThanOrEqual(5);
    expect(sections.some((section) => section.heading.includes("1.5"))).toBe(true);
  });
});
