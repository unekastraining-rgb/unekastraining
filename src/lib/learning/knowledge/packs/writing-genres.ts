/**
 * Knowledge pack: Writing genres and distinctions (Study Haul writing).
 * Additive second writing pack — unique concept IDs; relationships may target
 * writing-fundamentals concepts that already exist in the library.
 */

import type { InstructionalKnowledgePack } from "@/lib/learning/knowledge/instructional-library";
import { registerInstructionalPack } from "@/lib/learning/knowledge/instructional-library";
import {
  klConcept,
  klMisconception,
  klRel,
} from "@/lib/learning/knowledge/packs/helpers";

export const WRITING_GENRES_CONCEPT_IDS = [
  "writing-topic-vs-thesis",
  "writing-tone",
  "writing-genre-essay",
  "writing-genre-argumentative",
  "writing-genre-compare-contrast",
  "writing-genre-research",
  "writing-genre-analytical",
  "writing-evidence-vs-analysis",
  "writing-proofreading",
  "writing-genre-discussion-post",
  "writing-genre-professional-email",
  "writing-genre-lab-report",
] as const;

export const WRITING_GENRES_PACK: InstructionalKnowledgePack = {
  id: "writing-genres",
  match: [
    "argumentative essay",
    "compare and contrast essay",
    "research paper genre",
    "analytical essay",
    "discussion post writing",
    "professional email writing",
    "topic vs thesis",
    "evidence vs analysis",
    "writing tone",
    "proofreading writing",
  ],
  domain: "writing",
  subject: "writing",
  displayTitle: "Writing genres and distinctions",
  learningFrame:
    "Genre expectations and key writing distinctions: topic vs thesis, tone, evidence vs analysis, proofreading vs revision/editing, and common academic/professional genres.",
  cheatSheet:
    "Topic ≠ Thesis → Tone fits audience/purpose → Genre sets moves → Evidence needs analysis → Revise → Edit → Proofread",
  concepts: [
    klConcept({
      id: "writing-topic-vs-thesis",
      title: "Topic vs thesis",
      aliases: [
        "topic versus thesis",
        "topic vs thesis statement",
        "topic or thesis",
        "difference between topic and thesis",
      ],
      definition:
        "A topic names the subject area; a thesis asserts a specific, arguable claim about that subject that the paper will support.",
      explanation:
        "Prompts often say “write about X,” so students paste X into the thesis slot. That leaves no stance to defend. Convert topic → question → claim: what about X should the reader accept, and why? The distinction is not pedantic — without a thesis, body paragraphs drift into summary or list.",
      purpose: "Separate subject territory from the controlling claim.",
      example:
        "Topic: remote learning. Thesis: “Hybrid schedules improve equity for commuting students because they reduce transit costs without lowering discussion quality.”",
      examples: [
        "Topic: social media. Thesis: “Unmoderated peer forums spread procedural misconceptions in intro programming faster than they correct them.”",
        "Weak: “This paper is about sleep and grades.” (topic label, not claim)",
      ],
      nonExamples: [
        "Treating “I will discuss climate policy” as a thesis",
        "A preference with no because-clause (“Sleep is important”)",
      ],
      misconceptions: ["A topic and a thesis are the same thing."],
      misconception: "Equating the paper’s topic with its thesis statement.",
      misconceptionDetails: [
        klMisconception({
          misconception: "My topic is my thesis.",
          why: "Assignment language highlights the subject, not the stance.",
          correction:
            "Topic names the territory; thesis takes a debatable position inside it that evidence can support or challenge.",
          contrast: "topic (“campus dining”) vs thesis (“late-night options reduce food insecurity because…”)",
          diagnosticClue: "Opening ends with “This essay is about…” or a noun phrase only",
        }),
        klMisconception({
          misconception: "If I rename the topic in fancy words, I have a thesis.",
          why: "Synonyms feel like precision.",
          correction:
            "Synonyms still name territory. Add a stance a reasonable reader could dispute.",
          contrast: "rephrased topic vs arguable claim",
          diagnosticClue: "“Thesis” is a restated prompt with no because/so-what",
        }),
      ],
      vocabulary: ["topic", "thesis", "stance", "scope", "arguable claim"],
      prerequisites: ["writing-thesis"],
      relatedConcepts: ["writing-thesis", "writing-claim", "writing-purpose"],
      relationships: [
        klRel(
          "commonly_confused_with",
          "writing-thesis",
          "Students paste topic labels into the thesis slot",
        ),
        klRel("related_to", "writing-claim", "Thesis is the paper-scale claim"),
        klRel("related_to", "writing-purpose", "Purpose decides what claim the topic must serve"),
      ],
      procedures: [
        "Name the topic in 2–4 words",
        "Ask what about it you want the reader to accept",
        "Write one sentence with stance + because-clause",
        "Check: could a peer disagree without being absurd?",
      ],
      practiceForms: ["compare", "revise", "diagnose"],
      assessmentForms: ["rewrite topic into thesis", "flag topic-as-thesis lines"],
      difficulty: 2,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "haul-writing",
          label: "Haul Writing",
          unit: "Thesis",
          conceptId: "writing-topic-vs-thesis",
        },
      ],
      checkPrompt:
        "Does your “thesis” name a subject, or assert a claim someone could reasonably dispute?",
    }),

    klConcept({
      id: "writing-tone",
      title: "Writing tone",
      aliases: [
        "tone in writing",
        "academic tone",
        "professional tone",
        "formal vs informal tone",
      ],
      definition:
        "Tone is the attitude the prose takes toward subject and reader — formal, tentative, urgent, collegial — signaled by word choice, hedging, and address.",
      explanation:
        "Tone is not decoration; it is rhetorical fit. Same claim can read arrogant, careful, or casual depending on hedges, intensifiers, and pronouns. Match tone to purpose and audience: a lab report needs measured precision; a discussion post can be more conversational while still evidence-based; a professional email stays clear and respectful without padding.",
      purpose: "Align voice with audience expectations and communicative aim.",
      example:
        "Academic: “The data suggest a modest association…” vs casual: “Obviously this proves everything.”",
      examples: [
        "Email: “Could you clarify the deadline?” beats “You never told us the deadline.”",
        "Over-hedged: “It might sort of perhaps indicate…” (undercuts a clear claim)",
      ],
      nonExamples: [
        "Assuming “formal” means longer sentences and jargon",
        "Matching tone to the writer’s mood instead of the reader’s needs",
      ],
      misconceptions: ["Formal tone means using the biggest words possible."],
      misconception: "Equating academic tone with dense vocabulary and length.",
      misconceptionDetails: [
        klMisconception({
          misconception: "Sounding smart means sounding complicated.",
          why: "Students associate formality with difficulty.",
          correction:
            "Academic tone prefers precise, plain language and controlled claims — not inflated diction.",
          contrast: "precise plain prose vs jargon padding",
          diagnosticClue: "Thesaurus swaps that obscure meaning",
        }),
      ],
      vocabulary: ["hedging", "register", "formality", "voice", "attitude"],
      prerequisites: ["writing-audience", "writing-purpose"],
      relatedConcepts: ["writing-audience", "writing-purpose", "writing-clarity"],
      relationships: [
        klRel("related_to", "writing-audience", "Audience expectations set acceptable register"),
        klRel("related_to", "writing-purpose", "Purpose chooses urgency vs caution"),
        klRel("related_to", "writing-clarity", "Clear prose carries tone without noise"),
      ],
      procedures: [
        "Name audience and purpose",
        "Read a paragraph aloud for attitude (arrogant, vague, collegial)",
        "Adjust hedges, intensifiers, and address — not just vocabulary",
      ],
      practiceForms: ["revise", "compare", "diagnose"],
      assessmentForms: ["rewrite casual claim for academic audience"],
      difficulty: 2,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "haul-writing",
          label: "Haul Writing",
          unit: "Clarity and tone",
          conceptId: "writing-tone",
        },
      ],
      checkPrompt:
        "Would this tone feel appropriate to your intended reader, or only to you?",
    }),

    klConcept({
      id: "writing-genre-essay",
      title: "Essay genre",
      aliases: [
        "academic essay",
        "essay genre",
        "how to write an essay genre",
        "standard essay structure",
      ],
      definition:
        "An academic essay develops a thesis through introduction, body paragraphs, and conclusion — each move serving analysis rather than mere reportage.",
      explanation:
        "The essay genre expects a controlling claim early, paragraph-level points with evidence and reasoning, and a closing that returns to the claim with earned insight. Structure is a tool, not a five-paragraph cage: use as many body units as the thesis needs. Genre defaults (intro → body → conclusion) still apply across most college essay prompts.",
      purpose: "Teach the default academic essay architecture and its jobs.",
      example:
        "Intro frames context + thesis; each body paragraph advances one subclaim; conclusion synthesizes without repeating the intro verbatim.",
      examples: [
        "Expository essay explains; still needs a focusing thesis, not a topic list",
      ],
      nonExamples: [
        "A chronological dump of notes labeled “essay”",
        "Conclusion that only restates the thesis word-for-word",
      ],
      misconceptions: ["Every essay must be exactly five paragraphs."],
      misconception: "Treating five-paragraph form as the definition of an essay.",
      misconceptionDetails: [
        klMisconception({
          misconception: "Essays are always five paragraphs.",
          why: "Early scaffolding becomes a rule.",
          correction:
            "Five paragraphs is a training wheel. Genre requires thesis-driven development, not a fixed count.",
          contrast: "scaffold length vs genre function",
          diagnosticClue: "Student pads or truncates to hit five",
        }),
      ],
      vocabulary: ["thesis", "introduction", "body paragraph", "conclusion", "development"],
      prerequisites: ["writing-thesis", "writing-structure"],
      relatedConcepts: [
        "writing-introduction",
        "writing-body-paragraph",
        "writing-conclusion",
        "writing-thesis",
      ],
      relationships: [
        klRel("part_of", "writing-structure", "Essay uses intro–body–conclusion architecture"),
        klRel("used_with", "writing-thesis", "Essay is driven by a controlling claim"),
        klRel("used_with", "writing-introduction", "Opens and situates the claim"),
        klRel("used_with", "writing-body-paragraph", "Develops subclaims"),
        klRel("used_with", "writing-conclusion", "Closes with earned insight"),
      ],
      practiceForms: ["outline", "write", "revise"],
      assessmentForms: ["map draft sections to genre jobs"],
      difficulty: 2,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "haul-essay",
          label: "Haul Writing",
          unit: "Essay",
          conceptId: "writing-genre-essay",
        },
      ],
      checkPrompt:
        "Does each section do a genre job (frame, develop, close) — or only fill space?",
    }),

    klConcept({
      id: "writing-genre-argumentative",
      title: "Argumentative essay genre",
      aliases: [
        "argumentative essay",
        "argumentative paper genre",
        "persuasive essay genre",
        "how to write an argumentative essay",
      ],
      definition:
        "An argumentative essay advances a contestable claim, supports it with evidence and reasoning, and addresses opposing views through counterargument and rebuttal.",
      explanation:
        "Genre success is not volume of sources or passion — it is a clear claim chain. Readers should see: what you assert, what supports it, why that support matters, and how you answer the strongest objection. Tone stays fair; straw-manning weakens credibility.",
      purpose: "Encode claim–evidence–counterargument expectations for argumentative papers.",
      example:
        "Claim: late-night dining should expand. Evidence: food-insecurity survey. Reasoning: hunger reduces study persistence. Counter: cost. Rebuttal: targeted hours cost less than attrition.",
      examples: [
        "Body order: strongest supporting points first, then fair counterargument + rebuttal",
      ],
      nonExamples: [
        "One-sided rant with no engagement of objections",
        "Evidence dump without a governing claim",
      ],
      misconceptions: ["Argumentative writing means attacking the other side."],
      misconception: "Confusing argument with hostility or one-sidedness.",
      misconceptionDetails: [
        klMisconception({
          misconception: "Strong argument = harsh tone and dismissing opponents.",
          why: "Debate culture rewards dunking.",
          correction:
            "Strength comes from fair counterargument and evidence-linked rebuttal, not contempt.",
          contrast: "fair engagement vs straw man",
          diagnosticClue: "Opponent’s view is caricatured in one sentence",
        }),
      ],
      vocabulary: ["claim", "evidence", "counterargument", "rebuttal", "warrant"],
      prerequisites: ["writing-argument", "writing-claim"],
      relatedConcepts: [
        "writing-claim",
        "writing-evidence",
        "writing-counterargument",
        "writing-rebuttal",
      ],
      relationships: [
        klRel("used_with", "writing-claim", "Governing and supporting assertions"),
        klRel("used_with", "writing-evidence", "Support for claims"),
        klRel("used_with", "writing-counterargument", "Anticipates objections"),
        klRel("related_to", "writing-argument", "Genre instantiates argument structure"),
        klRel("specializes", "writing-genre-essay", "Argumentative is an essay subtype"),
      ],
      practiceForms: ["outline", "write", "revise"],
      assessmentForms: ["check claim–evidence–counter–rebuttal coverage"],
      difficulty: 3,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "haul-argumentative",
          label: "Haul Writing",
          unit: "Argumentative Paper",
          conceptId: "writing-genre-argumentative",
        },
      ],
      checkPrompt:
        "Where is your strongest objection stated fairly — and how do you answer it?",
    }),

    klConcept({
      id: "writing-genre-compare-contrast",
      title: "Compare and contrast essay genre",
      aliases: [
        "compare and contrast essay",
        "comparison essay",
        "compare/contrast genre",
        "similarities and differences essay",
      ],
      definition:
        "A compare-and-contrast essay organizes meaningful similarities and differences to support an analytical claim — not a neutral inventory of traits.",
      explanation:
        "Point-by-point or block organization both work if criteria stay consistent. The thesis should say what the comparison reveals (significance), not merely that two things are “alike and different.” Analysis ranks and interprets differences; laundry lists do not.",
      purpose: "Teach organization and analysis expectations for comparison writing.",
      example:
        "Thesis: “Although both tutoring models raise quiz scores, peer tutoring improves persistence more because it reduces help-seeking stigma.” Then compare on criteria: access, feedback quality, persistence.",
      examples: [
        "Point-by-point: criterion 1 for A/B, criterion 2 for A/B…",
        "Block: all of A, then all of B with mirrored criteria",
      ],
      nonExamples: [
        "Two summaries side by side with no shared criteria",
        "Thesis: “There are many similarities and differences”",
      ],
      misconceptions: ["Compare/contrast means list every possible difference."],
      misconception: "Treating comparison as exhaustive listing instead of criterion-based analysis.",
      misconceptionDetails: [
        klMisconception({
          misconception: "I should mention every similarity and difference I notice.",
          why: "Completeness feels like thoroughness.",
          correction:
            "Select criteria that serve the thesis; omit trivia that doesn’t change the claim.",
          contrast: "criterion-driven comparison vs trait dump",
          diagnosticClue: "Paragraphs of trivia with no so-what",
        }),
      ],
      vocabulary: ["criteria", "point-by-point", "block method", "significance"],
      prerequisites: ["writing-organization", "writing-analysis"],
      relatedConcepts: ["writing-organization", "writing-analysis", "writing-thesis"],
      relationships: [
        klRel("used_with", "writing-organization", "Point-by-point or block structure"),
        klRel("used_with", "writing-analysis", "Comparison must interpret significance"),
        klRel("related_to", "writing-thesis", "Thesis states what comparison reveals"),
        klRel("specializes", "writing-genre-essay", "Comparison is an essay subtype"),
      ],
      practiceForms: ["outline", "compare", "revise"],
      assessmentForms: ["choose organization; justify criteria against thesis"],
      difficulty: 2,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "haul-compare-contrast",
          label: "Haul Writing",
          unit: "Compare and Contrast",
          conceptId: "writing-genre-compare-contrast",
        },
      ],
      checkPrompt:
        "Do shared criteria drive the comparison, and does the thesis say what those differences mean?",
    }),

    klConcept({
      id: "writing-genre-research",
      title: "Research paper genre",
      aliases: [
        "research paper genre",
        "research essay genre",
        "academic research paper",
        "how to write a research paper genre",
      ],
      definition:
        "A research paper answers a research question by synthesizing credible sources, integrating evidence with citation, and advancing an arguable thesis — not a collage of summaries.",
      explanation:
        "Genre moves: refine a researchable question, evaluate sources, synthesize (put sources in conversation), and cite consistently. The paper still needs a claim; sources are tools, not the argument itself. Avoid inventing citation style details — follow the assigned guide.",
      purpose: "Encode research-question → source → synthesis → citation expectations.",
      example:
        "Question: How do late-night food options affect commuting students’ study hours? Thesis answers it; body synthesizes surveys and campus reports with attribution.",
      examples: [
        "Synthesis sentence: “While Rivera emphasizes cost, Chen finds scheduling stigma is the larger barrier — together suggesting…,”",
      ],
      nonExamples: [
        "Annotated bibliography pasted into essay form",
        "One source dominating every paragraph",
      ],
      misconceptions: ["A research paper is a stack of source summaries."],
      misconception: "Confusing source reportage with research argumentation.",
      misconceptionDetails: [
        klMisconception({
          misconception: "If I summarize enough sources, I have a research paper.",
          why: "Research feels like collecting.",
          correction:
            "Summaries are inputs. Synthesis and a thesis that answers the research question are the genre core.",
          contrast: "source collage vs synthesized argument",
          diagnosticClue: "Each paragraph = one source with no cross-talk",
        }),
      ],
      vocabulary: [
        "research question",
        "source evaluation",
        "synthesis",
        "citation",
        "integration",
      ],
      prerequisites: ["writing-research-question", "writing-source"],
      relatedConcepts: [
        "writing-research-question",
        "writing-source",
        "writing-synthesis",
        "writing-citation",
      ],
      relationships: [
        klRel("used_with", "writing-research-question", "Question frames the project"),
        klRel("used_with", "writing-source", "Evidence comes from evaluated sources"),
        klRel("used_with", "writing-synthesis", "Sources must converse under a claim"),
        klRel("used_with", "writing-citation", "Borrowed ideas require attribution"),
        klRel("related_to", "writing-thesis", "Answer to the question becomes the thesis"),
      ],
      practiceForms: ["outline", "synthesize", "cite"],
      assessmentForms: ["trace claim → sources → synthesis moves"],
      difficulty: 3,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "haul-research-paper",
          label: "Haul Writing",
          unit: "Research Paper",
          conceptId: "writing-genre-research",
        },
      ],
      checkPrompt:
        "Does your draft answer a research question with synthesis — or only parade sources?",
    }),

    klConcept({
      id: "writing-genre-analytical",
      title: "Analytical essay genre",
      aliases: [
        "analytical essay",
        "analysis essay genre",
        "critical analysis essay",
        "how to write an analytical essay",
      ],
      definition:
        "An analytical essay interprets how a text, data set, or phenomenon works — advancing claims about meaning, mechanism, or significance rather than retelling content.",
      explanation:
        "Analysis asks “how / why / so what?” Summary answers “what happened / what does it say?” Genre success depends on staying on the interpretive side: use brief paraphrase or quotation as evidence, then explain patterns, assumptions, and implications. Pair with analysis-vs-summary training when drafts slide into plot or paraphrase.",
      purpose: "Set genre expectations for interpretive, claim-driven analysis papers.",
      example:
        "Instead of retelling a chapter, claim: “The narrator’s repeated weather metaphors undercut the novel’s surface optimism by linking hope to instability.”",
      examples: [
        "Data analysis essay: interpret what a trend implies for the research question, not only report the numbers",
      ],
      nonExamples: [
        "Extended plot summary labeled “analysis”",
        "Quotation sandwiches with no interpretive follow-through",
      ],
      misconceptions: ["Analysis means summarizing in my own words."],
      misconception: "Treating paraphrase as analysis.",
      misconceptionDetails: [
        klMisconception({
          misconception: "If I put it in my own words, I’m analyzing.",
          why: "Paraphrase feels like intellectual work.",
          correction:
            "Paraphrase restates; analysis interprets significance, method, or effect relative to a claim.",
          contrast: "restatement vs interpretation",
          diagnosticClue: "No sentence answers “so what?” after evidence",
        }),
      ],
      vocabulary: ["interpretation", "significance", "pattern", "mechanism", "close reading"],
      prerequisites: ["writing-analysis", "writing-analysis-vs-summary"],
      relatedConcepts: [
        "writing-analysis",
        "writing-analysis-vs-summary",
        "writing-evidence",
        "writing-thesis",
      ],
      relationships: [
        klRel("used_with", "writing-analysis", "Core move of the genre"),
        klRel(
          "related_to",
          "writing-analysis-vs-summary",
          "Genre fails when summary displaces analysis",
        ),
        klRel("used_with", "writing-evidence", "Brief evidence anchors interpretation"),
        klRel("specializes", "writing-genre-essay", "Analytical is an essay subtype"),
      ],
      practiceForms: ["analyze", "revise", "diagnose"],
      assessmentForms: ["mark summary vs analysis sentences in a draft"],
      difficulty: 3,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "haul-analytical",
          label: "Haul Writing",
          unit: "Analytical Essay",
          conceptId: "writing-genre-analytical",
        },
      ],
      checkPrompt:
        "After each piece of evidence, do you interpret how/why it matters — or only restate it?",
    }),

    klConcept({
      id: "writing-evidence-vs-analysis",
      title: "Evidence vs analysis",
      aliases: [
        "evidence versus analysis",
        "evidence vs analysis",
        "quote then explain",
        "evidence speaks for itself",
      ],
      definition:
        "Evidence is the support you present (data, quotation, example); analysis is the interpretive work that shows how that support warrants your claim.",
      explanation:
        "Readers do not automatically draw your conclusion from a quote or statistic. After presenting evidence, name the link: what does it show, what it does not show, and how it advances the paragraph claim. Leaving evidence “to speak for itself” is a common failure mode across essay genres.",
      purpose: "Keep support and interpretation distinct and both present.",
      example:
        "Evidence: “40% of night students skip dinner.” Analysis: “That rate suggests food access — not motivation alone — constrains evening study blocks, supporting the claim for extended dining hours.”",
      examples: [
        "Quotation + one sentence of setup is incomplete; add interpretation tied to the topic sentence",
      ],
      nonExamples: [
        "Paragraph that ends on a citation with no follow-up",
        "Analysis with no concrete support (“Clearly society fails…”)",
      ],
      misconceptions: ["Good evidence makes analysis unnecessary."],
      misconception: "Believing evidence speaks for itself.",
      misconceptionDetails: [
        klMisconception({
          misconception: "If the quote/statistic is strong, I don’t need to explain it.",
          why: "The meaning feels obvious to the writer.",
          correction:
            "Readers need the warrant made explicit. Analysis shows how evidence supports this claim.",
          contrast: "evidence alone vs evidence + interpretive link",
          diagnosticClue: "Paragraph ends immediately after a citation",
        }),
      ],
      vocabulary: ["warrant", "interpret", "support", "so what", "link"],
      prerequisites: ["writing-evidence", "writing-analysis"],
      relatedConcepts: ["writing-evidence", "writing-analysis", "writing-reasoning"],
      relationships: [
        klRel(
          "contrasts_with",
          "writing-evidence",
          "Highlights support material vs interpretive work",
        ),
        klRel(
          "contrasts_with",
          "writing-analysis",
          "Highlights interpretive work vs support material",
        ),
        klRel("related_to", "writing-evidence", "One side of the pair"),
        klRel("related_to", "writing-analysis", "Other side of the pair"),
        klRel("related_to", "writing-reasoning", "Reasoning supplies the warrant"),
      ],
      practiceForms: ["diagnose", "revise", "compare"],
      assessmentForms: ["insert analysis after bare evidence"],
      difficulty: 2,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "haul-writing",
          label: "Haul Writing",
          unit: "Evidence and analysis",
          conceptId: "writing-evidence-vs-analysis",
        },
      ],
      checkPrompt:
        "Does every piece of evidence have an explicit sentence showing how it supports your claim?",
    }),

    klConcept({
      id: "writing-proofreading",
      title: "Proofreading",
      aliases: [
        "proofreading writing",
        "proofread a paper",
        "final proofread",
        "catching typos",
      ],
      definition:
        "Proofreading is the last surface check for typos, missing words, formatting glitches, and residual mechanics after revision and editing.",
      explanation:
        "Proofreading ≠ revision (ideas/structure) and ≠ full editing (clarity, style, grammar passes). It is a narrow final sweep when content is frozen: names, numbers, headings, spacing, homophones, and leftover typos. Doing “proofreading” first wastes effort on text you may cut.",
      purpose: "Separate the final correctness sweep from revision and editing.",
      example:
        "After restructuring and clarity edits, read backward sentence-by-sentence to catch “their/there” and duplicated words.",
      examples: [
        "Check that every figure/table mentioned exists and is labeled",
        "Verify running head / page numbers only if the assignment requires them",
      ],
      nonExamples: [
        "Calling a thesis rewrite “proofreading”",
        "Only running spellcheck and skipping a human pass",
      ],
      misconceptions: ["Proofreading is the same as revising or editing."],
      misconception: "Collapsing proofreading with revision and editing.",
      misconceptionDetails: [
        klMisconception({
          misconception: "Proofreading means fixing the whole draft — ideas included.",
          why: "Everyday speech uses the words interchangeably.",
          correction:
            "Revise meaning and structure first, edit for clarity/grammar, then proofread for residual surface errors.",
          contrast: "revision → editing → proofreading order",
          diagnosticClue: "Student “proofreads” by rewriting the argument mid-pass",
        }),
      ],
      vocabulary: ["surface error", "typo", "final pass", "mechanics"],
      prerequisites: ["writing-editing"],
      relatedConcepts: ["writing-revision", "writing-editing", "writing-clarity"],
      relationships: [
        klRel(
          "contrasts_with",
          "writing-revision",
          "Final surface check vs global rethinking",
        ),
        klRel(
          "contrasts_with",
          "writing-editing",
          "Last typo/format sweep vs broader language polish",
        ),
        klRel("depends_on", "writing-editing", "Proofread after editing freezes content"),
      ],
      procedures: [
        "Freeze content after revision and editing",
        "Change format or read aloud / backward to break familiarity",
        "Scan for one error type at a time (homophones, punctuation, names)",
      ],
      practiceForms: ["edit", "identify"],
      assessmentForms: ["sort tasks into revise / edit / proofread"],
      difficulty: 1,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "haul-writing",
          label: "Haul Writing",
          unit: "Proofreading",
          conceptId: "writing-proofreading",
        },
      ],
      checkPrompt:
        "Are you still changing ideas or structure, or only catching leftover surface errors?",
    }),

    klConcept({
      id: "writing-genre-discussion-post",
      title: "Discussion post genre",
      aliases: [
        "discussion post writing",
        "discussion board post",
        "forum post academic",
        "online discussion response",
      ],
      definition:
        "A discussion post is a short academic contribution that states a clear claim, supports it with evidence, and shows reasoning — often responding to peers or a prompt under length limits.",
      explanation:
        "Informality of the platform does not remove academic moves. Strong posts lead with a point, cite or paraphrase course material briefly, explain the link, and (when required) engage another post specifically. Avoid pure agreement (“I agree!”) without adding a claim or evidence.",
      purpose: "Teach claim–evidence–reasoning in short asynchronous posts.",
      example:
        "Claim: peer review works better with rubrics. Evidence: this week’s article on feedback specificity. Reasoning: vague praise doesn’t change drafts; criteria-focused comments do.",
      examples: [
        "Reply that names a peer’s claim, adds a contrasting source, and explains the implication",
      ],
      nonExamples: [
        "“Great post!” with no substance",
        "Long summary of the reading with no stance",
      ],
      misconceptions: ["Discussion posts are casual opinions only."],
      misconception: "Treating forum tone as permission to skip evidence and reasoning.",
      misconceptionDetails: [
        klMisconception({
          misconception: "It’s just a discussion board, so I can vent without support.",
          why: "Informal UI signals low stakes.",
          correction:
            "Course posts still need a claim, evidence (often from the reading), and reasoning — briefly.",
          contrast: "unsupported opinion vs mini-argument",
          diagnosticClue: "Post is all feeling, no reference to materials",
        }),
      ],
      vocabulary: ["claim", "evidence", "reasoning", "reply", "engagement"],
      prerequisites: ["writing-claim", "writing-evidence"],
      relatedConcepts: ["writing-claim", "writing-evidence", "writing-reasoning", "writing-tone"],
      relationships: [
        klRel("used_with", "writing-claim", "Post needs a clear point"),
        klRel("used_with", "writing-evidence", "Support from readings or data"),
        klRel("used_with", "writing-reasoning", "Link evidence to the claim"),
        klRel("related_to", "writing-tone", "Collegial but still academic register"),
      ],
      practiceForms: ["write", "revise", "reply"],
      assessmentForms: ["score post for claim / evidence / reasoning presence"],
      difficulty: 2,
      completeness: "teachable",
      curriculumMappings: [
        {
          curriculumId: "haul-writing",
          label: "Haul Writing",
          unit: "Discussion Post",
          conceptId: "writing-genre-discussion-post",
        },
      ],
      checkPrompt:
        "Can a reader find your claim, your evidence, and your reasoning in a short scan?",
    }),

    klConcept({
      id: "writing-genre-professional-email",
      title: "Professional email genre",
      aliases: [
        "professional email writing",
        "how to write a professional email",
        "formal email",
        "email to professor or manager",
      ],
      definition:
        "A professional email achieves a clear purpose for a specific audience with concise structure, respectful tone, and actionable requests.",
      explanation:
        "Lead with purpose in the subject line and first sentence. Give only necessary context, state the ask, and close with courtesy and contact info if needed. Audience and purpose drive formality; clarity beats flourish. Avoid burying the request or dumping emotion without a next step.",
      purpose: "Teach purpose–audience–clarity for workplace and academic email.",
      example:
        "Subject: Extension request — HIST 210 paper (May 3). Opening: purpose. Body: brief reason + proposed new date. Close: thanks + availability.",
      examples: [
        "Follow-up email restates the ask and prior date, not the entire history",
      ],
      nonExamples: [
        "Novel-length backstory before the request",
        "Subject line “Hey” or blank",
      ],
      misconceptions: ["Professional email must sound stiff and over-formal."],
      misconception: "Equating professionalism with ornate or apologetic padding.",
      misconceptionDetails: [
        klMisconception({
          misconception: "I should write as formally and lengthily as possible.",
          why: "Fear of sounding rude.",
          correction:
            "Professional = clear purpose, respectful tone, and concise actionable content — not maximum formality.",
          contrast: "clear ask vs padded ritual language",
          diagnosticClue: "Three paragraphs before the request appears",
        }),
      ],
      vocabulary: ["subject line", "ask", "audience", "concision", "register"],
      prerequisites: ["writing-purpose", "writing-audience"],
      relatedConcepts: ["writing-purpose", "writing-audience", "writing-clarity", "writing-tone"],
      relationships: [
        klRel("used_with", "writing-purpose", "Email must do one primary job"),
        klRel("used_with", "writing-audience", "Register and detail level follow reader"),
        klRel("used_with", "writing-clarity", "Buried asks fail the genre"),
        klRel("related_to", "writing-tone", "Respectful, direct tone fits professional email"),
      ],
      procedures: [
        "Write subject that names the purpose",
        "First sentence: why you are writing",
        "Middle: minimal context + clear ask + deadline if any",
        "Close: thanks + signature",
      ],
      practiceForms: ["write", "revise"],
      assessmentForms: ["rewrite buried-ask email for clarity"],
      difficulty: 1,
      completeness: "teachable",
      curriculumMappings: [
        {
          curriculumId: "haul-writing",
          label: "Haul Writing",
          unit: "Professional Email",
          conceptId: "writing-genre-professional-email",
        },
      ],
      checkPrompt:
        "Could the recipient know your purpose and next step from the subject + first two sentences?",
    }),

    klConcept({
      id: "writing-genre-lab-report",
      title: "Lab report genre",
      aliases: [
        "lab report genre",
        "scientific lab report",
        "lab report sections",
        "lab writing genre",
      ],
      definition:
        "A lab report documents a question or hypothesis, methods, results, and analysis so a reader can evaluate what was tested and what the results imply.",
      explanation:
        "Genre sections (often intro, methods, results, discussion) separate observation from interpretation. The research question or hypothesis frames the work; analysis explains whether results support the prediction and what limitations matter. Do not invent discipline-specific formatting rules here — follow the course template.",
      purpose: "Encode hypothesis / research-question / analysis expectations for lab writing.",
      example:
        "Hypothesis: light intensity increases germination rate. Results table reports counts; discussion analyzes whether data support the hypothesis and notes confounders.",
      examples: [
        "Clear methods so another student could roughly replicate the procedure",
      ],
      nonExamples: [
        "Discussion that only restates the results table",
        "Hypothesis written as a vague hope (“plants will do better”)",
      ],
      misconceptions: ["The discussion section just repeats the results."],
      misconception: "Collapsing results reportage with interpretive analysis.",
      misconceptionDetails: [
        klMisconception({
          misconception: "Discussion means restating the numbers in sentences.",
          why: "Results feel like the whole story.",
          correction:
            "Results report what happened; discussion/analysis interprets support for the hypothesis, error sources, and implications.",
          contrast: "results restatement vs interpretive discussion",
          diagnosticClue: "Discussion has no reference to hypothesis or limitations",
        }),
      ],
      vocabulary: ["hypothesis", "research question", "methods", "results", "discussion"],
      prerequisites: ["writing-hypothesis", "writing-research-question"],
      relatedConcepts: [
        "writing-hypothesis",
        "writing-research-question",
        "writing-analysis",
        "writing-conclusion",
      ],
      relationships: [
        klRel("used_with", "writing-hypothesis", "Predictive claim under test"),
        klRel("used_with", "writing-research-question", "Frames what the lab investigates"),
        klRel("used_with", "writing-analysis", "Interprets results against the hypothesis"),
        klRel(
          "related_to",
          "writing-conclusion",
          "Closing addresses support/limits of findings",
        ),
      ],
      practiceForms: ["outline", "write", "analyze"],
      assessmentForms: ["separate results sentences from discussion sentences"],
      difficulty: 2,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "haul-writing",
          label: "Haul Writing",
          unit: "Lab Report",
          conceptId: "writing-genre-lab-report",
        },
      ],
      checkPrompt:
        "Does your discussion interpret support for the hypothesis — or only restate results?",
    }),
  ],
};

registerInstructionalPack(WRITING_GENRES_PACK);
