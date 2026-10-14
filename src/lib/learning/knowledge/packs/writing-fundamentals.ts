/**
 * Knowledge pack: Writing fundamentals (Study Haul writing).
 * Canonical instructional knowledge for academic writing — not a course pack.
 */

import type { InstructionalKnowledgePack } from "@/lib/learning/knowledge/instructional-library";
import { registerInstructionalPack } from "@/lib/learning/knowledge/instructional-library";
import {
  klConcept,
  klMisconception,
  klRel,
} from "@/lib/learning/knowledge/packs/helpers";

export const WRITING_FUNDAMENTALS_CONCEPT_IDS = [
  "writing-purpose",
  "writing-audience",
  "writing-structure",
  "writing-clarity",
  "writing-coherence",
  "writing-thesis",
  "writing-claim",
  "writing-introduction",
  "writing-body-paragraph",
  "writing-topic-sentence",
  "writing-evidence",
  "writing-reasoning",
  "writing-analysis",
  "writing-summary",
  "writing-analysis-vs-summary",
  "writing-paraphrase",
  "writing-argument",
  "writing-counterargument",
  "writing-rebuttal",
  "writing-conclusion",
  "writing-organization",
  "writing-transitions",
  "writing-revision",
  "writing-editing",
  "writing-research-question",
  "writing-source",
  "writing-synthesis",
  "writing-citation",
  "writing-evidence-integration",
  "writing-hypothesis",
] as const;

export const WRITING_FUNDAMENTALS_PACK: InstructionalKnowledgePack = {
  id: "writing-fundamentals",
  match: [
    "writing fundamentals",
    "academic writing",
    "essay writing",
    "teach me how to write an essay",
    "how to write an essay",
    "how to write a thesis",
    "thesis statement",
    "how to write an argumentative paper",
    "argumentative writing",
    "how to paraphrase",
    "paraphrasing",
    "analysis vs summary",
    "how to write a research paper",
    "research paper writing",
    "how to revise",
    "revision vs editing",
    "lab report writing",
    "research writing",
    "writing improvement",
    "improve my writing",
    "body paragraph",
    "topic sentence",
    "counterargument",
    "how to write a conclusion",
    "integrating evidence",
    "writing clarity",
    "teach me writing",
    "intro to writing",
  ],
  domain: "writing",
  subject: "writing",
  displayTitle: "Writing fundamentals",
  learningFrame:
    "Academic writing: purpose and audience, thesis and claims, evidence and analysis, argument moves, research integration, and revision vs editing.",
  cheatSheet:
    "Purpose/Audience → Thesis/Claim → Intro → Body (topic→evidence→reasoning) → Analysis ≠ Summary → Argument/Counter/Rebuttal → Conclusion → Revise then Edit",
  concepts: [
    klConcept({
      id: "writing-purpose",
      title: "Writing purpose",
      aliases: ["purpose of writing", "why am I writing", "rhetorical purpose"],
      definition:
        "Writing purpose is the job the text must do for a reader — inform, argue, explain, reflect, persuade, or document.",
      explanation:
        "Name what success looks like before drafting: Should the reader accept a claim, follow a method, or understand a process? Purpose controls genre, tone, and evidence load. It is not the topic pasted into the intro — it is the communicative aim within the prompt.",
      purpose: "Anchor structural and stylistic choices to a clear aim.",
      example:
        "Purpose: persuade that campus dining should expand late-night options — so the draft prioritizes claims, evidence, and rebuttal.",
      examples: [
        "Lab report purpose: document methods and results so another student could evaluate the investigation.",
      ],
      nonExamples: [
        "Writing until you hit the page count without deciding what the reader should take away",
      ],
      misconceptions: ["Purpose is not the same as the topic."],
      misconception: "Treating the topic (“social media”) as the purpose.",
      misconceptionDetails: [
        klMisconception({
          misconception: "My purpose is whatever the topic is.",
          why: "Prompts name topics first, so students stop there.",
          correction:
            "Topic is the subject area; purpose is the reader outcome (argue, explain, evaluate, document).",
          contrast: "topic (what about) vs purpose (what for)",
          diagnosticClue: "Student says “my purpose is climate change”",
        }),
      ],
      vocabulary: ["aim", "genre", "rhetorical purpose", "reader outcome"],
      relatedConcepts: ["writing-audience", "writing-structure", "writing-argument"],
      relationships: [
        klRel("related_to", "writing-audience", "Purpose and audience co-define the rhetorical situation"),
        klRel("leads_to", "writing-structure", "Purpose shapes organization"),
        klRel("used_with", "writing-argument", "Argumentative purpose needs claim–evidence structure"),
      ],
      procedures: [
        "Underline the verb in the prompt (argue, compare, analyze, report)",
        "Write: “When finished, the reader should ___.”",
        "Check each section against that sentence",
      ],
      transferPrompts: [
        "Same topic (sleep): rewrite the purpose for a lab report vs an opinion column.",
      ],
      workedExamples: [
        "Prompt “Discuss remote learning” → purpose: argue that hybrid schedules improve equity for commuting students.",
      ],
      practiceForms: ["identify", "explain", "revise"],
      assessmentForms: ["state purpose in one sentence", "match purpose to genre"],
      difficulty: 1,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "writing-improvement",
          label: "Writing improvement",
          unit: "Rhetorical situation",
          conceptId: "writing-purpose",
        },
      ],
      checkPrompt: "In one sentence, what should your reader be able to do after reading?",
    }),

    klConcept({
      id: "writing-audience",
      title: "Writing audience",
      aliases: ["audience awareness", "who is my reader", "reader expectations"],
      definition:
        "Audience is the intended reader(s) whose knowledge, values, and needs shape diction, evidence, and explanation depth.",
      explanation:
        "Write for a specific reader: peers, instructor, public, or specialists. Audience decides which terms you define and what counts as convincing evidence. Imagining “anyone” produces vague prose that satisfies no one.",
      purpose: "Match explanation level and evidence type to the reader.",
      example:
        "Explaining HTTPS to a manager: skip cipher suites; emphasize trust and risk — define acronyms once.",
      examples: ["Lab instructor expects methods detail a classmate might omit."],
      nonExamples: ["Dumping jargon because “it sounds academic”"],
      misconceptions: ["Audience is not only the instructor’s grading rubric."],
      misconception: "Writing only to impress, not to inform the named reader.",
      misconceptionDetails: [
        klMisconception({
          misconception: "My only audience is the teacher grading me.",
          why: "Grades are salient; rhetorical audience feels abstract.",
          correction:
            "Instructors often evaluate how well you write for the assignment’s intended audience.",
          contrast: "grader (evaluator) vs audience (intended reader)",
          diagnosticClue: "Draft never defines terms or stakes for anyone but “the teacher”",
        }),
      ],
      vocabulary: ["reader knowledge", "register", "expectations"],
      relatedConcepts: ["writing-purpose", "writing-clarity", "writing-evidence"],
      relationships: [
        klRel("related_to", "writing-purpose", "Together they form the rhetorical situation"),
        klRel("used_with", "writing-clarity", "Audience-aware clarity chooses what to define"),
        klRel("related_to", "writing-evidence", "Different audiences weigh evidence differently"),
      ],
      transferPrompts: [
        "Rewrite one paragraph of a research claim for a classmate vs a city council.",
      ],
      procedures: [
        "Name the primary reader in one phrase",
        "List 2 things they know and 2 they likely don’t",
        "Adjust definitions and examples",
      ],
      practiceForms: ["revise", "compare", "scenario"],
      assessmentForms: ["adapt tone for audience", "identify mismatched jargon"],
      difficulty: 1,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "writing-improvement",
          label: "Writing improvement",
          unit: "Rhetorical situation",
          conceptId: "writing-audience",
        },
      ],
      checkPrompt: "Who is your primary reader, and what do they already know?",
    }),

    klConcept({
      id: "writing-structure",
      title: "Writing structure",
      aliases: ["essay structure", "paper structure", "text structure"],
      definition:
        "Structure is the ordered arrangement of sections and moves that help a reader follow the purpose from opening to close.",
      explanation:
        "Structure is more than “intro–body–conclusion.” Each section has a job: frame, develop claims with evidence, address objections, close. Weak structure shows repeated ideas, buried theses, or paragraphs that don’t advance the claim. Don’t force a five-paragraph mold onto research writing.",
      purpose: "Give the reader a reliable path through your ideas.",
      example:
        "Argumentative: introduction with thesis → body with evidence → counterargument → rebuttal → conclusion.",
      examples: [
        "Research paper: research question → context → thesis → synthesis → conclusion",
      ],
      nonExamples: ["Five identical paragraphs that restate the prompt"],
      misconceptions: ["Every academic paper must be exactly five paragraphs."],
      misconception: "Treating the five-paragraph essay as a universal rule.",
      misconceptionDetails: [
        klMisconception({
          misconception: "Good essays always have five paragraphs.",
          why: "Early schooling used a fixed scaffold.",
          correction:
            "Five paragraphs can train basics; college writing uses as many sections as purpose and evidence require.",
          contrast: "scaffold (training) vs structure (reader logic)",
          diagnosticClue: "Student pads or truncates to hit exactly five",
        }),
      ],
      vocabulary: ["section", "move", "scaffold", "genre structure"],
      prerequisites: ["writing-purpose"],
      relatedConcepts: [
        "writing-organization",
        "writing-introduction",
        "writing-body-paragraph",
        "writing-conclusion",
      ],
      relationships: [
        klRel("contains", "writing-introduction", "Opening frame and thesis placement"),
        klRel("contains", "writing-body-paragraph", "Developmental units"),
        klRel("contains", "writing-conclusion", "Closing move"),
        klRel("related_to", "writing-organization", "Organization sequences the parts"),
        klRel("depends_on", "writing-purpose", "Structure follows purpose"),
      ],
      procedures: [
        "Outline section jobs before drafting sentences",
        "Place the thesis where the genre expects it",
        "Cut sections that don’t advance purpose",
      ],
      transferPrompts: [
        "Map structure for an essay vs a lab report on the same experiment topic.",
      ],
      practiceForms: ["outline", "revise", "compare"],
      assessmentForms: ["label section jobs", "repair a scrambled outline"],
      difficulty: 2,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "academic-essay",
          label: "Academic essay",
          unit: "Structure",
          conceptId: "writing-structure",
        },
      ],
      checkPrompt: "What job does each major section of your draft do?",
    }),

    klConcept({
      id: "writing-clarity",
      title: "Writing clarity",
      aliases: ["clear writing", "clarity in writing", "write clearly"],
      definition:
        "Clarity means the reader can recover your intended meaning on the first careful read without guessing.",
      explanation:
        "Clear writing uses precise nouns and verbs, controlled sentence length, and defined key terms. Ambiguous pronouns and overloaded sentences force rereading. Clarity is not dumbing down — define necessary terms once, then use them consistently.",
      purpose: "Reduce friction between your idea and the reader’s understanding.",
      example:
        "Unclear: “This shows the importance of the issue.” Clear: “Rising late-bus cancellations cut study time for off-campus students.”",
      examples: ["Replace “utilize the aforementioned methodology” with “use this method.”"],
      nonExamples: ["Longer words used only to sound academic"],
      misconceptions: ["Clarity means never using technical terms."],
      misconception: "Avoiding necessary terms instead of defining them once.",
      misconceptionDetails: [
        klMisconception({
          misconception: "Clear writing can’t use technical vocabulary.",
          why: "Students confuse clarity with oversimplification.",
          correction:
            "Define necessary terms early; then use them consistently. Unclear writing hides meaning — not complexity.",
          contrast: "jargon dump vs defined precision",
          diagnosticClue: "Student replaces accurate terms with vague everyday words",
        }),
      ],
      vocabulary: ["precision", "ambiguity", "concision"],
      relatedConcepts: ["writing-coherence", "writing-editing", "writing-audience"],
      relationships: [
        klRel("related_to", "writing-coherence", "Sentence clarity supports whole-text flow"),
        klRel("used_with", "writing-editing", "Editing pass targets clarity defects"),
        klRel("depends_on", "writing-audience", "What is clear depends on the reader"),
      ],
      procedures: [
        "Circle vague pronouns and name the referent",
        "Put the main actor and action early in key sentences",
        "Cut empty intensifiers (very, really, basically)",
      ],
      transferPrompts: ["Clarify a muddy thesis without changing its stance."],
      practiceForms: ["revise", "identify"],
      assessmentForms: ["rewrite unclear sentence", "spot ambiguous this/it"],
      difficulty: 2,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "writing-improvement",
          label: "Writing improvement",
          unit: "Style",
          conceptId: "writing-clarity",
        },
      ],
      checkPrompt: "Where might a careful reader have to guess what you mean?",
    }),

    klConcept({
      id: "writing-coherence",
      title: "Writing coherence",
      aliases: ["coherence", "logical flow", "coherent writing"],
      definition:
        "Coherence is the sense that sentences and paragraphs connect logically so the whole text advances one developing idea.",
      explanation:
        "Coherence comes from consistent focus, deliberate order, and real relationships among ideas. Transitions help, but they cannot paper over unordered points. Incoherence feels like “jumping around” even when individual sentences are fine.",
      purpose: "Help the reader track how ideas relate as the text progresses.",
      example:
        "After evidence about bus cancellations, interpret impact on study time — don’t switch to cafeteria prices.",
      examples: ["Keep one controlling idea per paragraph; move side points elsewhere."],
      nonExamples: ["Adding “Furthermore,” before an unrelated sentence"],
      misconceptions: ["Transitions alone create coherence."],
      misconception: "Sprinkling transition words instead of fixing idea order.",
      misconceptionDetails: [
        klMisconception({
          misconception: "If I add transition words, the paper is coherent.",
          why: "Transitions are taught as a quick fix.",
          correction:
            "Transitions label relationships; coherence requires that the ideas actually relate and progress.",
          contrast: "signal words vs logical sequence",
          diagnosticClue: "“However” appears before a sentence that does not contrast",
        }),
      ],
      vocabulary: ["focus", "progression", "controlling idea"],
      relatedConcepts: [
        "writing-clarity",
        "writing-transitions",
        "writing-organization",
        "writing-topic-sentence",
      ],
      relationships: [
        klRel("related_to", "writing-clarity", "Local clarity supports global coherence"),
        klRel("used_with", "writing-transitions", "Transitions signal coherent links"),
        klRel("depends_on", "writing-organization", "Order of points enables coherence"),
        klRel("used_with", "writing-topic-sentence", "Topic sentences stabilize focus"),
      ],
      procedures: [
        "Underline the controlling idea of each paragraph",
        "Ask how each sentence advances that idea",
        "Reorder or split when two ideas compete",
      ],
      transferPrompts: ["Diagnose why a peer draft feels “jumpy” even if grammar is fine."],
      practiceForms: ["revise", "outline", "identify"],
      assessmentForms: ["reorder scrambled sentences", "fix fake transitions"],
      difficulty: 2,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "writing-improvement",
          label: "Writing improvement",
          unit: "Flow",
          conceptId: "writing-coherence",
        },
      ],
      checkPrompt: "How does this paragraph’s last sentence connect to its first?",
    }),

    klConcept({
      id: "writing-thesis",
      title: "Thesis statement",
      aliases: [
        "thesis",
        "how to write a thesis",
        "thesis statement",
        "main claim of essay",
        "central argument",
      ],
      definition:
        "A thesis is a specific, arguable claim — usually one sentence — that the rest of the paper develops and supports.",
      explanation:
        "A strong thesis takes a stance a reasonable person could dispute, scopes the paper, and forecasts reasoning without listing every detail. It is not a topic label (“This paper is about sleep”), an uncontested fact, or a vague preference (“Sleep is important”). Place it near the end of the introduction; revise it as drafting teaches you what you can support.",
      purpose: "Give the paper a defensible controlling claim.",
      example:
        "Strong: “Campus dining should expand late-night options because food insecurity after 8 p.m. reduces study persistence for commuting students.”",
      examples: [
        "Strong: “Although online forums increase access to peer help, unmoderated advice often spreads procedural misconceptions in introductory programming.”",
        "Weak (topic only): “This essay discusses social media and mental health.”",
        "Weak (opinion): “I think social media is bad.”",
        "Weak (fact): “Many students use social media daily.”",
      ],
      nonExamples: [
        "“In this paper I will talk about…” announcements",
        "A three-part list with no unifying claim",
      ],
      misconceptions: [
        "A thesis is not the same as a topic.",
        "A thesis is not merely a personal preference.",
      ],
      misconception: "Confusing the topic with the thesis statement.",
      misconceptionDetails: [
        klMisconception({
          misconception: "My thesis is my topic.",
          why: "Prompts ask “write about X,” so students name X.",
          correction:
            "Topic names the territory; thesis asserts a claim about it that the paper will prove.",
          contrast: "topic (“remote learning”) vs thesis (“hybrid schedules improve equity because…”)",
          diagnosticClue: "Thesis starts with “This paper is about…”",
        }),
        klMisconception({
          misconception: "A thesis is just my opinion.",
          why: "“Argue” feels like preference.",
          correction:
            "Opinion is a starting stance; a thesis is a claim you commit to supporting with reasons and evidence.",
          contrast: "unsupported preference vs supported claim",
          diagnosticClue: "Student refuses to revise thesis after counterevidence",
        }),
        klMisconception({
          misconception: "The thesis must follow one rigid forever-formula.",
          why: "Templates help beginners and get mistaken for rules.",
          correction:
            "One clear sentence is a useful default; formulae are scaffolds, not laws. Complex projects may use a short thesis paragraph.",
          contrast: "scaffold formula vs finished controlling claim",
          diagnosticClue: "Student forces “Although A, B because C, D, and E” even when it muddies the claim",
        }),
      ],
      vocabulary: ["arguable", "scope", "stance", "controlling claim", "forecast"],
      prerequisites: ["writing-purpose"],
      relatedConcepts: [
        "writing-introduction",
        "writing-claim",
        "writing-argument",
        "writing-research-question",
      ],
      relationships: [
        klRel("specializes", "writing-claim", "Thesis is the paper’s overarching claim"),
        klRel("part_of", "writing-introduction", "Usually placed at end of introduction"),
        klRel("leads_to", "writing-argument", "Thesis launches the argumentative project"),
        klRel("related_to", "writing-research-question", "Research questions often mature into theses"),
        klRel("used_with", "writing-conclusion", "Conclusion returns to the thesis with earned insight"),
      ],
      workedExamples: [
        "Topic → opinion → thesis: “Sleep” → “Students should sleep more” → “Required 8 a.m. lectures should be optional for night-shift workers because sleep debt measurably lowers quiz performance.”",
        "Stress-test: ask “Who would disagree, and why?” If no one, sharpen the claim.",
      ],
      procedures: [
        "State topic in 2–4 words",
        "Add a debatable stance",
        "Add a because-clause that sketches reasoning (not filler topic lists)",
        "Check: specific? arguable? matchable to available evidence?",
      ],
      transferPrompts: [
        "Turn a research question into a provisional thesis, then note what evidence would force a revision.",
      ],
      practiceForms: ["write", "revise", "compare", "diagnose"],
      assessmentForms: [
        "rank strong vs weak theses",
        "rewrite topic into thesis",
        "identify topic-vs-thesis error",
      ],
      difficulty: 2,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "academic-essay",
          label: "Academic essay",
          unit: "Thesis",
          conceptId: "writing-thesis",
        },
        {
          curriculumId: "argumentative-writing",
          label: "Argumentative writing",
          unit: "Central claim",
          conceptId: "writing-thesis",
        },
      ],
      checkPrompt:
        "Is your thesis a topic label, a preference, or a specific claim someone could reasonably dispute?",
    }),

    klConcept({
      id: "writing-claim",
      title: "Claim",
      aliases: ["making a claim", "argumentative claim", "assertion"],
      definition:
        "A claim is a debatable assertion that requires support; body paragraphs often advance subclaims under the thesis.",
      explanation:
        "Claims answer “what should we believe?” Evidence without a claim is a data dump; claims without evidence are bare assertions. Keep claims precise enough to test — “policies matter” is too vague.",
      purpose: "State what you want the reader to accept at each stage.",
      example:
        "Claim: “Unmoderated homework forums amplify incorrect debugging advice.” Evidence and reasoning follow.",
      examples: ["Subclaim supporting a thesis about campus transit reliability"],
      nonExamples: ["A quotation standing alone without an assertion about it"],
      misconceptions: ["Claims are not the same as evidence."],
      misconception: "Pasting a statistic and calling it the claim.",
      misconceptionDetails: [
        klMisconception({
          misconception: "The evidence is my claim.",
          why: "Numbers feel authoritative on their own.",
          correction:
            "Evidence supports a claim; the claim is the interpretive assertion you ask the reader to accept.",
          contrast: "data point vs assertion about what the data means",
          diagnosticClue: "Paragraph starts with a quote and never states a point",
        }),
      ],
      vocabulary: ["assertion", "subclaim", "support", "debatable"],
      prerequisites: ["writing-purpose"],
      relatedConcepts: ["writing-thesis", "writing-evidence", "writing-reasoning", "writing-argument"],
      relationships: [
        klRel("generalizes", "writing-thesis", "Thesis is a claim at paper scale"),
        klRel("leads_to", "writing-evidence", "Claims require supporting evidence"),
        klRel("used_with", "writing-reasoning", "Reasoning links claim to evidence"),
        klRel("part_of", "writing-argument", "Arguments are chains of claims"),
      ],
      procedures: [
        "Write the claim in one sentence before choosing quotes",
        "Ask what would count as disconfirmation",
        "Check alignment with the thesis",
      ],
      transferPrompts: ["Turn a floating quotation into a claim + evidence pair."],
      practiceForms: ["identify", "write", "revise"],
      assessmentForms: ["separate claim from evidence", "sharpen a vague claim"],
      difficulty: 2,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "argumentative-writing",
          label: "Argumentative writing",
          unit: "Claims",
          conceptId: "writing-claim",
        },
      ],
      checkPrompt: "What exactly are you asking the reader to believe in this paragraph?",
    }),

    klConcept({
      id: "writing-introduction",
      title: "Introduction",
      aliases: ["essay introduction", "how to write an introduction", "opening paragraph"],
      definition:
        "An introduction orients the reader to the issue, establishes relevance, and typically ends with the thesis.",
      explanation:
        "Move from context to focus: situate the conversation, narrow to the problem, then state the thesis. Avoid dictionary openings and suspense that hides the claim. Hooks work only if they lead to the argument.",
      purpose: "Prepare the reader to understand and evaluate the thesis.",
      example:
        "Brief campus food-access context → problem after 8 p.m. → thesis proposing expanded late-night dining.",
      examples: ["Research intro: motivate the question, then preview the thesis/answer."],
      nonExamples: ["Three paragraphs of background with the thesis never appearing"],
      misconceptions: ["The introduction should keep the thesis secret until the end."],
      misconception: "Hiding the thesis for dramatic effect in academic essays.",
      misconceptionDetails: [
        klMisconception({
          misconception: "I shouldn’t reveal my thesis until the conclusion.",
          why: "Narrative suspense habits transfer from storytelling.",
          correction:
            "Most academic readers want the controlling claim early so they can track support.",
          contrast: "story suspense vs academic forecast",
          diagnosticClue: "Intro ends with a question and never answers it",
        }),
      ],
      vocabulary: ["context", "narrowing", "hook", "forecast"],
      prerequisites: ["writing-purpose", "writing-thesis"],
      relatedConcepts: ["writing-thesis", "writing-structure", "writing-conclusion"],
      relationships: [
        klRel("contains", "writing-thesis", "Thesis usually closes the introduction"),
        klRel("part_of", "writing-structure", "Opening structural move"),
        klRel("leads_to", "writing-body-paragraph", "Intro sets up body development"),
        klRel("related_to", "writing-conclusion", "Intro and conclusion frame the argument"),
      ],
      procedures: [
        "Draft thesis first (even roughly)",
        "Write 2–4 sentences of necessary context only",
        "End with thesis; cut anything that doesn’t lead to it",
      ],
      workedExamples: [
        "Replace “Since the dawn of time…” with a concrete recent stake for the audience.",
      ],
      practiceForms: ["write", "revise"],
      assessmentForms: ["evaluate intro endings", "trim irrelevant hook"],
      difficulty: 2,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "academic-essay",
          label: "Academic essay",
          unit: "Introduction",
          conceptId: "writing-introduction",
        },
      ],
      checkPrompt: "Does your introduction end with a clear thesis the body can support?",
    }),

    klConcept({
      id: "writing-body-paragraph",
      title: "Body paragraph",
      aliases: ["body paragraphs", "paragraph development", "how to write a body paragraph"],
      definition:
        "A body paragraph develops one controlling idea that advances the thesis through a point, support, and analysis — not a rigid universal formula.",
      explanation:
        "Treat a body paragraph as a mini-argument: state a point, offer evidence, explain how evidence supports the point. Models like PEEL/TEA/CER are training wheels, not laws. What must stay constant: focus, support, and reasoning. When a paragraph grows two competing ideas, split it.",
      purpose: "Advance the thesis one coherent step at a time.",
      example:
        "Topic sentence on late-bus impact → cancellation data → analysis linking delays to missed study hours.",
      examples: [
        "Literature paragraph: claim about a motif → textual evidence → analysis of effect → link to thesis",
      ],
      nonExamples: ["A paragraph that is only paraphrase of a textbook section"],
      misconceptions: ["Every paragraph must follow the exact same acronym steps."],
      misconception: "Treating PEEL/CER as an absolute formula rather than a model.",
      misconceptionDetails: [
        klMisconception({
          misconception: "If I don’t follow PEEL exactly, the paragraph is wrong.",
          why: "Scaffolding is taught as the only acceptable shape.",
          correction:
            "Use topic sentence + evidence + analysis as a flexible model; order and emphasis can shift by genre.",
          contrast: "helpful model vs absolute formula",
          diagnosticClue: "Student inserts empty “explanation” sentences to fill slots",
        }),
      ],
      vocabulary: ["controlling idea", "development", "unity", "PEEL", "CER"],
      prerequisites: ["writing-thesis", "writing-claim"],
      childConceptIds: [
        "writing-topic-sentence",
        "writing-evidence",
        "writing-reasoning",
        "writing-analysis",
      ],
      relatedConcepts: [
        "writing-topic-sentence",
        "writing-evidence",
        "writing-analysis",
        "writing-transitions",
      ],
      relationships: [
        klRel("contains", "writing-topic-sentence", "Usually opens with a point"),
        klRel("contains", "writing-evidence", "Supports the point"),
        klRel("contains", "writing-reasoning", "Links evidence to claim"),
        klRel("contains", "writing-analysis", "Interprets significance"),
        klRel("part_of", "writing-structure", "Core developmental unit"),
        klRel("used_with", "writing-transitions", "Connects to neighboring paragraphs"),
      ],
      procedures: [
        "Write the paragraph’s point in one sentence",
        "Select only evidence that bears on that point",
        "Add analysis that answers “so what?”",
        "Cut sentences that serve a different point",
      ],
      workedExamples: [
        "Diagnose a quote-heavy paragraph: add claim and analysis until the quote is no longer doing all the work.",
      ],
      transferPrompts: ["Adapt a body paragraph model for a lab-report analysis section."],
      practiceForms: ["write", "revise", "diagnose"],
      assessmentForms: ["label paragraph parts", "split a double-focus paragraph"],
      difficulty: 2,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "academic-essay",
          label: "Academic essay",
          unit: "Body paragraphs",
          conceptId: "writing-body-paragraph",
        },
      ],
      checkPrompt:
        "What single point does this paragraph prove, and where do you interpret the evidence?",
    }),

    klConcept({
      id: "writing-topic-sentence",
      title: "Topic sentence",
      aliases: ["paragraph topic sentence", "controlling sentence"],
      definition:
        "A topic sentence states the paragraph’s controlling idea — usually a subclaim that supports the thesis.",
      explanation:
        "Readers use topic sentences as signposts. Strong ones are specific enough to guide the paragraph but leave room for development. Weak ones announce (“This paragraph will discuss…”) or stay too broad. Align each topic sentence with the thesis so an outline of topic sentences sketches the argument.",
      purpose: "Focus the paragraph and signal progress to the reader.",
      example:
        "“Late-evening bus cancellations disproportionately disrupt study schedules for off-campus students.”",
      examples: ["Weaker: “Buses are a problem.” Stronger: name who is affected and how."],
      nonExamples: ["A sentence that only names the section title"],
      misconceptions: ["Topic sentences are optional fluff."],
      misconception: "Starting every paragraph with a quotation instead of a point.",
      misconceptionDetails: [
        klMisconception({
          misconception: "I should start with a quote and let it speak for itself.",
          why: "Quotes feel like instant authority.",
          correction: "Lead with your point; then use the quote as support you interpret.",
          contrast: "point-first vs quote-first drift",
          diagnosticClue: "First sentence is always a citation",
        }),
      ],
      vocabulary: ["controlling idea", "subclaim", "signpost"],
      parentConceptId: "writing-body-paragraph",
      prerequisites: ["writing-claim"],
      relatedConcepts: ["writing-body-paragraph", "writing-claim", "writing-coherence"],
      relationships: [
        klRel("part_of", "writing-body-paragraph", "Focuses the paragraph"),
        klRel("specializes", "writing-claim", "Often a paragraph-level claim"),
        klRel("used_with", "writing-coherence", "Stabilizes focus for coherence"),
      ],
      procedures: [
        "Draft the paragraph’s point before evidence",
        "Test: can the rest of the paragraph be about only this sentence?",
      ],
      practiceForms: ["write", "revise", "identify"],
      assessmentForms: ["rewrite weak topic sentences", "match topic sentence to thesis"],
      difficulty: 1,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "academic-essay",
          label: "Academic essay",
          unit: "Paragraph focus",
          conceptId: "writing-topic-sentence",
        },
      ],
      checkPrompt: "What claim does this paragraph’s first sentence make?",
    }),

    klConcept({
      id: "writing-evidence",
      title: "Evidence",
      aliases: ["supporting evidence", "using evidence", "textual evidence"],
      definition:
        "Evidence is material from texts, data, observations, or credible sources used to support a claim.",
      explanation:
        "Evidence can be quotations, paraphrases, statistics, results, or documented examples. Strength depends on relevance, credibility, and sufficiency — not volume. Introduce evidence, then interpret it. A quotation is not automatically persuasive.",
      purpose: "Ground claims in material a reader can evaluate.",
      example:
        "After claiming sleep debt hurts quiz scores, cite a study’s finding and interpret the link to 8 a.m. lectures.",
      examples: ["Lab results table as evidence for whether the hypothesis held"],
      nonExamples: ["A friend’s undocumented rumor presented as fact"],
      misconceptions: ["More quotes automatically mean a stronger paragraph."],
      misconception: "Stacking quotations without selection or commentary.",
      misconceptionDetails: [
        klMisconception({
          misconception: "If I include lots of quotes, my paper is well supported.",
          why: "Quantity feels like diligence.",
          correction:
            "Select the most relevant evidence and analyze it; excess quotes crowd out your reasoning.",
          contrast: "evidence dump vs purposeful support",
          diagnosticClue: "Paragraph is mostly quoted text with little commentary",
        }),
      ],
      vocabulary: ["relevance", "credibility", "sufficiency", "support"],
      prerequisites: ["writing-claim"],
      relatedConcepts: [
        "writing-claim",
        "writing-reasoning",
        "writing-source",
        "writing-evidence-integration",
      ],
      relationships: [
        klRel("depends_on", "writing-claim", "Evidence serves a claim"),
        klRel("leads_to", "writing-reasoning", "Evidence needs reasoning to matter"),
        klRel("related_to", "writing-source", "Sources supply evidence"),
        klRel("used_with", "writing-evidence-integration", "Integration presents evidence smoothly"),
      ],
      procedures: [
        "State the claim",
        "Choose the smallest sufficient evidence",
        "Introduce, present, interpret",
      ],
      transferPrompts: [
        "For the same claim, pick better evidence for a lab report vs an op-ed.",
      ],
      practiceForms: ["select", "integrate", "evaluate"],
      assessmentForms: ["judge relevance", "trim excess quotes"],
      difficulty: 2,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "argumentative-writing",
          label: "Argumentative writing",
          unit: "Evidence",
          conceptId: "writing-evidence",
        },
        {
          curriculumId: "research-writing",
          label: "Research writing",
          unit: "Support",
          conceptId: "writing-evidence",
        },
      ],
      checkPrompt: "What claim does this piece of evidence actually support?",
    }),

    klConcept({
      id: "writing-reasoning",
      title: "Reasoning",
      aliases: ["warrant", "explaining evidence", "claim evidence reasoning"],
      definition:
        "Reasoning is the explanation that shows how evidence supports a claim — the logical bridge often called a warrant.",
      explanation:
        "Readers rarely see why a fact proves your point unless you say so. Reasoning answers: What does this evidence mean here? Without it, paragraphs become “claim + quote + next claim.” Replace empty “This shows that…” with a concrete mechanism.",
      purpose: "Make the link between evidence and claim explicit and evaluable.",
      example:
        "Evidence: 30% evening cancellations. Reasoning: Commuters lose predictable study blocks, so dining access alone won’t fix follow-through without reliable transit.",
      examples: [
        "In literary analysis: explain how a metaphor’s wording produces the effect you claim.",
      ],
      nonExamples: ["“This proves my point” with no mechanism"],
      misconceptions: ["Evidence speaks for itself."],
      misconception: "Assuming the reader will infer the warrant.",
      misconceptionDetails: [
        klMisconception({
          misconception: "If the evidence is strong, I don’t need to explain it.",
          why: "The connection feels obvious to the writer.",
          correction:
            "Your job is to teach the reader the connection; obvious-to-you is not obvious-to-them.",
          contrast: "implied link vs stated warrant",
          diagnosticClue: "Quote ends the paragraph",
        }),
      ],
      vocabulary: ["warrant", "inference", "mechanism"],
      prerequisites: ["writing-claim", "writing-evidence"],
      relatedConcepts: ["writing-claim", "writing-evidence", "writing-analysis", "writing-argument"],
      relationships: [
        klRel("used_with", "writing-claim", "Reasoning defends the claim"),
        klRel("used_with", "writing-evidence", "Reasoning interprets evidence"),
        klRel("related_to", "writing-analysis", "Analysis is reasoning about meaning/significance"),
        klRel("part_of", "writing-argument", "Core argumentative move"),
      ],
      procedures: [
        "After evidence, write “This matters because…”",
        "Name the assumption a skeptic might challenge",
        "Replace empty “this shows” with a concrete mechanism",
      ],
      practiceForms: ["write", "revise", "identify"],
      assessmentForms: ["add warrant to claim+evidence", "spot missing reasoning"],
      difficulty: 2,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "argumentative-writing",
          label: "Argumentative writing",
          unit: "Reasoning",
          conceptId: "writing-reasoning",
        },
      ],
      checkPrompt: "How, exactly, does this evidence support your claim?",
    }),

    klConcept({
      id: "writing-analysis",
      title: "Analysis",
      aliases: ["analytical writing", "analyze", "how to analyze"],
      definition:
        "Analysis interprets meaning, relationships, causes, or implications — it goes beyond restating what a text or dataset says.",
      explanation:
        "Analysis asks how and why: How does word choice create tone? Why might this result have occurred? It is the academic value-add; summary alone rarely fulfills prompts that say “analyze.” Stay tethered to evidence — speculation without grounding is not analysis.",
      purpose: "Generate insight that summary alone cannot provide.",
      example:
        "Not only report that a character lies twice — show how the lies escalate trust breakdown and advance theme.",
      examples: ["Lab analysis: connect anomalous measurements to a procedural limitation."],
      nonExamples: ["Retelling the plot or restating a graph in words only"],
      misconceptions: ["Analysis means adding personal feelings."],
      misconception: "Equating analysis with unsupported opinion.",
      misconceptionDetails: [
        klMisconception({
          misconception: "Analysis is just saying how I feel about the topic.",
          why: "“Response” language blurs with analysis.",
          correction:
            "Analysis interprets evidence with reasons; feelings may appear in reflection genres but do not replace interpretation.",
          contrast: "reaction vs interpretation of evidence",
          diagnosticClue: "Paragraph is mostly “I think it’s sad that…”",
        }),
      ],
      vocabulary: ["interpret", "significance", "implication", "pattern"],
      prerequisites: ["writing-evidence"],
      relatedConcepts: [
        "writing-summary",
        "writing-analysis-vs-summary",
        "writing-reasoning",
        "writing-evidence",
      ],
      relationships: [
        klRel("contrasts_with", "writing-summary", "Interpretation vs restatement"),
        klRel("part_of", "writing-analysis-vs-summary", "One side of the contrast pair"),
        klRel("related_to", "writing-reasoning", "Both explain significance of support"),
        klRel("used_with", "writing-evidence", "Analysis works on evidence"),
      ],
      procedures: [
        "Summarize the evidence in one clause",
        "Ask how/why/so-what questions",
        "Answer with interpretation tied to specifics",
      ],
      transferPrompts: [
        "Take a summary sentence and rewrite it as analysis without adding new facts.",
      ],
      practiceForms: ["compare", "revise", "write"],
      assessmentForms: ["label summary vs analysis", "upgrade summary to analysis"],
      difficulty: 3,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "academic-essay",
          label: "Academic essay",
          unit: "Analysis",
          conceptId: "writing-analysis",
        },
      ],
      checkPrompt: "What insight did you add that a summary of the source would miss?",
    }),

    klConcept({
      id: "writing-summary",
      title: "Summary",
      aliases: ["summarizing", "how to summarize", "restatement"],
      definition:
        "Summary restates the main ideas of a source or passage in condensed form without adding new interpretation.",
      explanation:
        "Good summary is accurate, selective, and proportionate. It is a tool inside larger tasks (context, overview) but is rarely the whole assignment when the prompt asks for analysis or argument. Own words can still be summary.",
      purpose: "Represent another text’s ideas fairly and briefly.",
      example:
        "“Garcia argues that late library hours reduce missed deadlines among first-year commuters.”",
      examples: ["Abstract-style restatement of a study’s aim, method, and main finding"],
      nonExamples: ["A “summary” that quietly argues with the author without signaling analysis"],
      misconceptions: ["Summary is the same as analysis."],
      misconception: "Calling plot retelling or source restatement “analysis.”",
      misconceptionDetails: [
        klMisconception({
          misconception: "If I put it in my own words, it’s analysis.",
          why: "Paraphrase is confused with interpretation.",
          correction:
            "Own words can still be summary. Analysis adds interpretation of how/why/significance.",
          contrast: "paraphrase/summary vs analysis",
          diagnosticClue: "Student says “I analyzed it” but only retells",
        }),
      ],
      vocabulary: ["condense", "main idea", "attribution"],
      relatedConcepts: [
        "writing-analysis",
        "writing-analysis-vs-summary",
        "writing-paraphrase",
      ],
      relationships: [
        klRel("contrasts_with", "writing-analysis", "Restatement vs interpretation"),
        klRel("part_of", "writing-analysis-vs-summary", "Other side of the contrast pair"),
        klRel("related_to", "writing-paraphrase", "Paraphrase often appears inside summary"),
        klRel("used_with", "writing-citation", "Summaries of sources still need attribution"),
      ],
      procedures: [
        "Identify the source’s main claim or finding",
        "Restate without evaluating",
        "Keep central details, not trivia",
      ],
      practiceForms: ["write", "compare", "identify"],
      assessmentForms: ["write accurate summary", "spot commentary smuggled into summary"],
      difficulty: 1,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "academic-essay",
          label: "Academic essay",
          unit: "Summary skills",
          conceptId: "writing-summary",
        },
      ],
      checkPrompt: "Did you restate the source’s ideas, or did you interpret them?",
    }),

    klConcept({
      id: "writing-analysis-vs-summary",
      title: "Analysis vs summary",
      aliases: [
        "analysis vs summary",
        "summary versus analysis",
        "difference between analysis and summary",
      ],
      definition:
        "Summary restates; analysis interprets — college writing usually needs both, with analysis carrying the intellectual load.",
      explanation:
        "Use summary to establish what a source presents; use analysis to explain significance for your claim. Test: if a reader who already knows the source learns nothing new, you are still summarizing. Pair short summary with longer analysis in analytical genres.",
      purpose: "Help writers allocate space correctly between restatement and insight.",
      example:
        "Summary: “The study found a 12% drop in on-time submissions.” Analysis: “That drop concentrated among night-shift students, supporting revised early-morning deadlines.”",
      examples: ["Side-by-side rewrite of the same evidence as summary-only vs analysis-forward"],
      nonExamples: ["Treating summary and analysis as mutually exclusive forever"],
      misconceptions: ["You must never summarize in analytical papers."],
      misconception: "Believing any summary sentence is a failure.",
      misconceptionDetails: [
        klMisconception({
          misconception: "Analytical papers should contain zero summary.",
          why: "Teachers warn against summary-only papers.",
          correction:
            "Brief summary orients the reader; the problem is stopping there. Balance toward interpretation.",
          contrast: "summary-only paper vs summary-as-setup",
          diagnosticClue: "Student deletes all context and confuses the reader",
        }),
      ],
      vocabulary: ["restatement", "interpretation", "balance", "so what"],
      prerequisites: ["writing-summary", "writing-analysis"],
      relatedConcepts: ["writing-analysis", "writing-summary", "writing-paraphrase"],
      relationships: [
        klRel("contains", "writing-analysis", "Interpretive pole"),
        klRel("contains", "writing-summary", "Restatement pole"),
        klRel("contrasts_with", "writing-summary", "Highlights the restatement side"),
        klRel("contrasts_with", "writing-analysis", "Highlights the interpretive side"),
      ],
      workedExamples: [
        "Highlight a peer paragraph: green = summary, blue = analysis; aim for more blue after setup.",
      ],
      transferPrompts: [
        "Convert a plot summary paragraph into an analytical paragraph for a literature prompt.",
      ],
      practiceForms: ["compare", "revise", "label"],
      assessmentForms: ["color-code summary vs analysis", "rewrite summary-heavy paragraph"],
      difficulty: 2,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "academic-essay",
          label: "Academic essay",
          unit: "Analysis vs summary",
          conceptId: "writing-analysis-vs-summary",
        },
        {
          curriculumId: "writing-improvement",
          label: "Writing improvement",
          unit: "Depth",
          conceptId: "writing-analysis-vs-summary",
        },
      ],
      checkPrompt:
        "After a reader who knows the source finishes your paragraph, what new insight remains?",
    }),

    klConcept({
      id: "writing-paraphrase",
      title: "Paraphrase",
      aliases: ["how to paraphrase", "paraphrasing", "putting in my own words"],
      definition:
        "Paraphrase restates a source’s meaning in new wording and sentence structure while preserving accuracy and giving credit.",
      explanation:
        "Paraphrase is meaning-preserving restatement in your voice — not synonym swapping that keeps the original syntax. Read, look away, restate, then check for accuracy and leftover unique phrasing. Poor paraphrase patches a few words and still copies structure; that can be plagiarism. Always cite.",
      purpose: "Integrate source ideas fluently without over-quoting.",
      example:
        "Original: sleep debt impairs working memory. Good: “When students chronically undersleep, their capacity to hold and manipulate information declines (Author, Year).”",
      examples: [
        "Poor: swap “impairs”→“hurts” but keep the same sentence skeleton",
        "Good: rebuild the sentence around your claim while preserving the finding",
      ],
      nonExamples: [
        "Thesaurus substitution that leaves original structure intact",
        "Paraphrase without citation",
      ],
      misconceptions: [
        "Paraphrase is not synonym swapping.",
        "Changing a few words does not make a passage yours.",
      ],
      misconception: "Believing synonym swaps equal paraphrase.",
      misconceptionDetails: [
        klMisconception({
          misconception: "If I change some words, it’s a paraphrase.",
          why: "Surface difference feels like originality.",
          correction:
            "Recast meaning with new structure; then cite. Synonym patches that keep the original skeleton are still too close.",
          contrast: "synonym swap vs meaning-preserving rewrite",
          diagnosticClue: "Source and “paraphrase” align nearly word-for-word with replacements",
        }),
        klMisconception({
          misconception: "Paraphrase doesn’t need a citation.",
          why: "Own words feel like ownership of the idea.",
          correction:
            "You reworded the expression, not the intellectual origin — attribute the idea.",
          contrast: "wording ownership vs idea attribution",
          diagnosticClue: "Ideas from a reading appear with no citation",
        }),
      ],
      vocabulary: ["meaning preservation", "sentence structure", "attribution", "patch writing"],
      prerequisites: ["writing-source"],
      relatedConcepts: [
        "writing-summary",
        "writing-citation",
        "writing-evidence-integration",
        "writing-source",
      ],
      relationships: [
        klRel("related_to", "writing-citation", "Paraphrase still requires credit"),
        klRel("related_to", "writing-summary", "Both restate without copying wording"),
        klRel("used_with", "writing-evidence-integration", "Common integration technique"),
        klRel("related_to", "writing-source", "Always tied to a source’s meaning"),
      ],
      procedures: [
        "Understand the passage fully",
        "Set it aside and restate from memory",
        "Compare: meaning same, wording/structure different?",
        "Cite the source",
      ],
      workedExamples: ["Show poor vs good paraphrase of a two-sentence science finding."],
      practiceForms: ["write", "compare", "diagnose"],
      assessmentForms: ["rank poor vs good paraphrases", "fix patch writing"],
      difficulty: 2,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "research-writing",
          label: "Research writing",
          unit: "Paraphrase",
          conceptId: "writing-paraphrase",
        },
        {
          curriculumId: "writing-improvement",
          label: "Writing improvement",
          unit: "Source use",
          conceptId: "writing-paraphrase",
        },
      ],
      checkPrompt:
        "Did you change structure and wording while preserving meaning — and did you cite?",
    }),

    klConcept({
      id: "writing-argument",
      title: "Argument",
      aliases: ["academic argument", "argumentative writing", "building an argument"],
      definition:
        "An academic argument is a reasoned case: a claim supported by evidence and reasoning, often addressing alternatives.",
      explanation:
        "Argument is not quarreling. Offer a position and make it rationally persuasive through thesis, supporting claims, evidence, warrants, and engagement with counterarguments. Strength comes from clarity and support, not aggression.",
      purpose: "Persuade a thoughtful reader through reasoned support.",
      example:
        "Thesis on late dining → supporting claims with campus data → counterargument about cost → rebuttal about retention.",
      examples: ["Policy memo arguing for a schedule change with constraints acknowledged"],
      nonExamples: ["A string of opinions with no support or engagement"],
      misconceptions: ["Argument means attacking the other side personally."],
      misconception: "Equating academic argument with hostile tone.",
      misconceptionDetails: [
        klMisconception({
          misconception: "To argue, I need a harsh or sarcastic tone.",
          why: "Everyday “argument” means conflict.",
          correction:
            "Academic argument prioritizes reasons and fair engagement; tone stays respectful and precise.",
          contrast: "quarrel vs reasoned case",
          diagnosticClue: "Draft insults opponents instead of addressing claims",
        }),
      ],
      vocabulary: ["case", "support", "objection", "persuasion"],
      prerequisites: ["writing-thesis", "writing-claim", "writing-evidence"],
      relatedConcepts: [
        "writing-thesis",
        "writing-claim",
        "writing-counterargument",
        "writing-rebuttal",
        "writing-evidence",
      ],
      relationships: [
        klRel("contains", "writing-thesis", "Controlling claim of the argument"),
        klRel("contains", "writing-claim", "Supporting assertions"),
        klRel("contains", "writing-evidence", "Support materials"),
        klRel("contains", "writing-reasoning", "Warrants"),
        klRel("leads_to", "writing-counterargument", "Strong arguments anticipate objections"),
        klRel("leads_to", "writing-rebuttal", "Rebuttal answers objections"),
      ],
      procedures: [
        "State thesis",
        "List 2–3 supporting claims with evidence + reasoning",
        "Name the strongest objection and answer it",
      ],
      transferPrompts: [
        "Turn an informative outline into an argumentative outline without changing the topic.",
      ],
      practiceForms: ["outline", "write", "revise"],
      assessmentForms: ["map claim–evidence–reasoning", "identify missing objection"],
      difficulty: 2,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "argumentative-writing",
          label: "Argumentative writing",
          unit: "Argument structure",
          conceptId: "writing-argument",
        },
      ],
      checkPrompt: "What is your case, what supports it, and what objection must you face?",
    }),

    klConcept({
      id: "writing-counterargument",
      title: "Counterargument",
      aliases: ["counter argument", "opposing view", "addressing objections"],
      definition:
        "A counterargument fairly presents a significant opposing claim or objection to your thesis.",
      explanation:
        "Include the best version of the objection (steelman), not a cartoon. Place it where a reader naturally objects. Counterargument without rebuttal can undermine you; together they strengthen credibility.",
      purpose: "Demonstrate fairness and strengthen ethos by facing real objections.",
      example:
        "“Critics argue that extending dining hours is too costly given current deficits…”",
      examples: ["Acknowledge a methodological limit before defending the recommendation"],
      nonExamples: ["A straw-man version no serious opponent holds"],
      misconceptions: ["Mentioning the other side weakens your paper."],
      misconception: "Avoiding objections to seem more confident.",
      misconceptionDetails: [
        klMisconception({
          misconception: "If I include the other side, my argument looks weak.",
          why: "Students fear conceding ground.",
          correction:
            "Fair counterargument plus rebuttal usually strengthens credibility; silence looks evasive.",
          contrast: "evasion vs earned confidence",
          diagnosticClue: "Paper never mentions an obvious objection",
        }),
      ],
      vocabulary: ["objection", "steelman", "concession", "skeptic"],
      prerequisites: ["writing-argument", "writing-thesis"],
      relatedConcepts: ["writing-argument", "writing-rebuttal", "writing-thesis"],
      relationships: [
        klRel("part_of", "writing-argument", "Argumentative move"),
        klRel("leads_to", "writing-rebuttal", "Sets up the answer"),
        klRel("related_to", "writing-thesis", "Objects to the controlling claim"),
      ],
      procedures: [
        "List objections a smart classmate would raise",
        "Pick the strongest one and state it fairly",
        "Follow immediately with rebuttal",
      ],
      practiceForms: ["write", "identify", "revise"],
      assessmentForms: ["steelman an objection", "spot straw men"],
      difficulty: 3,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "argumentative-writing",
          label: "Argumentative writing",
          unit: "Counterargument",
          conceptId: "writing-counterargument",
        },
      ],
      checkPrompt: "What is the strongest fair objection to your thesis?",
    }),

    klConcept({
      id: "writing-rebuttal",
      title: "Rebuttal",
      aliases: ["refutation", "answering counterargument", "rebut"],
      definition:
        "A rebuttal responds to a counterargument by limiting, reframing, or defeating it with reasons and evidence.",
      explanation:
        "Rebuttal can concede a partial point while showing why your thesis still holds, or refute the objection’s premise. Empty dismissal fails. After rebuttal, restate how the thesis stands.",
      purpose: "Show why your claim survives the strongest objection.",
      example:
        "Concede cost pressure, then show retention gains and fee reallocations that offset evening staffing.",
      examples: ["Limit the objection’s scope: true for weekends, not weeknights with existing staff"],
      nonExamples: ["Insulting people who disagree"],
      misconceptions: ["Rebuttal means denying every part of the objection."],
      misconception: "Thinking any concession destroys the thesis.",
      misconceptionDetails: [
        klMisconception({
          misconception: "I can’t concede anything or I lose.",
          why: "Debate is imagined as total victory.",
          correction:
            "Strategic concession can narrow the dispute and make your remaining claim more credible.",
          contrast: "total denial vs qualified rebuttal",
          diagnosticClue: "Student refuses obvious limits and loses trust",
        }),
      ],
      vocabulary: ["refute", "concede", "qualify", "limit"],
      prerequisites: ["writing-counterargument"],
      relatedConcepts: ["writing-counterargument", "writing-argument", "writing-evidence"],
      relationships: [
        klRel("depends_on", "writing-counterargument", "Answers a stated objection"),
        klRel("part_of", "writing-argument", "Closing argumentative move"),
        klRel("used_with", "writing-evidence", "Often needs support"),
      ],
      procedures: [
        "Restate the objection briefly",
        "Choose strategy: refute, limit, or reframe",
        "Support, then return to the thesis",
      ],
      practiceForms: ["write", "revise"],
      assessmentForms: ["write rebuttal to a given objection", "identify empty dismissal"],
      difficulty: 3,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "argumentative-writing",
          label: "Argumentative writing",
          unit: "Rebuttal",
          conceptId: "writing-rebuttal",
        },
      ],
      checkPrompt: "How does your thesis still stand after the strongest objection?",
    }),

    klConcept({
      id: "writing-conclusion",
      title: "Conclusion",
      aliases: ["how to write a conclusion", "essay conclusion", "closing paragraph"],
      definition:
        "A conclusion synthesizes what the paper has earned — restating the thesis with developed insight, not copying the introduction.",
      explanation:
        "Answer “so what now that we’ve seen the evidence?” Synthesize major points without mechanical lists. Avoid new major claims that need fresh support. End with implication, limitation, or a precise call to action — not fluff. Lab conclusions answer the question and note limits.",
      purpose: "Close the reader’s experience with earned significance.",
      example:
        "Return to late-dining thesis with the cost objection resolved, then note a pilot-program implication.",
      examples: [
        "Research conclusion: answer the question, acknowledge limits, suggest next inquiry",
      ],
      nonExamples: ["Word-for-word restatement of the introduction"],
      misconceptions: ["Conclusions should introduce brand-new arguments."],
      misconception: "Saving the real thesis for the last paragraph.",
      misconceptionDetails: [
        klMisconception({
          misconception: "The conclusion is where I finally say what I really think.",
          why: "Drafting discoveries get dumped at the end.",
          correction:
            "Move discoveries into the thesis and body; conclude with synthesis of what the paper already supported.",
          contrast: "late thesis dump vs earned closing",
          diagnosticClue: "Best claim appears only in the last paragraph",
        }),
      ],
      vocabulary: ["synthesis", "implication", "limitation", "closure"],
      prerequisites: ["writing-thesis"],
      relatedConcepts: ["writing-introduction", "writing-thesis", "writing-structure"],
      relationships: [
        klRel("related_to", "writing-introduction", "Frames with the opening"),
        klRel("used_with", "writing-thesis", "Returns to the controlling claim"),
        klRel("part_of", "writing-structure", "Closing structural move"),
      ],
      procedures: [
        "Reread thesis and topic sentences",
        "Write synthesis without copying intro sentences",
        "Add one implication or limitation; cut new unsupported claims",
      ],
      practiceForms: ["write", "revise"],
      assessmentForms: ["improve a repetitive conclusion", "spot new-claim endings"],
      difficulty: 2,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "academic-essay",
          label: "Academic essay",
          unit: "Conclusion",
          conceptId: "writing-conclusion",
        },
      ],
      checkPrompt: "What insight did the body earn that your conclusion now states?",
    }),

    klConcept({
      id: "writing-organization",
      title: "Organization",
      aliases: ["organizing a paper", "order of ideas", "essay organization"],
      definition:
        "Organization is the deliberate sequence of points so each step prepares the next and serves the purpose.",
      explanation:
        "Patterns include chronological, compare/contrast, problem–solution, and claim-by-claim. Choose based on purpose. Outlining before polishing sentences prevents beautiful prose in the wrong order. Reorganize freely in revision.",
      purpose: "Make the reader’s path efficient and logical.",
      example:
        "Present definitions before evaluation; present counterargument after the main case is clear.",
      examples: ["Compare/contrast: subject-by-subject vs point-by-point for two policies"],
      nonExamples: ["Random order matching the order sources were read"],
      misconceptions: ["Organization means never reordering after the first draft."],
      misconception: "Never reordering points after the first draft.",
      misconceptionDetails: [
        klMisconception({
          misconception: "Once I write in an order, I shouldn’t rearrange.",
          why: "Moving paragraphs feels like lost work.",
          correction:
            "Revision often means reordering for reader logic; cut-and-paste is normal.",
          contrast: "draft order vs reader order",
          diagnosticClue: "Student defends confusing sequence because “that’s how I wrote it”",
        }),
      ],
      vocabulary: ["sequence", "pattern", "dependency", "outline"],
      relatedConcepts: [
        "writing-structure",
        "writing-coherence",
        "writing-transitions",
        "writing-revision",
      ],
      relationships: [
        klRel("related_to", "writing-structure", "Structure names parts; organization sequences them"),
        klRel("leads_to", "writing-coherence", "Good order enables coherence"),
        klRel("used_with", "writing-transitions", "Transitions mark organizational links"),
        klRel("used_with", "writing-revision", "Reordering is a revision move"),
      ],
      procedures: [
        "List points as bullets and mark dependencies",
        "Order for reader need, not research chronology",
        "Re-outline after a full draft",
      ],
      practiceForms: ["outline", "revise"],
      assessmentForms: ["choose best order for a purpose", "reorder scrambled points"],
      difficulty: 2,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "writing-improvement",
          label: "Writing improvement",
          unit: "Organization",
          conceptId: "writing-organization",
        },
      ],
      checkPrompt: "Why does point B come after point A for the reader?",
    }),

    klConcept({
      id: "writing-transitions",
      title: "Transitions",
      aliases: ["transition words", "transitional phrases", "linking sentences"],
      definition:
        "Transitions are words, phrases, or sentences that signal how ideas relate — addition, contrast, cause, example, or sequence.",
      explanation:
        "Transitions make relationships visible, but they cannot invent logic that isn’t there. Prefer precise signals over empty fillers. Paragraph-level transitions often need a bridge sentence, not only “Also.”",
      purpose: "Cue the reader to the relationship between ideas.",
      example:
        "“These cancellation rates matter because commuting students lose the evening study block the thesis depends on.”",
      examples: [
        "Between paragraphs: a sentence that carries a key term forward while shifting focus",
      ],
      nonExamples: ["Starting every sentence with “Additionally,”"],
      misconceptions: ["Any transition word improves writing."],
      misconception: "Using “however” when no contrast exists.",
      misconceptionDetails: [
        klMisconception({
          misconception: "I should add transition words everywhere.",
          why: "Checklists reward visible transitions.",
          correction:
            "Use transitions when the relationship isn’t obvious; fix order first if links are fake.",
          contrast: "signal vs substance",
          diagnosticClue: "“However” connects two agreeing sentences",
        }),
      ],
      vocabulary: ["bridge", "signal", "contrast", "consequence"],
      relatedConcepts: ["writing-coherence", "writing-organization", "writing-body-paragraph"],
      relationships: [
        klRel("used_with", "writing-coherence", "Signals coherent links"),
        klRel("used_with", "writing-organization", "Marks sequence choices"),
        klRel("related_to", "writing-body-paragraph", "Connects paragraphs"),
      ],
      procedures: [
        "Name the relationship (contrast, cause, example)",
        "Choose a matching signal or bridge sentence",
        "Delete transitions that mislabel the link",
      ],
      practiceForms: ["revise", "identify"],
      assessmentForms: ["fix mismatched transitions", "write bridge sentences"],
      difficulty: 1,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "writing-improvement",
          label: "Writing improvement",
          unit: "Transitions",
          conceptId: "writing-transitions",
        },
      ],
      checkPrompt: "What relationship does this transition claim, and is it true?",
    }),

    klConcept({
      id: "writing-revision",
      title: "Revision",
      aliases: ["how to revise", "revising a draft", "global revision", "revision vs editing"],
      definition:
        "Revision is re-seeing the draft’s ideas, structure, and evidence — larger changes than surface correctness.",
      explanation:
        "Ask: Is the thesis clear? Are paragraphs in the best order? Is evidence sufficient? You may cut sections, rewrite claims, or reorder points. Confusing revision with editing leads students to polish a confused argument until it is a clear confused argument.",
      purpose: "Improve meaning, structure, and support before polishing language.",
      example:
        "Move the buried thesis to the intro, split a double-focus paragraph, add a counterargument — then edit.",
      examples: ["Delete a beautiful anecdote that doesn’t serve the claim"],
      nonExamples: ["Only running spellcheck and calling it revision"],
      misconceptions: ["Revision is the same as editing."],
      misconception: "Treating grammar fixes as complete revision.",
      misconceptionDetails: [
        klMisconception({
          misconception: "Revision means fixing grammar and spelling.",
          why: "Editing is more visible and quicker.",
          correction:
            "Revision changes ideas, organization, and evidence; editing polishes language afterward.",
          contrast: "revision (global) vs editing (local)",
          diagnosticClue: "Student “revises” by only correcting commas",
        }),
      ],
      vocabulary: ["global changes", "re-see", "cut", "reorganize", "develop"],
      prerequisites: ["writing-structure"],
      relatedConcepts: ["writing-editing", "writing-organization", "writing-thesis", "writing-clarity"],
      relationships: [
        klRel("contrasts_with", "writing-editing", "Global meaning vs surface polish"),
        klRel("used_with", "writing-organization", "Reordering is revision"),
        klRel("used_with", "writing-thesis", "Thesis often changes in revision"),
        klRel("leads_to", "writing-editing", "Edit after major revision"),
      ],
      procedures: [
        "Outline the draft from what is on the page",
        "Compare outline to purpose/thesis and make structural changes",
        "Only then edit sentences",
      ],
      workedExamples: [
        "Before/after: unclear social-media thesis draft revised for stance, scope, and evidence gaps.",
      ],
      transferPrompts: ["Given a peer draft, list three revision moves that are not editing."],
      practiceForms: ["revise", "diagnose", "compare"],
      assessmentForms: ["distinguish revision vs editing tasks", "prioritize revision moves"],
      difficulty: 2,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "writing-improvement",
          label: "Writing improvement",
          unit: "Revision",
          conceptId: "writing-revision",
        },
      ],
      checkPrompt:
        "What will you change about ideas or structure — not just wording — in the next pass?",
    }),

    klConcept({
      id: "writing-editing",
      title: "Editing",
      aliases: ["editing a paper", "proofreading", "sentence editing"],
      definition:
        "Editing improves sentence-level clarity, grammar, punctuation, and consistency after the content is largely set.",
      explanation:
        "Editing targets readability and correctness. It is essential but late — editing too early wastes effort on paragraphs you may delete. Know your recurring errors and search for them deliberately.",
      purpose: "Polish language so it doesn’t distract from the argument.",
      example:
        "After revising structure, replace vague “this” references, fix comma splices, and standardize headings.",
      examples: ["Cut empty intensifiers; split overloaded sentences"],
      nonExamples: ["Rewriting the thesis during a “quick edit” without calling it revision"],
      misconceptions: ["Editing alone can fix a weak argument."],
      misconception: "Expecting grammar polish to repair missing reasoning.",
      misconceptionDetails: [
        klMisconception({
          misconception: "If the grammar is perfect, the paper is strong.",
          why: "Correctness is easy to see.",
          correction:
            "Correct prose can still lack a thesis, evidence, or analysis. Edit after revision.",
          contrast: "surface correctness vs argumentative strength",
          diagnosticClue: "Clean sentences, unclear claim",
        }),
      ],
      vocabulary: ["proofread", "concision", "consistency", "mechanics"],
      prerequisites: ["writing-revision"],
      relatedConcepts: ["writing-revision", "writing-clarity", "writing-citation"],
      relationships: [
        klRel("contrasts_with", "writing-revision", "Local polish vs global rethinking"),
        klRel("used_with", "writing-clarity", "Editing often targets clarity"),
        klRel("related_to", "writing-citation", "Citation format checks happen in editing"),
      ],
      procedures: [
        "Freeze major content decisions",
        "Read aloud; check one error type at a time",
        "Verify names, numbers, and citations",
      ],
      practiceForms: ["edit", "identify"],
      assessmentForms: ["edit for clarity without changing thesis"],
      difficulty: 1,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "writing-improvement",
          label: "Writing improvement",
          unit: "Editing",
          conceptId: "writing-editing",
        },
      ],
      checkPrompt: "Are you polishing sentences, or do ideas/structure still need revision?",
    }),

    klConcept({
      id: "writing-research-question",
      title: "Research question",
      aliases: ["forming a research question", "good research question", "inquiry question"],
      definition:
        "A research question is a focused, answerable inquiry that guides investigation and eventually shapes a thesis or findings.",
      explanation:
        "Strong questions are specific, researchable, and significant. Yes/no questions are often too thin; scoped “how/why/to what extent” questions invite analysis. The question should not smuggle the answer. Refine it as sources teach you what is knowable.",
      purpose: "Focus research and prevent aimless source collecting.",
      example:
        "“To what extent do evening bus cancellations predict missed deadlines among off-campus first-years at X College?”",
      examples: ["Weaker: “Is social media bad?” Stronger: scoped population, outcome, and context"],
      nonExamples: ["A question already answered by a single dictionary definition"],
      misconceptions: ["The research question is the same as the thesis."],
      misconception: "Writing the answer into the question.",
      misconceptionDetails: [
        klMisconception({
          misconception: "My research question should state my conclusion.",
          why: "Students start with a preferred answer.",
          correction: "Questions inquire; theses answer. Let evidence shape the claim.",
          contrast: "open inquiry vs predetermined answer",
          diagnosticClue: "Question is “Why is Policy A obviously best?”",
        }),
      ],
      vocabulary: ["scope", "researchable", "significance", "inquiry"],
      relatedConcepts: [
        "writing-thesis",
        "writing-source",
        "writing-hypothesis",
        "writing-synthesis",
      ],
      relationships: [
        klRel("leads_to", "writing-thesis", "Answers often become theses"),
        klRel("related_to", "writing-hypothesis", "Labs use hypotheses under questions"),
        klRel("used_with", "writing-source", "Sources are gathered to address the question"),
        klRel("leads_to", "writing-synthesis", "Multiple sources answer complex questions"),
      ],
      procedures: [
        "Start broad, then add population, variables, and context",
        "Check feasibility with available time/sources",
        "Ensure the question doesn’t assume the answer",
      ],
      practiceForms: ["write", "revise", "compare"],
      assessmentForms: ["improve a vague question", "distinguish question vs thesis"],
      difficulty: 2,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "research-writing",
          label: "Research writing",
          unit: "Research question",
          conceptId: "writing-research-question",
        },
      ],
      checkPrompt: "Is your question scoped, researchable, and not already a thesis?",
    }),

    klConcept({
      id: "writing-source",
      title: "Sources",
      aliases: ["using sources", "credible sources", "source evaluation"],
      definition:
        "Sources are texts, data, or artifacts you draw on; evaluating them means judging credibility, relevance, and purpose.",
      explanation:
        "Sources serve different roles: background, exhibit, argument, or method. Evaluate author expertise, evidence quality, date, and bias. Match source type to claim type. Keep notes that separate quotation, paraphrase, and your reactions.",
      purpose: "Build a reliable evidence base for research writing.",
      example:
        "Prefer a peer-reviewed study on sleep and memory over an anonymous forum post for a scientific claim.",
      examples: ["Primary source (letter, dataset) vs secondary analysis"],
      nonExamples: ["Treating a random blog as equal to a reviewed study for empirical claims"],
      misconceptions: ["The first Google result is good enough."],
      misconception: "Equating popularity with credibility.",
      misconceptionDetails: [
        klMisconception({
          misconception: "If it’s online and popular, it’s a good source.",
          why: "Search rankings feel like endorsement.",
          correction:
            "Evaluate authorship, evidence, and venue; popularity is not credibility.",
          contrast: "visibility vs reliability",
          diagnosticClue: "Only sources are SEO-top blogs for empirical claims",
        }),
      ],
      vocabulary: ["credibility", "relevance", "primary", "secondary", "bias"],
      prerequisites: ["writing-research-question"],
      relatedConcepts: [
        "writing-evidence",
        "writing-citation",
        "writing-synthesis",
        "writing-paraphrase",
      ],
      relationships: [
        klRel("leads_to", "writing-evidence", "Sources supply evidence"),
        klRel("used_with", "writing-citation", "Sources must be attributed"),
        klRel("used_with", "writing-synthesis", "Multiple sources are combined"),
        klRel("related_to", "writing-paraphrase", "Source ideas are often paraphrased"),
      ],
      procedures: [
        "Define what kind of source the claim needs",
        "Evaluate author, venue, date, evidence",
        "Note how you will use it (background/exhibit/argument)",
      ],
      practiceForms: ["evaluate", "classify", "select"],
      assessmentForms: ["rank source credibility for a claim", "classify source roles"],
      difficulty: 2,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "research-writing",
          label: "Research writing",
          unit: "Sources",
          conceptId: "writing-source",
        },
      ],
      checkPrompt: "Why is this source credible and relevant for your specific claim?",
    }),

    klConcept({
      id: "writing-synthesis",
      title: "Synthesis",
      aliases: ["synthesizing sources", "source synthesis", "putting sources in conversation"],
      definition:
        "Synthesis puts sources in conversation — comparing, contrasting, and combining insights to build a claim no single source fully states.",
      explanation:
        "Synthesis is more than serial summary (“Source A says… Source B says…”). Group by idea, show agreement/conflict, and advance your thesis. Your voice should steer; sources are evidence in a discussion you lead.",
      purpose: "Create new understanding from multiple sources.",
      example:
        "Three studies agree sleep debt hurts memory but disagree on caffeine as a mitigator — position your claim in that gap.",
      examples: ["Thematic grouping: access, cost, and equity themes across campus reports"],
      nonExamples: ["Annotated list of unrelated source summaries"],
      misconceptions: ["Synthesis means summarizing sources one after another."],
      misconception: "Serial summary mistaken for synthesis.",
      misconceptionDetails: [
        klMisconception({
          misconception: "If I summarize each source in order, I’ve synthesized.",
          why: "Coverage feels like integration.",
          correction:
            "Organize by idea; make sources speak to each other in service of your claim.",
          contrast: "serial summary vs conversational synthesis",
          diagnosticClue: "Each paragraph is one source with no cross-links",
        }),
      ],
      vocabulary: ["conversation", "pattern", "gap", "thematic grouping"],
      prerequisites: ["writing-source", "writing-analysis"],
      relatedConcepts: [
        "writing-source",
        "writing-thesis",
        "writing-analysis",
        "writing-evidence-integration",
      ],
      relationships: [
        klRel("depends_on", "writing-source", "Needs multiple sources"),
        klRel("used_with", "writing-thesis", "Synthesis serves a controlling claim"),
        klRel("related_to", "writing-analysis", "Interpretive combination of materials"),
        klRel("used_with", "writing-evidence-integration", "Integrates multiple voices"),
      ],
      procedures: [
        "Extract key claims from each source",
        "Cluster by theme, not by author order",
        "Write sentences that relate two sources; state what your claim adds",
      ],
      practiceForms: ["write", "organize", "compare"],
      assessmentForms: ["convert serial summary to synthesis"],
      difficulty: 3,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "research-writing",
          label: "Research writing",
          unit: "Synthesis",
          conceptId: "writing-synthesis",
        },
      ],
      checkPrompt: "Where do your sources agree, conflict, or leave a gap your claim fills?",
    }),

    klConcept({
      id: "writing-citation",
      title: "Citation",
      aliases: ["citing sources", "how to cite", "attribution", "academic citation"],
      definition:
        "Citation attributes ideas, words, and data to their sources so readers can verify and so you avoid plagiarism.",
      explanation:
        "Cite when you quote, paraphrase, or use distinctive ideas/data that are not common knowledge. Citation systems (APA, MLA, Chicago, etc.) differ in format — learn the one your course requires from a guide; this concept stays at the principle level. In-text markers pair with a reference list. Missing citations for paraphrases is a common failure.",
      purpose: "Give credit and enable verification.",
      example:
        "After paraphrasing a finding on sleep and memory, include an in-text citation and a full reference entry in the required style.",
      examples: ["Quote with page/locator when the style expects it"],
      nonExamples: [
        "Copying a citation generator blindly without checking required elements",
      ],
      misconceptions: ["Only quotations need citations."],
      misconception: "Skipping citation because the wording is original.",
      misconceptionDetails: [
        klMisconception({
          misconception: "I only cite when I use quotation marks.",
          why: "Quotes are the most visible borrowing.",
          correction:
            "Paraphrased ideas and data also need attribution; citation marks intellectual origin.",
          contrast: "quoting vs all source use",
          diagnosticClue: "Paraphrase paragraphs with no citations",
        }),
      ],
      vocabulary: [
        "attribution",
        "in-text citation",
        "reference list",
        "common knowledge",
        "plagiarism",
      ],
      prerequisites: ["writing-source"],
      relatedConcepts: [
        "writing-paraphrase",
        "writing-source",
        "writing-evidence-integration",
        "writing-editing",
      ],
      relationships: [
        klRel("related_to", "writing-paraphrase", "Paraphrase requires citation"),
        klRel("used_with", "writing-source", "Every used source is cited"),
        klRel("used_with", "writing-evidence-integration", "Citations appear in integrated sentences"),
        klRel("related_to", "writing-editing", "Format checks often happen while editing"),
      ],
      procedures: [
        "Decide if material is common knowledge or sourced",
        "Add in-text credit at the point of use",
        "Add full reference details your style requires (consult a guide)",
      ],
      practiceForms: ["identify", "apply", "edit"],
      assessmentForms: ["mark places needing citation", "explain why paraphrase needs credit"],
      difficulty: 2,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "research-writing",
          label: "Research writing",
          unit: "Citation",
          conceptId: "writing-citation",
        },
      ],
      checkPrompt:
        "Did every borrowed idea or datum get credit — including paraphrases?",
    }),

    klConcept({
      id: "writing-evidence-integration",
      title: "Evidence integration",
      aliases: ["integrating evidence", "integrating quotations", "quote integration"],
      definition:
        "Evidence integration weaves source material into your sentences with introduction, presentation, citation, and follow-up analysis.",
      explanation:
        "Dropped quotes — quotations standing alone — break voice and leave interpretation undone. Prefer signal phrases or grammatical blends, then analyze. Keep quotations short; paraphrase when wording isn’t distinctive. Keep your argumentative control.",
      purpose: "Keep your voice in control while using sources smoothly.",
      example:
        "Garcia finds that “evening cancellations clustered on exam weeks” (p. 14), which suggests transit failures hit when study time is least flexible.",
      examples: ["Introduce → quote/paraphrase → cite → interpret"],
      nonExamples: ["A naked block quote with no setup or follow-up"],
      misconceptions: ["Longer quotations are more academic."],
      misconception: "Letting quotes run the paragraph.",
      misconceptionDetails: [
        klMisconception({
          misconception: "Bigger quotes make my writing look more researched.",
          why: "Length signals effort.",
          correction:
            "Select precise excerpts; your analysis should outweigh quotation length in most analytical paragraphs.",
          contrast: "quote-led vs writer-led paragraphs",
          diagnosticClue: "Paragraphs are mostly indented quotation",
        }),
      ],
      vocabulary: ["signal phrase", "dropped quote", "blend", "follow-up analysis"],
      prerequisites: ["writing-evidence", "writing-citation"],
      relatedConcepts: [
        "writing-evidence",
        "writing-paraphrase",
        "writing-citation",
        "writing-analysis",
      ],
      relationships: [
        klRel("used_with", "writing-evidence", "How evidence enters the prose"),
        klRel("used_with", "writing-paraphrase", "Paraphrase is a primary integration tool"),
        klRel("used_with", "writing-citation", "Integrated evidence is cited"),
        klRel("leads_to", "writing-analysis", "Follow-up interpretation after integration"),
      ],
      procedures: [
        "Write the point you need evidence for",
        "Choose quote vs paraphrase; introduce with a signal phrase",
        "Cite, then analyze — never end on the quote",
      ],
      practiceForms: ["revise", "write", "identify"],
      assessmentForms: ["fix dropped quotes", "integrate a raw quotation"],
      difficulty: 2,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "research-writing",
          label: "Research writing",
          unit: "Integration",
          conceptId: "writing-evidence-integration",
        },
        {
          curriculumId: "argumentative-writing",
          label: "Argumentative writing",
          unit: "Using evidence",
          conceptId: "writing-evidence-integration",
        },
      ],
      checkPrompt: "Does every piece of evidence have setup, citation, and follow-up analysis?",
    }),

    klConcept({
      id: "writing-hypothesis",
      title: "Hypothesis (lab writing)",
      aliases: [
        "lab report hypothesis",
        "scientific hypothesis writing",
        "predict the outcome",
      ],
      definition:
        "In lab-report writing, a hypothesis is a testable prediction about the relationship between variables, grounded in reasoning.",
      explanation:
        "State what you expect to observe and why, in terms an experiment can support or fail to support. It differs from a research question (inquiry) and from a thesis (essay claim). Keep results separate until analysis/conclusion compares them to the hypothesis.",
      purpose: "Make an experimental prediction clear and testable for the report.",
      example:
        "“If light intensity increases, then photosynthetic rate will increase because more photons drive more light-dependent reactions, measured as O₂ production per minute.”",
      examples: ["Prediction tied to a measurable outcome, not “plants will do better”"],
      nonExamples: [
        "“I think the lab will be interesting”",
        "A value judgment thesis copied into a lab report",
      ],
      misconceptions: ["A hypothesis is the same as a thesis statement."],
      misconception: "Writing an essay thesis into the hypothesis slot.",
      misconceptionDetails: [
        klMisconception({
          misconception: "Hypothesis and thesis mean the same thing.",
          why: "Both are “main sentences” in student mental models.",
          correction:
            "A lab hypothesis predicts a testable outcome; an essay thesis argues a claim for readers. Genres differ.",
          contrast: "testable prediction vs arguable claim",
          diagnosticClue: "Hypothesis section reads like an opinion essay claim",
        }),
      ],
      vocabulary: ["testable", "prediction", "variable", "reasoning", "measurable outcome"],
      prerequisites: ["writing-research-question"],
      relatedConcepts: ["writing-research-question", "writing-analysis", "writing-conclusion"],
      relationships: [
        klRel("related_to", "writing-research-question", "Questions frame; hypotheses predict"),
        klRel("used_with", "writing-analysis", "Results are interpreted against the hypothesis"),
        klRel("related_to", "writing-conclusion", "Conclusion addresses whether results support it"),
        klRel("contrasts_with", "writing-thesis", "Lab prediction vs essay claim"),
      ],
      procedures: [
        "Name independent and dependent variables",
        "State if–then prediction with because-reasoning",
        "Ensure the lab can produce relevant data",
      ],
      practiceForms: ["write", "revise", "compare"],
      assessmentForms: ["improve a vague hypothesis", "distinguish hypothesis vs thesis"],
      difficulty: 2,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "research-writing",
          label: "Research writing",
          unit: "Lab reports",
          conceptId: "writing-hypothesis",
        },
      ],
      checkPrompt:
        "Is your hypothesis a testable prediction with reasoning — not an essay thesis?",
    }),
  ],
  practicePrompts: [
    {
      title: "Thesis stress test",
      prompt:
        "Rewrite a topic-only sentence into a strong thesis, then name one fair counterargument.",
      tip: "If nobody could disagree, sharpen the claim.",
    },
    {
      title: "Summary → analysis",
      prompt:
        "Take three summary sentences about a source and convert two of them into analysis for your claim.",
      tip: "Keep one summary sentence as setup only.",
    },
    {
      title: "Revise before you edit",
      prompt: "List three global revision moves for your draft that are not grammar fixes.",
      tip: "Think thesis, order, evidence gaps, counterargument.",
    },
  ],
};

registerInstructionalPack(WRITING_FUNDAMENTALS_PACK);
