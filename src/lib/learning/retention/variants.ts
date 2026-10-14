/**
 * 2P-38 — Meaningful retention variants (same concept, different context).
 * Deterministic selection — no nondeterministic tests.
 * Reuses concept keys from domain/experience packs; not a subject engine.
 */

import type { RetentionDifficulty } from "@/lib/learning/retention/types";

export type RetentionVariantPrompt = {
  id: string;
  conceptKey: string;
  difficulty: RetentionDifficulty;
  prompt: string;
  inputMode: "text" | "choice" | "self_rate";
  options?: string[];
  /** Internal grade — never returned to client. */
  mustIncludeAny?: string[];
  /** Self-rate only when no keyword criteria. */
  misconceptionTargets?: string[];
  contextVariant: string;
};

/**
 * Priority RETAIN variants for universal Lucky depth.
 * Keys align with 2P-36/37 conceptKeys where possible.
 */
export const RETENTION_VARIANTS: RetentionVariantPrompt[] = [
  // —— Math ——
  {
    id: "retain-math-linear-a",
    conceptKey: "linear-equation-solving",
    difficulty: 2,
    prompt:
      "RECALL: Name the first move to isolate x in 3x + 7 = 19, then give x. (No calculator CAS — show the undo step.)",
    inputMode: "text",
    mustIncludeAny: ["subtract", "−7", "-7", "minus 7", "x = 4", "4"],
    misconceptionTargets: ["doing an operation to only one side"],
    contextVariant: "3x+7=19 isolate",
  },
  {
    id: "retain-math-linear-b",
    conceptKey: "linear-equation-solving",
    difficulty: 3,
    prompt:
      "RECALL: Solve 2x − 5 = 9. Check by substitution in one sentence.",
    inputMode: "text",
    mustIncludeAny: ["x = 7", "7", "check", "2(7)", "14"],
    misconceptionTargets: ["sign error when moving terms"],
    contextVariant: "2x-5=9 with check",
  },
  {
    id: "retain-math-prob-a",
    conceptKey: "basic-probability",
    difficulty: 2,
    prompt:
      "RECALL: A fair die is rolled. What is P(odd)? Favorable over total.",
    inputMode: "text",
    mustIncludeAny: ["3/6", "1/2", "0.5", "half"],
    misconceptionTargets: ["counting faces incorrectly"],
    contextVariant: "die odd faces",
  },
  // —— Cyber / net ——
  {
    id: "retain-cyber-auth-a",
    conceptKey: "authentication-vs-authorization",
    difficulty: 2,
    prompt:
      "RECALL: A user proves identity with a password, then is denied a page they are not allowed to open. Which step failed — authentication or authorization? One sentence why.",
    inputMode: "text",
    mustIncludeAny: ["authorization", "authz", "permission", "allowed"],
    misconceptionTargets: ["confusing authentication with authorization"],
    contextVariant: "password ok, page denied",
  },
  {
    id: "retain-cyber-auth-b",
    conceptKey: "authentication-vs-authorization",
    difficulty: 3,
    prompt:
      "RECALL: MFA succeeded, but the role lacks write access. Name the control that blocks the write.",
    inputMode: "text",
    mustIncludeAny: ["authorization", "permission", "role", "access control"],
    misconceptionTargets: ["thinking MFA is authorization"],
    contextVariant: "MFA ok missing write",
  },
  {
    id: "retain-net-dns-a",
    conceptKey: "dns-vs-dhcp-diagnosis",
    difficulty: 2,
    prompt:
      "RECALL: Browser shows a name-not-found error, but IP ping to 8.8.8.8 works. Which service is more likely broken — DNS or DHCP? Why?",
    inputMode: "text",
    mustIncludeAny: ["dns", "name", "resolve", "lookup"],
    misconceptionTargets: ["blaming DHCP first when APIPA is not present"],
    contextVariant: "name fail ping ok",
  },
  {
    id: "retain-net-dns-b",
    conceptKey: "dns-vs-dhcp-diagnosis",
    difficulty: 3,
    prompt:
      "RECALL: Host has 169.254.x.x address and cannot reach the gateway. Which assignment mechanism likely failed?",
    inputMode: "text",
    mustIncludeAny: ["dhcp", "apipa", "169.254", "lease"],
    misconceptionTargets: ["treating APIPA as a DNS failure"],
    contextVariant: "APIPA no gateway",
  },
  // —— Nursing (educational) ——
  {
    id: "retain-nurse-vitals-a",
    conceptKey: "vital-signs-interpretation",
    difficulty: 2,
    prompt:
      "RECALL (educational scenario): Adult HR 128, BP 88/54, SpO2 91% on room air. Which finding is the highest-priority concern to reassess first? Educational practice only — not medical advice.",
    inputMode: "text",
    mustIncludeAny: ["spo2", "oxygen", "bp", "hypotens", "airway", "breath"],
    misconceptionTargets: ["treating isolated HR without context"],
    contextVariant: "hypotension hypoxia priority",
  },
  // —— Business ——
  {
    id: "retain-biz-inv-a",
    conceptKey: "inventory-reorder-reasoning",
    difficulty: 2,
    prompt:
      "RECALL: Stock is 40, daily demand ~20, lead time 3 days, reorder point 60. Should you reorder now? Name one tradeoff (cost vs stockout).",
    inputMode: "text",
    mustIncludeAny: ["reorder", "yes", "stockout", "below", "lead"],
    misconceptionTargets: ["ignoring lead-time demand"],
    contextVariant: "below ROP lead 3",
  },
  // —— Automotive ——
  {
    id: "retain-auto-nostart-a",
    conceptKey: "no-start-diagnostic-basics",
    difficulty: 2,
    prompt:
      "RECALL: Engine cranks strongly but will not start. Which check is more useful first — battery voltage or fuel/spark delivery? Why?",
    inputMode: "text",
    mustIncludeAny: ["fuel", "spark", "ignition", "crank", "not battery"],
    misconceptionTargets: ["strong crank blamed on dead battery first"],
    contextVariant: "strong crank no start",
  },
  // —— Physics / chem ——
  {
    id: "retain-phys-energy-a",
    conceptKey: "mechanical-energy-transfer",
    difficulty: 2,
    prompt:
      "RECALL: A book falls from a shelf. Name the energy form that increases just before impact and what happens to total mechanical energy if air drag matters.",
    inputMode: "text",
    mustIncludeAny: ["kinetic", "heat", "thermal", "dissipat", "decrease"],
    misconceptionTargets: ["potential energy destroyed"],
    contextVariant: "falling book drag",
  },
  {
    id: "retain-chem-periodic-a",
    conceptKey: "periodic-trends-basics",
    difficulty: 2,
    prompt:
      "RECALL: Across a period left to right, does atomic radius generally increase or decrease? One reason.",
    inputMode: "text",
    mustIncludeAny: ["decrease", "smaller", "nuclear", "proton", "attraction"],
    misconceptionTargets: ["thinking radius increases across a period"],
    contextVariant: "period radius trend",
  },
  // —— Bundle H: canonical KL concept-aware recall ——
  {
    id: "retain-writing-thesis-a",
    conceptKey: "writing-thesis",
    difficulty: 2,
    prompt:
      "RECALL: Is “This paper is about social media and sleep” a thesis or a topic label? Say which, and rewrite it as a stronger thesis in one sentence.",
    inputMode: "text",
    mustIncludeAny: ["topic", "thesis", "because", "claim", "argu"],
    misconceptionTargets: ["thesis-is-topic"],
    contextVariant: "topic vs thesis rewrite",
  },
  {
    id: "retain-writing-evidence-analysis-a",
    conceptKey: "writing-evidence-vs-analysis",
    difficulty: 2,
    prompt:
      "RECALL: A paragraph quotes a source accurately but never explains why the quote matters. What is missing — evidence or analysis?",
    inputMode: "text",
    mustIncludeAny: ["analysis", "explain", "so what", "connection"],
    misconceptionTargets: ["evidence-speaks-for-itself"],
    contextVariant: "quote without analysis",
  },
  {
    id: "retain-econ-shift-a",
    conceptKey: "economics-supply-demand",
    difficulty: 2,
    prompt:
      "RECALL: Price rises and quantity demanded falls, with no other market change. Is that a movement along the demand curve or a shift of the demand curve?",
    inputMode: "text",
    mustIncludeAny: ["movement", "along", "not a shift", "same curve"],
    misconceptionTargets: ["calling any price change a demand shift"],
    contextVariant: "movement vs shift",
  },
  {
    id: "retain-java-inheritance-a",
    conceptKey: "java-inheritance",
    difficulty: 2,
    prompt:
      "RECALL: In one sentence, distinguish method overriding from method overloading in Java.",
    inputMode: "text",
    mustIncludeAny: ["override", "overload", "same signature", "subclass", "parameters"],
    misconceptionTargets: ["treating overload and override as the same"],
    contextVariant: "override vs overload",
  },
  // Bundle J/L — KL-aligned retention (canonical catalog; KL resolver delegates here)
  {
    id: "retain-python-variables-a",
    conceptKey: "python-variables",
    difficulty: 2,
    prompt:
      "RECALL: In Python, what does the = operator do when you write age = 20? One sentence.",
    inputMode: "text",
    mustIncludeAny: ["assign", "bind", "name", "value", "refer"],
    misconceptionTargets: ["declaring a type before assignment"],
    contextVariant: "python assignment",
  },
  {
    id: "retain-sql-joins-a",
    conceptKey: "sql-joins",
    difficulty: 2,
    prompt:
      "RECALL: In one sentence, distinguish INNER JOIN from LEFT JOIN.",
    inputMode: "text",
    mustIncludeAny: ["inner", "left", "match", "null", "all"],
    misconceptionTargets: ["LEFT JOIN drops unmatched left rows"],
    contextVariant: "inner vs left",
  },
  {
    id: "retain-biology-photo-a",
    conceptKey: "biology-photosynthesis",
    difficulty: 2,
    prompt:
      "RECALL: Name the main products of oxygenic photosynthesis (simplified).",
    inputMode: "text",
    mustIncludeAny: ["glucose", "sugar", "oxygen", "o2"],
    misconceptionTargets: ["plants never respire"],
    contextVariant: "photosynthesis products",
  },
  {
    id: "retain-psych-classical-a",
    conceptKey: "psychology-classical-conditioning",
    difficulty: 2,
    prompt:
      "RECALL: Distinguish classical conditioning from operant conditioning in one sentence.",
    inputMode: "text",
    mustIncludeAny: ["stimulus", "association", "consequence", "operant", "classical"],
    misconceptionTargets: ["reward after voluntary behavior is classical"],
    contextVariant: "classical vs operant",
  },
];

const TITLE_ALIASES: Array<{ match: RegExp; conceptKey: string }> = [
  { match: /linear\s*equation|solve.*equation|balancing/i, conceptKey: "linear-equation-solving" },
  { match: /probability|favorable/i, conceptKey: "basic-probability" },
  { match: /authenticat|authoriz|authn|authz/i, conceptKey: "authentication-vs-authorization" },
  { match: /dns|dhcp|apipa/i, conceptKey: "dns-vs-dhcp-diagnosis" },
  { match: /vital|triage|spo2|heart rate/i, conceptKey: "vital-signs-interpretation" },
  { match: /inventory|reorder|stockout/i, conceptKey: "inventory-reorder-reasoning" },
  { match: /no[- ]?start|crank|diagnos/i, conceptKey: "no-start-diagnostic-basics" },
  { match: /energy|kinetic|potential/i, conceptKey: "mechanical-energy-transfer" },
  { match: /periodic|atomic radius|electroneg/i, conceptKey: "periodic-trends-basics" },
  { match: /thesis|topic vs thesis/i, conceptKey: "writing-thesis" },
  { match: /evidence vs analysis|analysis vs evidence/i, conceptKey: "writing-evidence-vs-analysis" },
  { match: /supply and demand|demand curve|equilibrium price/i, conceptKey: "economics-supply-demand" },
  { match: /java inheritance|overrid|overload/i, conceptKey: "java-inheritance" },
  { match: /python variable|variables in python/i, conceptKey: "python-variables" },
  { match: /sql join|inner join|left join/i, conceptKey: "sql-joins" },
  { match: /photosynthesis/i, conceptKey: "biology-photosynthesis" },
  { match: /classical conditioning|pavlov/i, conceptKey: "psychology-classical-conditioning" },
];

export function resolveConceptKeyForRetention(input: {
  conceptKey?: string | null;
  conceptTitle?: string | null;
}): string | null {
  if (input.conceptKey && input.conceptKey.trim()) {
    return input.conceptKey.trim();
  }
  const title = input.conceptTitle ?? "";
  for (const row of TITLE_ALIASES) {
    if (row.match.test(title)) return row.conceptKey;
  }
  return null;
}

export function listRetentionVariantsForConcept(
  conceptKey: string,
): RetentionVariantPrompt[] {
  return RETENTION_VARIANTS.filter((v) => v.conceptKey === conceptKey).sort(
    (a, b) => a.id.localeCompare(b.id),
  );
}

/**
 * Pick next variant: prefer matching difficulty band, avoid lastVariantId.
 * Deterministic — stable sort by id.
 */
export function pickRetentionVariant(input: {
  conceptKey: string;
  difficulty?: RetentionDifficulty;
  lastVariantId?: string | null;
  misconceptionHints?: string[];
}): RetentionVariantPrompt | null {
  const pool = listRetentionVariantsForConcept(input.conceptKey);
  if (!pool.length) return null;

  const difficulty = input.difficulty ?? 2;
  const hints = (input.misconceptionHints ?? []).map((h) => h.toLowerCase());

  const scored = pool.map((v) => {
    let score = 0;
    if (v.id !== input.lastVariantId) score += 10;
    else score -= 50;
    score += 5 - Math.abs(v.difficulty - difficulty);
    if (hints.length && v.misconceptionTargets?.length) {
      for (const t of v.misconceptionTargets) {
        if (hints.some((h) => h.includes(t.toLowerCase()) || t.toLowerCase().includes(h))) {
          score += 20;
        }
      }
    }
    return { v, score };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.v.id.localeCompare(b.v.id);
  });

  return scored[0]?.v ?? null;
}

export function gradeRetentionVariantText(
  variant: RetentionVariantPrompt,
  answer: string,
): { outcome: "SUCCESS" | "PARTIAL" | "FAIL"; score: number } {
  const text = answer.trim().toLowerCase();
  if (!text) return { outcome: "FAIL", score: 0 };
  const needles = (variant.mustIncludeAny ?? []).map((n) => n.toLowerCase());
  if (!needles.length) {
    return text.length >= 12
      ? { outcome: "PARTIAL", score: 0.7 }
      : { outcome: "FAIL", score: 0.35 };
  }
  const hits = needles.filter((n) => text.includes(n)).length;
  if (hits >= 2 || (hits >= 1 && needles.length === 1)) {
    return { outcome: "SUCCESS", score: 1 };
  }
  if (hits === 1) return { outcome: "PARTIAL", score: 0.7 };
  return { outcome: "FAIL", score: 0.35 };
}
