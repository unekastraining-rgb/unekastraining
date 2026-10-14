export interface PackedStudySection {
  heading: string;
  sourceChars: number;
  packedChars: number;
}

export interface PackedStudySource {
  text: string;
  sourceChars: number;
  packedChars: number;
  sections: PackedStudySection[];
  truncated: boolean;
}

/** Numbered chapter sections (1.1 Intro / 1.5: Using Python) and Chapter N titles — not review/homework. */
const SECTION_HEADING_RE =
  /(?:^|\n)(Chapter\s+\d+[^\n]{0,80}|\d+\.\d+[.:]?\s+[^\n]{2,100})/gi;

function clipToBudget(text: string, budget: number): string {
  if (text.length <= budget) return text;
  if (budget < 80) return text.slice(0, budget);
  const head = Math.floor(budget * 0.72);
  const tail = Math.max(24, budget - head - 5);
  return `${text.slice(0, head)}\n…\n${text.slice(-tail)}`;
}

/**
 * Split a reading into heading-based sections so later material is not treated
 * as leftover that can be sliced off the front.
 */
export function splitStudySourceSections(
  text: string,
): Array<{ heading: string; body: string }> {
  const source = text.trim();
  if (!source) return [];

  const matches = [...source.matchAll(SECTION_HEADING_RE)];
  if (matches.length < 2) {
    return [{ heading: "Reading", body: source }];
  }

  const sections: Array<{ heading: string; body: string }> = [];
  const firstIndex = matches[0]!.index ?? 0;
  if (firstIndex > 40) {
    sections.push({ heading: "Opening", body: source.slice(0, firstIndex).trim() });
  }

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]!;
    const start = match.index ?? 0;
    const end = i + 1 < matches.length ? (matches[i + 1]!.index ?? source.length) : source.length;
    const heading = String(match[1] ?? match[0] ?? `Section ${i + 1}`)
      .replace(/^\s+/, "")
      .slice(0, 120);
    const body = source.slice(start, end).trim();
    if (body) sections.push({ heading, body });
  }

  return sections;
}

/**
 * Pack a long reading so every major section is represented.
 * Oversized sections keep their start and end (where procedures and wrap-ups live).
 */
export function packBalancedStudySource(text: string, budget: number): PackedStudySource {
  const source = text.trim();
  const sourceChars = source.length;
  if (sourceChars <= budget) {
    const sections = splitStudySourceSections(source).map((section) => ({
      heading: section.heading,
      sourceChars: section.body.length,
      packedChars: section.body.length,
    }));
    return {
      text: source,
      sourceChars,
      packedChars: sourceChars,
      sections: sections.length > 0 ? sections : [{ heading: "Reading", sourceChars, packedChars: sourceChars }],
      truncated: false,
    };
  }

  const rawSections = splitStudySourceSections(source);
  const usable = rawSections.filter((section) => section.body.length > 0);
  const minEach = Math.max(
    240,
    Math.min(900, Math.floor(budget / Math.max(usable.length, 1))),
  );
  const weights = usable.map((section) => Math.max(section.body.length, 1));
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);

  const allocations = usable.map((_, index) => {
    const share = Math.max(minEach, Math.floor((weights[index]! / weightTotal) * budget));
    return share;
  });
  let allocSum = allocations.reduce((sum, value) => sum + value, 0);
  if (allocSum > budget) {
    const scale = budget / allocSum;
    for (let i = 0; i < allocations.length; i++) {
      allocations[i] = Math.max(minEach, Math.floor(allocations[i]! * scale));
    }
    allocSum = allocations.reduce((sum, value) => sum + value, 0);
    let overflow = allocSum - budget;
    let cursor = allocations.length - 1;
    while (overflow > 0 && cursor >= 0) {
      const reducible = allocations[cursor]! - minEach;
      if (reducible > 0) {
        const take = Math.min(reducible, overflow);
        allocations[cursor]! -= take;
        overflow -= take;
      }
      cursor -= 1;
    }
  } else {
    let remaining = budget - allocSum;
    let cursor = 0;
    while (remaining > 0 && usable.length > 0) {
      allocations[cursor % allocations.length]! += 1;
      remaining -= 1;
      cursor += 1;
    }
  }

  const packedParts: string[] = [];
  const sections: PackedStudySection[] = [];
  usable.forEach((section, index) => {
    const clipped = clipToBudget(section.body, allocations[index] ?? minEach);
    packedParts.push(clipped);
    sections.push({
      heading: section.heading,
      sourceChars: section.body.length,
      packedChars: clipped.length,
    });
  });

  const packed = packedParts.join("\n\n");
  return {
    text: packed,
    sourceChars,
    packedChars: packed.length,
    sections,
    truncated: packed.length < sourceChars,
  };
}

export function formatPackedCoverage(packed: PackedStudySource): string {
  const thin = packed.sections.filter(
    (section) => section.sourceChars > 1200 && section.packedChars / section.sourceChars < 0.45,
  );
  const lines = [
    `Source ${packed.sourceChars} chars → packed ${packed.packedChars} chars` +
      (packed.truncated ? " (balanced across sections, not front-only)" : ""),
    `Sections: ${packed.sections.map((section) => section.heading.replace(/\s+/g, " ").slice(0, 40)).join(" · ")}`,
  ];
  if (thin.length > 0) {
    lines.push(
      `Thinned: ${thin.map((section) => section.heading.replace(/\s+/g, " ").slice(0, 32)).join(", ")}`,
    );
  }
  return lines.join("\n");
}
