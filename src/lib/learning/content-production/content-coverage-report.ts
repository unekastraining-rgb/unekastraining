/**
 * Live CONTENT_COVERAGE measurements from progression + challenge catalogs.
 * Honest counts — does not inflate via trivial duplicate rows.
 */

import { CONTENT_PROGRESSION_CATALOG } from "@/lib/learning/content-progression/catalog";
import type { LearningContentStage } from "@/lib/learning/content-progression/types";
import { listActivityContentDescriptors } from "@/lib/learning/activities/content-contract";
import { CONTENT_EXPANSION_CHALLENGES } from "@/lib/learning/activities/content-expansion-queue";

export type DomainCoverageRow = {
  domain: string;
  concepts: number;
  understand: number;
  explain: number;
  apply: number;
  solve: number;
  perform: number;
  transfer: number;
  retain: number;
  /** INTRODUCE | PRACTICE | CHALLENGE counted for honesty */
  practice: number;
  challenge: number;
  introduce: number;
  status: "THIN" | "DEVELOPING" | "SUBSTANTIAL" | "COMPLETE";
};

/** Map progression stages → report columns (EXPLAIN/SOLVE/PERFORM via facet heuristics on activity kinds). */
const DOMAIN_MATCHERS: ReadonlyArray<{ domain: string; match: RegExp }> = [
  { domain: "Computer Science", match: /^computer science$/i },
  { domain: "Networking", match: /^networking$/i },
  { domain: "Cybersecurity", match: /^cybersecurity$/i },
  { domain: "Mathematics", match: /^mathematics$/i },
  { domain: "Physics", match: /^physics$/i },
  { domain: "Chemistry", match: /^chemistry$/i },
  { domain: "Biology", match: /^biology$/i },
  { domain: "Earth Science", match: /^earth science$/i },
  { domain: "Nursing", match: /^nursing$/i },
  { domain: "Business", match: /^business$/i },
  { domain: "Finance", match: /^finance$/i },
  { domain: "Accounting", match: /^accounting$/i },
  { domain: "Economics", match: /^economics$/i },
  { domain: "Psychology", match: /^psychology$/i },
  { domain: "Sociology", match: /^sociology$/i },
  { domain: "History", match: /^history$/i },
  { domain: "Civics", match: /^civics$/i },
  { domain: "Geography", match: /^geography$/i },
  { domain: "English / Writing", match: /^(english|humanities)$/i },
  { domain: "Literature", match: /^literature$/i },
  { domain: "Communication", match: /^communication$/i },
  { domain: "Languages", match: /^languages$/i },
  { domain: "Art", match: /^art$/i },
  { domain: "Music", match: /^music$/i },
  { domain: "HVAC", match: /^hvac$/i },
  { domain: "Electrical", match: /^electrical$/i },
  { domain: "Automotive", match: /^automotive$/i },
  { domain: "Manufacturing", match: /^manufacturing$/i },
  { domain: "Logistics", match: /^logistics$/i },
  { domain: "IT Support", match: /^it support$/i },
  { domain: "Cloud", match: /^cloud$/i },
  { domain: "Data Analytics", match: /^data analytics$/i },
  { domain: "Project Management", match: /^project management$/i },
  { domain: "General Education", match: /^general education$/i },
  { domain: "Healthcare Admin", match: /^healthcare administration$/i },
  { domain: "Construction", match: /^construction$/i },
  { domain: "Education", match: /^education$/i },
  { domain: "Hospitality", match: /^hospitality$/i },
];

function readyEntries() {
  return CONTENT_PROGRESSION_CATALOG.filter((e) => {
    const r = e.readiness ?? "READY";
    return r !== "DRAFT" && r !== "ARCHIVED";
  });
}

function statusFor(row: Omit<DomainCoverageRow, "status">): DomainCoverageRow["status"] {
  const stageKinds =
    (row.understand > 0 ? 1 : 0) +
    (row.apply > 0 || row.practice > 0 ? 1 : 0) +
    (row.retain > 0 ? 1 : 0) +
    (row.transfer > 0 ? 1 : 0);
  if (row.concepts === 0) return "THIN";
  if (row.concepts >= 8 && stageKinds >= 3 && row.practice + row.apply >= 4) {
    return "COMPLETE";
  }
  if (row.concepts >= 4 && stageKinds >= 2) return "SUBSTANTIAL";
  if (row.concepts >= 2) return "DEVELOPING";
  return "THIN";
}

/**
 * Stage columns:
 * - UNDERSTAND / INTRODUCE → understand
 * - PRACTICE with writing → explain proxy (writing EXPLAIN activities)
 * - APPLY → apply
 * - CHALLENGE → solve proxy (problem-solving emphasis)
 * - RETAIN → retain
 * - transfer = entries whose contextVariant mentions transfer
 * - perform = lab/presentation/coding activity PRACTICE rows (demonstration)
 */
export function buildDomainCoverageRows(): DomainCoverageRow[] {
  const entries = readyEntries();
  const rows: DomainCoverageRow[] = [];

  for (const spec of DOMAIN_MATCHERS) {
    const subset = entries.filter((e) =>
      spec.match.test((e.domainContext ?? "").trim()),
    );
    const concepts = new Set(subset.map((e) => e.conceptKey)).size;
    let understand = 0;
    let explain = 0;
    let apply = 0;
    let solve = 0;
    let perform = 0;
    let transfer = 0;
    let retain = 0;
    let practice = 0;
    let challenge = 0;
    let introduce = 0;

    for (const e of subset) {
      const stage = e.stage as LearningContentStage;
      const variant = (e.contextVariant ?? "").toLowerCase();
      if (variant.includes("transfer")) transfer += 1;
      if (stage === "UNDERSTAND") understand += 1;
      if (stage === "INTRODUCE") introduce += 1;
      if (stage === "PRACTICE") {
        practice += 1;
        if (e.activityKind === "writing") explain += 1;
        if (
          e.activityKind === "lab" ||
          e.activityKind === "presentation" ||
          e.activityKind === "coding"
        ) {
          perform += 1;
        }
      }
      if (stage === "APPLY") apply += 1;
      if (stage === "CHALLENGE") {
        challenge += 1;
        solve += 1;
      }
      if (stage === "RETAIN") retain += 1;
    }

    const base = {
      domain: spec.domain,
      concepts,
      understand: understand + introduce,
      explain,
      apply,
      solve,
      perform,
      transfer,
      retain,
      practice,
      challenge,
      introduce,
    };
    rows.push({ ...base, status: statusFor(base) });
  }

  return rows;
}

export function buildActivityKindCoverage(): Record<string, number> {
  const kinds = [
    "coding",
    "sql",
    "lab",
    "simulation",
    "writing",
    "presentation",
    "game",
    "project",
    "math",
    "networking",
    "language",
  ] as const;
  const out: Record<string, number> = {};
  for (const k of kinds) {
    out[k] = listActivityContentDescriptors(k).length;
  }
  return out;
}

export function buildLearningLoopCoverage(): Record<string, number> {
  const entries = readyEntries();
  const counts: Record<string, number> = {
    UNDERSTAND: 0,
    INTRODUCE: 0,
    PRACTICE: 0,
    APPLY: 0,
    CHALLENGE: 0,
    RETAIN: 0,
    TRANSFER_VARIANTS: 0,
  };
  for (const e of entries) {
    counts[e.stage] = (counts[e.stage] ?? 0) + 1;
    if ((e.contextVariant ?? "").toLowerCase().includes("transfer")) {
      counts.TRANSFER_VARIANTS += 1;
    }
  }
  return counts;
}

export function contentCoverageMarkdown(): string {
  const rows = buildDomainCoverageRows();
  const activities = buildActivityKindCoverage();
  const loops = buildLearningLoopCoverage();
  const concepts = new Set(readyEntries().map((e) => e.conceptKey)).size;
  const entryCount = readyEntries().length;
  const expansionIds = CONTENT_EXPANSION_CHALLENGES.length;

  const lines: string[] = [];
  lines.push("# Study Haul - Content Coverage");
  lines.push("");
  lines.push(
    "Live measurements from `CONTENT_PROGRESSION_CATALOG` and Universal Activity catalogs.",
  );
  lines.push("Does **not** inflate coverage by counting trivial text renames.");
  lines.push("");
  lines.push(`- Ready progression entries: **${entryCount}**`);
  lines.push(`- Unique concepts: **${concepts}**`);
  lines.push(`- Content-expansion-queue structured challenges: **${expansionIds}**`);
  lines.push("");
  lines.push("## Domain coverage");
  lines.push("");
  lines.push(
    "| Domain | Concepts | Understand | Explain* | Apply | Solve* | Perform* | Transfer* | Retain | Status |",
  );
  lines.push(
    "| ------ | -------: | ---------: | -------: | ----: | -----: | -------: | --------: | -----: | ------ |",
  );
  for (const r of rows) {
    lines.push(
      `| ${r.domain} | ${r.concepts} | ${r.understand} | ${r.explain} | ${r.apply} | ${r.solve} | ${r.perform} | ${r.transfer} | ${r.retain} | ${r.status} |`,
    );
  }
  lines.push("");
  lines.push(
    "* Explain ~= writing PRACTICE rows; Solve ~= CHALLENGE stage; Perform ~= lab/presentation/coding PRACTICE; Transfer ~= contextVariant transfer rows (same concept, new surface). Progression stages remain INTRODUCE/UNDERSTAND/PRACTICE/APPLY/CHALLENGE/RETAIN.",
  );
  lines.push("");
  lines.push("## Universal activity catalog sizes");
  lines.push("");
  for (const [k, v] of Object.entries(activities)) {
    lines.push(`- **${k}**: ${v}`);
  }
  lines.push("");
  lines.push("## Learning loop stage counts (progression entries)");
  lines.push("");
  for (const [k, v] of Object.entries(loops)) {
    lines.push(`- **${k}**: ${v}`);
  }
  lines.push("");
  lines.push("## Status rubric (honest)");
  lines.push("");
  lines.push("- **THIN** — 0–1 concepts");
  lines.push("- **DEVELOPING** — ≥2 concepts");
  lines.push("- **SUBSTANTIAL** — ≥4 concepts with ≥2 stage kinds");
  lines.push(
    "- **COMPLETE** — ≥8 concepts, ≥3 stage kinds, ≥4 practice/apply activities — representative breadth, not encyclopedic finish",
  );
  lines.push("");
  lines.push("Architecture remains **CORE -> SIX -> LUCKY** with one ULE evidence spine.");
  lines.push("");
  return lines.join("\n");
}
