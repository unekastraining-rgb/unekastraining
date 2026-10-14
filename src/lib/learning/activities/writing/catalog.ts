/**
 * 2P-18 — Adaptive-ready Writing seed catalog (7–12 high-quality items).
 * Domain differences live in prompts/sources/rubrics — not subject engines.
 */

import type { WritingAdaptiveActivity, WritingActivityType } from "./types";

/** Enrichment metadata for existing structured writing rows (same ids). */
export type WritingAdaptiveMeta = {
  writingType: WritingActivityType;
  requiresRevision: boolean;
  revisionNotRequiredReason?: string;
  starterDraft?: string;
  revisionIssues?: readonly string[];
  sourceMaterial?: string;
  readiness: "ADAPTIVE_READY";
};

/**
 * New Adaptive-ready writing activities (merged into structured catalog).
 * Existing write-* rows remain in STRUCTURED_CHALLENGES_BASE and are enriched via meta.
 */
export const WRITING_ADAPTIVE_SEED_ACTIVITIES: readonly WritingAdaptiveActivity[] = [
  {
    id: "write-thesis-climate-policy",
    writingType: "thesis",
    title: "Defend a climate-policy thesis",
    conceptKey: "academic-thesis",
    conceptTitle: "Academic thesis",
    objective:
      "Write a single defensible thesis that takes a clear position on a supplied policy prompt.",
    prompt:
      "Prompt: Should cities prioritize expanding public transit over building new highways for the next decade? Write one thesis sentence (and 2–3 supporting sentences) that takes a clear, defensible position. Do not sit on the fence.",
    learnerTask:
      "Produce a thesis that states a position, names the policy tradeoff, and signals a reason.",
    expectedArtifact:
      "A short thesis paragraph with a clear claim and at least one because-reason.",
    domainTag: "english",
    skillFacet: "EXPLAIN",
    minChars: 60,
    criteria: [
      {
        id: "position",
        label: "Clear position",
        mustIncludeAny: ["should", "prioritize", "transit", "highway", "oppose", "support"],
      },
      {
        id: "thesis",
        label: "Thesis language",
        mustIncludeAny: ["thesis", "argue", "claim", "because", "therefore"],
      },
      {
        id: "tradeoff",
        label: "Tradeoff awareness",
        mustIncludeAny: ["tradeoff", "cost", "congestion", "emission", "access", "equity"],
      },
    ],
    requiresRevision: false,
    revisionNotRequiredReason:
      "Single-draft thesis construction; revision is practiced in write-revision-unclear-thesis.",
    conceptHints: ["thesis", "argument", "policy", "claim", "position", "essay"],
    scaffolds: [
      {
        kind: "STEP",
        label: "Thesis frame",
        content:
          "Position + because + stakes. Avoid 'many people think' and avoid listing both sides as equal.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    successLooksLike:
      "Your thesis takes one side, names the transit/highway tradeoff, and gives a reason.",
    progressionStage: "UNDERSTAND",
    scaffoldingLevel: "beginner",
    contextVariant: "urban climate policy prompt",
    misconceptionTargets: ["both-sides thesis with no claim", "topic sentence without position"],
    accessibility: {
      altDescription:
        "Write a short thesis taking a position on transit versus highways.",
      reducedComplexity: true,
      interactionNote: "Keyboard-friendly textarea; clear prompt hierarchy.",
    },
    version: "2P-18.1",
    readiness: "ADAPTIVE_READY",
  },
  {
    id: "write-evidence-paragraph-industrial",
    writingType: "evidence_paragraph",
    title: "Evidence-based paragraph (Industrial Revolution)",
    conceptKey: "historical-evidence-paragraph",
    conceptTitle: "Evidence-based paragraph",
    objective:
      "Write one paragraph that uses provided evidence to support a historical claim.",
    prompt:
      "Claim to support: Factory mechanization increased output but intensified worker precarity in early industrial Britain. Use at least two of the evidence bullets below in your paragraph.",
    learnerTask:
      "Construct a paragraph that states the claim, integrates evidence, and explains how evidence supports the claim.",
    expectedArtifact: "One evidence-based paragraph with claim + evidence + reasoning.",
    domainTag: "history",
    skillFacet: "EXPLAIN",
    minChars: 100,
    sourceMaterial:
      "Evidence: (1) Cotton mills raised yarn output several-fold after mechanized spinning. (2) Parliamentary reports describe 12–14 hour shifts for child laborers. (3) Real wages for some textile workers stagnated while output rose. (4) Urban overcrowding increased around mill towns.",
    criteria: [
      {
        id: "claim",
        label: "Claim restated",
        mustIncludeAny: ["mechaniz", "factory", "output", "worker", "precar", "claim"],
      },
      {
        id: "evidence",
        label: "Evidence used",
        mustIncludeAny: [
          "mill",
          "shift",
          "wage",
          "child",
          "overcrowd",
          "output",
          "parliament",
        ],
      },
      {
        id: "reasoning",
        label: "Reasoning link",
        mustIncludeAny: ["because", "shows", "suggests", "therefore", "supports", "implies"],
      },
    ],
    requiresRevision: false,
    revisionNotRequiredReason: "Focus is evidence integration in a single draft paragraph.",
    conceptHints: [
      "history",
      "evidence",
      "paragraph",
      "industrial",
      "claim",
      "reasoning",
    ],
    scaffolds: [
      {
        kind: "CHECKLIST",
        label: "Evidence checklist",
        content:
          "Claim stated? Two evidence items named? Each linked with because/shows? No dump of quotes without commentary?",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    successLooksLike:
      "Paragraph restates the claim, cites mill/wage/labor evidence, and explains the link.",
    progressionStage: "PRACTICE",
    scaffoldingLevel: "intermediate",
    contextVariant: "industrial Britain evidence set",
    misconceptionTargets: ["evidence list without reasoning", "claim without evidence"],
    accessibility: {
      altDescription:
        "Write a paragraph using Industrial Revolution evidence to support a claim.",
      extendedTimeSuggested: true,
    },
    version: "2P-18.1",
    readiness: "ADAPTIVE_READY",
  },
  {
    id: "write-source-analysis-suffrage",
    writingType: "source_analysis",
    title: "Source analysis — suffrage pamphlet",
    conceptKey: "historical-source-analysis",
    conceptTitle: "Source analysis",
    objective:
      "Analyze a historical source and support a conclusion with evidence from the text.",
    prompt:
      "Read the excerpt. What does the author want the reader to believe about women's suffrage, and how does the text try to persuade? State a conclusion and support it with at least two textual details.",
    learnerTask:
      "Produce a short source analysis with conclusion + textual evidence + persuasion method.",
    expectedArtifact: "Source analysis paragraph with conclusion and cited details.",
    domainTag: "history",
    skillFacet: "EXPLAIN",
    minChars: 100,
    sourceMaterial:
      "Excerpt (1913 pamphlet): 'A nation that taxes women without representation repeats the injustice it once condemned. Ballots are not ornaments; they are tools of self-protection. Deny them, and you ask women to obey laws they cannot shape.'",
    criteria: [
      {
        id: "conclusion",
        label: "Conclusion",
        mustIncludeAny: [
          "suffrage",
          "vote",
          "ballot",
          "represent",
          "conclude",
          "author",
          "believes",
        ],
      },
      {
        id: "textual",
        label: "Textual evidence",
        mustIncludeAny: ["tax", "representation", "ballot", "self-protection", "laws", "excerpt"],
      },
      {
        id: "method",
        label: "Persuasion method",
        mustIncludeAny: [
          "analogy",
          "justice",
          "injustice",
          "appeal",
          "compare",
          "persuade",
          "rhetoric",
        ],
      },
    ],
    requiresRevision: false,
    revisionNotRequiredReason: "Source analysis is a single analytical draft task.",
    conceptHints: [
      "source",
      "analysis",
      "suffrage",
      "history",
      "evidence",
      "persuasion",
    ],
    scaffolds: [
      {
        kind: "HINT",
        label: "Analysis lens",
        content:
          "Ask: audience, claim, evidence in the text, and persuasive move (analogy, justice appeal, etc.).",
        level: 2,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    successLooksLike:
      "You state what the author wants believed, cite tax/ballot language, and name a persuasive move.",
    progressionStage: "APPLY",
    scaffoldingLevel: "intermediate",
    contextVariant: "1913 suffrage pamphlet",
    misconceptionTargets: ["summary without conclusion", "modern opinion without text"],
    accessibility: {
      altDescription:
        "Analyze a suffrage pamphlet excerpt and support a conclusion with textual evidence.",
      extendedTimeSuggested: true,
    },
    version: "2P-18.1",
    readiness: "ADAPTIVE_READY",
  },
  {
    id: "write-paraphrase-cell-membrane",
    writingType: "paraphrasing",
    title: "Paraphrase a science passage",
    conceptKey: "scientific-paraphrase",
    conceptTitle: "Scientific paraphrasing",
    objective:
      "Rewrite a science passage accurately in your own words without copying sentence structure.",
    prompt:
      "Paraphrase the source passage about cell membranes. Keep the scientific meaning accurate. Do not quote more than a short technical term.",
    learnerTask: "Produce an accurate paraphrase that preserves meaning in new wording.",
    expectedArtifact: "Original-wording paraphrase of the membrane passage.",
    domainTag: "science",
    skillFacet: "EXPLAIN",
    minChars: 70,
    sourceMaterial:
      "Source: 'The cell membrane is a selectively permeable phospholipid bilayer that regulates which substances enter and leave the cell, helping maintain homeostasis.'",
    criteria: [
      {
        id: "meaning",
        label: "Meaning preserved",
        mustIncludeAny: [
          "membrane",
          "permeab",
          "phospholipid",
          "bilayer",
          "enter",
          "leave",
          "homeostasis",
          "regulat",
        ],
      },
      {
        id: "own_words",
        label: "Own words markers",
        mustIncludeAny: [
          "controls",
          "allows",
          "blocks",
          "keeps",
          "balance",
          "layer",
          "boundary",
        ],
      },
      {
        id: "not_copy",
        label: "Avoid wholesale copy",
        // Soft positive: require restructuring words beyond the source opener
        mustIncludeAny: ["cell", "substance", "molecule", "environment", "inside", "outside"],
      },
    ],
    requiresRevision: false,
    revisionNotRequiredReason: "Paraphrase is a single accurate rewrite task.",
    conceptHints: [
      "paraphrase",
      "membrane",
      "biology",
      "homeostasis",
      "science",
      "explain",
    ],
    scaffolds: [
      {
        kind: "CONSTRAINT",
        label: "Paraphrase rule",
        content:
          "Change structure and wording; keep meaning. Do not paste the source sentence.",
        level: 1,
        revealPolicy: "ALWAYS",
        doesNotRevealAnswer: true,
      },
    ],
    successLooksLike:
      "You explain selective permeability and homeostasis in fresh wording.",
    progressionStage: "PRACTICE",
    scaffoldingLevel: "beginner",
    contextVariant: "cell membrane passage",
    misconceptionTargets: ["near-copy paraphrase", "meaning drift"],
    accessibility: {
      altDescription: "Rewrite a cell-membrane science passage in your own words.",
      reducedComplexity: true,
    },
    version: "2P-18.1",
    readiness: "ADAPTIVE_READY",
  },
  {
    id: "write-argument-remote-work",
    writingType: "argument_structure",
    title: "Claim → evidence → reasoning (remote work)",
    conceptKey: "business-argument-structure",
    conceptTitle: "Argument structure",
    objective:
      "Construct a short argument with explicit claim, evidence, and reasoning.",
    prompt:
      "Prompt: Should a mid-size software firm make remote-first the default for engineering roles? Write a short argument using claim → evidence → reasoning. Invent plausible business evidence (retention, hiring pool, collaboration cost) — label it as hypothetical if needed.",
    learnerTask:
      "Produce claim, at least one evidence statement, and reasoning that links them.",
    expectedArtifact: "Structured argument with claim / evidence / reasoning labels or clear sequence.",
    domainTag: "business",
    skillFacet: "EXPLAIN",
    minChars: 90,
    criteria: [
      {
        id: "claim",
        label: "Claim",
        mustIncludeAny: ["claim", "should", "remote", "default", "argue", "position"],
      },
      {
        id: "evidence",
        label: "Evidence",
        mustIncludeAny: [
          "evidence",
          "retention",
          "hiring",
          "talent",
          "cost",
          "productivity",
          "data",
          "survey",
        ],
      },
      {
        id: "reasoning",
        label: "Reasoning",
        mustIncludeAny: [
          "reasoning",
          "because",
          "therefore",
          "implies",
          "means",
          "so that",
          "which shows",
        ],
      },
    ],
    requiresRevision: false,
    revisionNotRequiredReason: "Focus is constructing CER structure in one draft.",
    conceptHints: [
      "argument",
      "claim",
      "evidence",
      "reasoning",
      "business",
      "remote",
    ],
    scaffolds: [
      {
        kind: "STEP",
        label: "CER steps",
        content: "1) Claim 2) Evidence 3) Reasoning that connects evidence to claim.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    successLooksLike:
      "Clear claim on remote-first, business evidence, and because/therefore reasoning.",
    progressionStage: "APPLY",
    scaffoldingLevel: "intermediate",
    contextVariant: "remote-first engineering policy",
    misconceptionTargets: ["opinion without evidence", "evidence without link"],
    accessibility: {
      altDescription:
        "Write a claim-evidence-reasoning argument about remote-first work policy.",
    },
    version: "2P-18.1",
    readiness: "ADAPTIVE_READY",
  },
  {
    id: "write-revision-unclear-thesis",
    writingType: "revision",
    title: "Revise an unclear thesis draft",
    conceptKey: "writing-revision",
    conceptTitle: "Revision",
    objective:
      "Revise a weak draft to fix identified issues: vague claim, missing reason, and fence-sitting.",
    prompt:
      "You receive a draft with identified issues. Revise it into a clearer thesis paragraph. Your revision must differ from the draft and address the listed issues.",
    learnerTask:
      "Submit a revision that fixes vagueness, adds a because-reason, and takes a position.",
    expectedArtifact: "Revised thesis paragraph distinct from the starter draft.",
    domainTag: "english",
    skillFacet: "EXPLAIN",
    minChars: 70,
    requiresRevision: true,
    starterDraft:
      "Social media has many effects on teenagers and there are good and bad sides to it depending on the person.",
    revisionIssues: [
      "Vague claim ('many effects')",
      "Fence-sitting (good and bad)",
      "No because-reason or stakes",
    ],
    criteria: [
      {
        id: "position",
        label: "Takes a position",
        mustIncludeAny: [
          "should",
          "harm",
          "benefit",
          "improve",
          "worsen",
          "increase",
          "decrease",
          "must",
        ],
      },
      {
        id: "specificity",
        label: "Specific focus",
        mustIncludeAny: [
          "attention",
          "sleep",
          "anxiety",
          "bullying",
          "community",
          "identity",
          "learning",
          "privacy",
        ],
      },
      {
        id: "reason",
        label: "Because reason",
        mustIncludeAny: ["because", "since", "therefore", "which leads", "resulting"],
      },
    ],
    conceptHints: ["revision", "thesis", "draft", "clarity", "argument", "essay"],
    scaffolds: [
      {
        kind: "CHECKLIST",
        label: "Revision checklist",
        content:
          "Position clear? Specific effect named? Because-reason present? No both-sides shrug?",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    successLooksLike:
      "Revision takes a side, names a specific effect, and adds a because-reason.",
    progressionStage: "CHALLENGE",
    scaffoldingLevel: "challenge",
    contextVariant: "unclear social-media thesis draft",
    misconceptionTargets: ["cosmetic synonym swap", "unchanged fence-sitting"],
    accessibility: {
      altDescription:
        "Revise a vague thesis draft about social media into a clearer positioned claim.",
      extendedTimeSuggested: true,
      interactionNote: "Draft and revision fields; screen-reader labels on both.",
    },
    version: "2P-18.1",
    readiness: "ADAPTIVE_READY",
  },
  {
    id: "write-citation-apa-sleep",
    writingType: "citation",
    title: "Integrate a source with APA-style citation",
    conceptKey: "academic-citation",
    conceptTitle: "Citation practice",
    objective:
      "Integrate a research finding into a sentence with the required citation structure.",
    prompt:
      "Using the finding below, write 2–3 sentences that integrate the source and include an APA-style parenthetical citation (Author, Year).",
    learnerTask:
      "Produce prose that cites Rivera (2021) correctly while stating the finding in your own words.",
    expectedArtifact: "Short passage with integrated source + (Rivera, 2021).",
    domainTag: "english",
    skillFacet: "EXPLAIN",
    minChars: 50,
    sourceMaterial:
      "Finding (Rivera, 2021): Adolescents averaging under 7 hours of sleep scored lower on working-memory tasks than peers averaging 8–9 hours.",
    criteria: [
      {
        id: "integration",
        label: "Source integrated",
        mustIncludeAny: ["sleep", "working memory", "memory", "adolescent", "hours"],
      },
      {
        id: "citation",
        label: "APA citation",
        mustIncludeAny: ["rivera, 2021", "(rivera, 2021)"],
      },
      {
        id: "own_words",
        label: "Paraphrase not dump",
        mustIncludeAny: ["suggests", "found", "showed", "according", "reported", "indicates"],
      },
    ],
    requiresRevision: false,
    revisionNotRequiredReason: "Citation integration is a single-pass skill check.",
    conceptHints: ["citation", "apa", "source", "academic", "sleep", "research"],
    scaffolds: [
      {
        kind: "EXAMPLE",
        label: "Citation shape",
        content:
          "Pattern: According to … / Rivera (2021) found … / … (Rivera, 2021). Do not invent page numbers.",
        level: 1,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    successLooksLike:
      "Sentences paraphrase the sleep/memory finding and include (Rivera, 2021).",
    progressionStage: "PRACTICE",
    scaffoldingLevel: "beginner",
    contextVariant: "APA parenthetical sleep study",
    misconceptionTargets: ["citation without integration", "fabricated quotes"],
    accessibility: {
      altDescription:
        "Write sentences that integrate a sleep-study finding with an APA citation.",
      reducedComplexity: true,
    },
    version: "2P-18.1",
    readiness: "ADAPTIVE_READY",
  },
  {
    id: "write-tech-explain-https",
    writingType: "argument_structure",
    title: "Technical explanation — why HTTPS matters",
    conceptKey: "https-explanation",
    conceptTitle: "HTTPS explanation",
    objective:
      "Explain why HTTPS matters for a non-expert audience using accurate technical points.",
    prompt:
      "Explain to a non-technical manager why the team should require HTTPS on all public endpoints. Cover confidentiality, integrity, and trust signals without jargon overload.",
    learnerTask:
      "Produce a short technical explanation with audience-aware clarity and three security ideas.",
    expectedArtifact: "Audience-aware HTTPS explanation paragraph.",
    domainTag: "computer-science",
    skillFacet: "EXPLAIN",
    minChars: 80,
    criteria: [
      {
        id: "confidentiality",
        label: "Confidentiality / encryption",
        mustIncludeAny: ["encrypt", "confidential", "eavesdrop", "read", "tls", "https"],
      },
      {
        id: "integrity",
        label: "Integrity",
        mustIncludeAny: ["integrity", "tamper", "alter", "modify", "change in transit"],
      },
      {
        id: "trust",
        label: "Trust / audience",
        mustIncludeAny: [
          "certificate",
          "browser",
          "trust",
          "padlock",
          "manager",
          "customer",
          "user",
        ],
      },
    ],
    requiresRevision: false,
    revisionNotRequiredReason: "Technical explanation is a single audience-aware draft.",
    conceptHints: [
      "https",
      "tls",
      "encryption",
      "security",
      "explain",
      "technical",
    ],
    scaffolds: [
      {
        kind: "HINT",
        label: "Audience filter",
        content:
          "Lead with business risk, then name encryption, tampering protection, and browser trust — avoid unexplained acronyms.",
        level: 2,
        revealPolicy: "ON_REQUEST",
        doesNotRevealAnswer: true,
      },
    ],
    successLooksLike:
      "Explanation covers encryption, integrity, and trust in manager-friendly language.",
    progressionStage: "APPLY",
    scaffoldingLevel: "challenge",
    contextVariant: "manager-facing HTTPS rationale",
    misconceptionTargets: ["HTTPS only means faster", "HTTP is fine on public Wi-Fi"],
    accessibility: {
      altDescription:
        "Explain HTTPS benefits for a non-technical manager covering encryption, integrity, and trust.",
    },
    version: "2P-18.1",
    readiness: "ADAPTIVE_READY",
  },
];

/** Meta for existing BASE writing rows — Adaptive enrichment without duplication. */
export const EXISTING_WRITING_ADAPTIVE_META: Record<string, WritingAdaptiveMeta> = {
  "write-explain-photosynthesis": {
    writingType: "evidence_paragraph",
    requiresRevision: false,
    revisionNotRequiredReason: "Science explanation is a single-draft conceptual write-up.",
    readiness: "ADAPTIVE_READY",
  },
  "write-business-proposal": {
    writingType: "argument_structure",
    requiresRevision: false,
    revisionNotRequiredReason: "Proposal structure practiced in one draft; CER covered elsewhere.",
    readiness: "ADAPTIVE_READY",
  },
  "write-history-cause-effect": {
    writingType: "source_analysis",
    requiresRevision: false,
    revisionNotRequiredReason: "Cause-effect argument is a single analytical draft.",
    readiness: "ADAPTIVE_READY",
  },
  "write-math-proportional-reasoning": {
    writingType: "argument_structure",
    requiresRevision: false,
    revisionNotRequiredReason: "Math explanation is a single multi-step write-up.",
    readiness: "ADAPTIVE_READY",
  },
};

export function listWritingAdaptiveSeedActivities(): readonly WritingAdaptiveActivity[] {
  return WRITING_ADAPTIVE_SEED_ACTIVITIES;
}

export function getWritingAdaptiveActivity(
  id: string,
): WritingAdaptiveActivity | null {
  return WRITING_ADAPTIVE_SEED_ACTIVITIES.find((a) => a.id === id) ?? null;
}

export function getWritingAdaptiveMeta(id: string): WritingAdaptiveMeta | null {
  const seed = getWritingAdaptiveActivity(id);
  if (seed) {
    return {
      writingType: seed.writingType,
      requiresRevision: seed.requiresRevision,
      revisionNotRequiredReason: seed.revisionNotRequiredReason,
      starterDraft: seed.starterDraft,
      revisionIssues: seed.revisionIssues,
      sourceMaterial: seed.sourceMaterial,
      readiness: seed.readiness,
    };
  }
  return EXISTING_WRITING_ADAPTIVE_META[id] ?? null;
}

export function isWritingAdaptiveReadyContent(id: string): boolean {
  return getWritingAdaptiveMeta(id) != null;
}

export function listWritingDomainsCovered(): string[] {
  const tags = new Set<string>();
  for (const a of WRITING_ADAPTIVE_SEED_ACTIVITIES) {
    tags.add(a.domainTag);
  }
  tags.add("english");
  tags.add("business");
  tags.add("history");
  tags.add("science");
  tags.add("mathematics");
  tags.add("computer-science");
  return [...tags].sort();
}
