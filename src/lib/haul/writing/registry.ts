/**
 * Haul writing-type registry — typed templates for guided writing.
 * Add types here without rebuilding the UI.
 */

import { bodyParagraphSection, section } from "@/lib/haul/writing/section-helpers";
import type { HaulWritingType } from "@/lib/haul/writing/types";

const DEFAULT_TOOLS = [
  "paraphrase",
  "rewrite",
  "expand",
  "shorten",
  "simplify",
  "clarify",
  "write-for-me",
  "continue",
  "outline",
  "brainstorm",
  "examples",
  "explain",
  "feedback",
] as const;

export const ESSAY_WRITING_TYPE: HaulWritingType = {
  id: "essay",
  title: "Essay",
  category: "academic",
  description: "A structured multi-paragraph essay with introduction, body, and conclusion.",
  purpose: "Present and develop a clear main idea with supporting paragraphs.",
  specialization: "full",
  availableTools: [...DEFAULT_TOOLS, "thesis"],
  learningGoals: [
    "Write a focused thesis",
    "Develop body paragraphs with evidence and analysis",
    "Close with a meaningful conclusion",
  ],
  commonMistakes: [
    "Thesis that only announces a topic",
    "Evidence without explanation",
    "Conclusion that only repeats the introduction",
  ],
  pedagogy: {
    whatIsThis:
      "An essay develops a central idea through an introduction, supporting body paragraphs, and a conclusion.",
    howStructured:
      "Introduction (hook, context, thesis) → body paragraphs (point, evidence, analysis, connection) → conclusion.",
    strongExampleNotes:
      "Strong essays keep one controlling idea, use specific support, and explain why the support matters.",
    beforeFinish: [
      "Does the thesis state a clear main point?",
      "Does each body paragraph support the thesis?",
      "Is evidence explained, not just dropped in?",
      "Does the conclusion synthesize rather than only repeat?",
    ],
  },
  sections: [
    section({
      id: "introduction",
      title: "Introduction",
      purpose: "Orient the reader and state the central idea.",
      fields: [
        {
          id: "hook",
          label: "Hook / opening",
          placeholder: "Start your reader's attention and introduce the subject.",
          multiline: true,
        },
        {
          id: "background",
          label: "Background / context",
          placeholder: "Give the reader the information they need before your main point.",
          multiline: true,
        },
        {
          id: "thesis",
          label: "Thesis",
          placeholder: "What is the main point your essay will make?",
          multiline: true,
        },
      ],
      help: {
        explain:
          "The introduction moves from attention to context to a clear thesis that the rest of the essay will support.",
        tips: [
          "Avoid starting with a dictionary definition.",
          "The thesis should be specific and arguable or insightful — not just a topic label.",
        ],
      },
      knowledgeConceptIds: ["writing-thesis", "writing-introduction"],
      examples: [
        {
          label: "Thesis example",
          text: "School start times should shift later because adolescent sleep biology, academic performance, and safety all improve when schedules align with circadian rhythms.",
        },
      ],
    }),
    bodyParagraphSection(1),
    bodyParagraphSection(2),
    bodyParagraphSection(3),
    section({
      id: "conclusion",
      title: "Conclusion",
      purpose: "Bring the ideas together and leave a lasting thought.",
      fields: [
        {
          id: "restate",
          label: "Restate the central idea",
          placeholder: "Return to your main point in fresh words.",
          multiline: true,
        },
        {
          id: "synthesize",
          label: "Bring the ideas together",
          placeholder: "Show how the body paragraphs add up.",
          multiline: true,
        },
        {
          id: "final-thought",
          label: "Final thought / significance",
          placeholder: "Why does this matter beyond the paper?",
          multiline: true,
        },
      ],
      help: {
        explain:
          "A conclusion synthesizes; it does not dump new major arguments or only copy the thesis.",
      },
      knowledgeConceptIds: ["writing-conclusion"],
    }),
  ],
};

export const ARGUMENTATIVE_WRITING_TYPE: HaulWritingType = {
  id: "argumentative",
  title: "Argumentative Paper",
  category: "academic",
  description: "Argue a claim with reasons, evidence, and a fair counterargument.",
  purpose: "Persuade with reasoned claims, evidence, and rebuttal.",
  specialization: "full",
  availableTools: [...DEFAULT_TOOLS, "thesis"],
  learningGoals: [
    "State a clear claim",
    "Support reasons with evidence and reasoning",
    "Address and rebut a counterargument",
  ],
  commonMistakes: [
    "Claim without reasons",
    "Ignoring opposing views",
    "Evidence without reasoning",
  ],
  pedagogy: {
    whatIsThis:
      "An argumentative paper advances a claim, supports it, and engages opposing views.",
    howStructured:
      "Introduction → claim → reasons with evidence/reasoning → counterargument → rebuttal → conclusion.",
    beforeFinish: [
      "Is the claim specific?",
      "Does each reason have evidence and reasoning?",
      "Is the counterargument fairly stated and rebutted?",
    ],
  },
  sections: [
    section({
      id: "introduction",
      title: "Introduction",
      purpose: "Frame the issue and prepare for the claim.",
      prompt: "Introduce the controversy and why it matters.",
      fields: [
        { id: "context", label: "Context", multiline: true },
        { id: "claim", label: "Claim / thesis", multiline: true },
      ],
      knowledgeConceptIds: ["writing-claim", "writing-thesis"],
    }),
    section({
      id: "reason-1",
      title: "Reason 1",
      purpose: "First major reason supporting the claim.",
      fields: [
        { id: "reason", label: "Reason", multiline: true },
        { id: "evidence", label: "Evidence", multiline: true },
        { id: "reasoning", label: "Reasoning", multiline: true },
      ],
      knowledgeConceptIds: ["writing-evidence", "writing-reasoning"],
    }),
    section({
      id: "reason-2",
      title: "Reason 2",
      purpose: "Second major reason supporting the claim.",
      fields: [
        { id: "reason", label: "Reason", multiline: true },
        { id: "evidence", label: "Evidence", multiline: true },
        { id: "reasoning", label: "Reasoning", multiline: true },
      ],
    }),
    section({
      id: "counterargument",
      title: "Counterargument",
      purpose: "State a serious opposing view fairly.",
      prompt: "What would a thoughtful opponent say?",
      knowledgeConceptIds: ["writing-counterargument"],
    }),
    section({
      id: "rebuttal",
      title: "Rebuttal",
      purpose: "Respond to the counterargument without dismissing it unfairly.",
      knowledgeConceptIds: ["writing-rebuttal"],
    }),
    section({
      id: "conclusion",
      title: "Conclusion",
      purpose: "Reinforce the claim and significance.",
    }),
  ],
};

export const COMPARE_CONTRAST_WRITING_TYPE: HaulWritingType = {
  id: "compare-contrast",
  title: "Compare & Contrast",
  category: "academic",
  description: "Analyze similarities and differences between subjects.",
  purpose: "Compare subjects using clear criteria and insightful analysis.",
  specialization: "full",
  availableTools: [...DEFAULT_TOOLS],
  sections: [
    section({
      id: "introduction",
      title: "Introduction",
      purpose: "Introduce the subjects and purpose of comparison.",
      knowledgeConceptIds: ["writing-introduction", "writing-purpose"],
    }),
    section({
      id: "subjects",
      title: "Subjects / topics",
      purpose: "Name what is being compared.",
      fields: [
        { id: "subject-a", label: "Subject A" },
        { id: "subject-b", label: "Subject B" },
      ],
    }),
    section({
      id: "criteria",
      title: "Comparison criteria",
      purpose: "Decide the meaningful dimensions of comparison.",
      knowledgeConceptIds: ["writing-organization"],
    }),
    section({
      id: "similarities",
      title: "Similarities",
      purpose: "Develop meaningful similarities.",
      knowledgeConceptIds: ["writing-analysis"],
    }),
    section({
      id: "differences",
      title: "Differences",
      purpose: "Develop meaningful differences.",
      knowledgeConceptIds: ["writing-analysis"],
    }),
    section({
      id: "analysis",
      title: "Analysis",
      purpose: "Explain what the comparison reveals.",
      knowledgeConceptIds: ["writing-analysis", "writing-analysis-vs-summary"],
    }),
    section({
      id: "conclusion",
      title: "Conclusion",
      purpose: "Close with insight from the comparison.",
      knowledgeConceptIds: ["writing-conclusion"],
    }),
  ],
};

export const RESEARCH_PAPER_WRITING_TYPE: HaulWritingType = {
  id: "research-paper",
  title: "Research Paper",
  category: "academic",
  description: "Investigate a question with sources, analysis, and citations.",
  purpose: "Answer a research question using credible sources and synthesis.",
  specialization: "full",
  availableTools: [...DEFAULT_TOOLS, "thesis"],
  sections: [
    section({
      id: "research-question",
      title: "Research question",
      purpose: "State what you are investigating.",
      knowledgeConceptIds: ["writing-research-question"],
    }),
    section({
      id: "background",
      title: "Background",
      purpose: "Orient readers to the topic and conversation.",
    }),
    section({
      id: "thesis",
      title: "Thesis",
      purpose: "State your research-supported main claim.",
      knowledgeConceptIds: ["writing-thesis"],
    }),
    section({
      id: "sources",
      title: "Sources / evidence",
      purpose: "Gather and note key source material.",
      knowledgeConceptIds: ["writing-source"],
    }),
    section({
      id: "analysis",
      title: "Analysis",
      purpose: "Interpret evidence and synthesize sources.",
      knowledgeConceptIds: ["writing-synthesis"],
    }),
    section({
      id: "discussion",
      title: "Discussion",
      purpose: "Discuss implications and limitations.",
    }),
    section({
      id: "conclusion",
      title: "Conclusion",
      purpose: "Answer the question and point forward.",
    }),
    section({
      id: "references",
      title: "References",
      purpose: "List sources accurately.",
      knowledgeConceptIds: ["writing-citation"],
      required: false,
    }),
  ],
};

export const ANALYTICAL_WRITING_TYPE: HaulWritingType = {
  id: "analytical",
  title: "Analytical Paper",
  category: "academic",
  description: "Break a subject into parts and interpret how they work together.",
  purpose: "Analyze rather than only summarize.",
  specialization: "full",
  availableTools: [...DEFAULT_TOOLS],
  sections: [
    section({ id: "introduction", title: "Introduction", purpose: "Introduce the subject and analytical angle." }),
    section({ id: "thesis", title: "Analytical thesis", purpose: "State what your analysis will show." }),
    section({ id: "element-1", title: "Element / lens 1", purpose: "Analyze the first key element." }),
    section({ id: "element-2", title: "Element / lens 2", purpose: "Analyze the second key element." }),
    section({ id: "synthesis", title: "Synthesis", purpose: "Show how the parts relate." }),
    section({ id: "conclusion", title: "Conclusion", purpose: "Close with interpretive insight." }),
  ],
};

export const EXPOSITORY_WRITING_TYPE: HaulWritingType = {
  id: "expository",
  title: "Expository Paper",
  category: "academic",
  description: "Explain a topic clearly with organized information.",
  purpose: "Inform and explain without primarily arguing a contested claim.",
  specialization: "full",
  availableTools: [...DEFAULT_TOOLS],
  sections: [
    section({ id: "introduction", title: "Introduction", purpose: "Introduce the topic and purpose." }),
    section({ id: "point-1", title: "Explanation point 1", purpose: "Develop the first clear explanatory point." }),
    section({ id: "point-2", title: "Explanation point 2", purpose: "Develop the second explanatory point." }),
    section({ id: "point-3", title: "Explanation point 3", purpose: "Develop the third explanatory point.", required: false }),
    section({ id: "conclusion", title: "Conclusion", purpose: "Summarize understanding clearly." }),
  ],
};

export const NARRATIVE_ESSAY_WRITING_TYPE: HaulWritingType = {
  id: "narrative-essay",
  title: "Narrative Essay",
  category: "academic",
  description: "Tell a meaningful story with reflection.",
  purpose: "Use narrative to convey experience and insight.",
  specialization: "full",
  availableTools: [...DEFAULT_TOOLS],
  sections: [
    section({ id: "hook", title: "Opening / hook", purpose: "Draw the reader into the moment." }),
    section({ id: "setting", title: "Setting & context", purpose: "Establish where, when, and who." }),
    section({ id: "conflict", title: "Conflict / turning point", purpose: "Develop the central tension." }),
    section({ id: "development", title: "Development", purpose: "Show what happened next with detail." }),
    section({ id: "reflection", title: "Reflection", purpose: "Explain what the experience means." }),
    section({ id: "closing", title: "Closing", purpose: "End with resonance, not only summary." }),
  ],
};

export const REFLECTIVE_WRITING_TYPE: HaulWritingType = {
  id: "reflective",
  title: "Reflective Paper",
  category: "academic",
  description: "Reflect on experience, learning, or practice with insight.",
  purpose: "Connect experience to meaning and growth.",
  specialization: "full",
  availableTools: [...DEFAULT_TOOLS],
  sections: [
    section({ id: "experience", title: "Experience / moment", purpose: "Describe what happened." }),
    section({ id: "reaction", title: "Initial reaction", purpose: "Capture thoughts and feelings." }),
    section({ id: "analysis", title: "Analysis", purpose: "Interpret why it mattered." }),
    section({ id: "learning", title: "Learning / insight", purpose: "State what you learned." }),
    section({ id: "application", title: "Application", purpose: "How will this change future action?" }),
    section({ id: "closing", title: "Closing", purpose: "Bring the reflection to a clear close." }),
  ],
};

export const LAB_REPORT_WRITING_TYPE: HaulWritingType = {
  id: "lab-report",
  title: "Lab Report",
  category: "academic",
  description: "Report scientific investigation with method and results.",
  purpose: "Document a lab investigation clearly and accurately.",
  specialization: "full",
  availableTools: [...DEFAULT_TOOLS],
  learningGoals: ["State hypothesis", "Report procedure and results", "Analyze and conclude"],
  sections: [
    section({ id: "title", title: "Title", purpose: "Name the investigation." }),
    section({
      id: "research-question",
      title: "Research question",
      purpose: "What question does the lab address?",
      knowledgeConceptIds: ["writing-research-question"],
    }),
    section({
      id: "hypothesis",
      title: "Hypothesis",
      purpose: "Predict the outcome with reasoning.",
      knowledgeConceptIds: ["writing-hypothesis"],
    }),
    section({ id: "materials", title: "Materials", purpose: "List materials and tools." }),
    section({
      id: "procedure",
      title: "Procedure",
      purpose: "Describe steps so another person could repeat them.",
      knowledgeConceptIds: ["writing-clarity"],
    }),
    section({
      id: "results",
      title: "Results",
      purpose: "Report observations/data without heavy interpretation.",
      knowledgeConceptIds: ["writing-summary", "writing-evidence"],
    }),
    section({
      id: "analysis",
      title: "Analysis",
      purpose: "Interpret what the results mean.",
      knowledgeConceptIds: ["writing-analysis", "writing-analysis-vs-summary"],
    }),
    section({
      id: "conclusion",
      title: "Conclusion",
      purpose: "Answer the question and note limitations.",
      knowledgeConceptIds: ["writing-conclusion"],
    }),
  ],
};

export const CASE_STUDY_WRITING_TYPE: HaulWritingType = {
  id: "case-study",
  title: "Case Study",
  category: "academic",
  description: "Analyze a situation and recommend a course of action.",
  purpose: "Diagnose a case and justify a recommendation.",
  specialization: "full",
  availableTools: [...DEFAULT_TOOLS],
  sections: [
    section({ id: "case", title: "Case / situation", purpose: "Present the case briefly." }),
    section({ id: "background", title: "Background", purpose: "Provide necessary context." }),
    section({ id: "problem", title: "Problem", purpose: "Define the core problem." }),
    section({
      id: "evidence",
      title: "Evidence",
      purpose: "Gather relevant facts and constraints.",
      knowledgeConceptIds: ["writing-evidence"],
    }),
    section({
      id: "analysis",
      title: "Analysis",
      purpose: "Interpret causes and stakes.",
      knowledgeConceptIds: ["writing-analysis", "writing-reasoning"],
    }),
    section({ id: "solutions", title: "Possible solutions", purpose: "Compare viable options." }),
    section({
      id: "recommendation",
      title: "Recommendation",
      purpose: "Choose and justify a path.",
      knowledgeConceptIds: ["writing-claim", "writing-reasoning"],
    }),
    section({
      id: "conclusion",
      title: "Conclusion",
      purpose: "Close with implementation notes or risks.",
      knowledgeConceptIds: ["writing-conclusion"],
    }),
  ],
};

export const DISCUSSION_POST_WRITING_TYPE: HaulWritingType = {
  id: "discussion-post",
  title: "Discussion Post",
  category: "school",
  description: "Respond to a prompt with support and connection.",
  purpose: "Contribute thoughtfully to a class discussion.",
  specialization: "full",
  availableTools: [...DEFAULT_TOOLS],
  sections: [
    section({ id: "prompt", title: "Prompt", purpose: "Restate or quote the discussion prompt.", required: false }),
    section({
      id: "response",
      title: "Initial response",
      purpose: "State your main response.",
      knowledgeConceptIds: ["writing-claim", "writing-purpose"],
    }),
    section({
      id: "evidence",
      title: "Evidence / support",
      purpose: "Support with course ideas, examples, or sources.",
      knowledgeConceptIds: ["writing-evidence"],
    }),
    section({
      id: "explanation",
      title: "Explanation",
      purpose: "Explain how the support backs your response.",
      knowledgeConceptIds: ["writing-reasoning", "writing-analysis"],
    }),
    section({ id: "connection", title: "Connection", purpose: "Connect to peers, readings, or experience." }),
    section({
      id: "closing",
      title: "Closing thought",
      purpose: "End with a question or clear wrap-up.",
      knowledgeConceptIds: ["writing-conclusion"],
    }),
  ],
};

export const PROFESSIONAL_EMAIL_WRITING_TYPE: HaulWritingType = {
  id: "professional-email",
  title: "Professional Email",
  category: "professional",
  description: "Write a clear, polite professional email.",
  purpose: "Communicate a request or update professionally.",
  specialization: "full",
  availableTools: [...DEFAULT_TOOLS],
  sections: [
    section({
      id: "subject",
      title: "Subject line",
      purpose: "State the purpose clearly.",
      knowledgeConceptIds: ["writing-purpose", "writing-clarity"],
    }),
    section({ id: "greeting", title: "Greeting", purpose: "Address the recipient appropriately." }),
    section({
      id: "purpose",
      title: "Purpose",
      purpose: "Say why you are writing in the first lines.",
      knowledgeConceptIds: ["writing-purpose", "writing-audience"],
    }),
    section({
      id: "details",
      title: "Details",
      purpose: "Provide necessary context and specifics.",
      knowledgeConceptIds: ["writing-clarity"],
    }),
    section({ id: "ask", title: "Ask / next step", purpose: "State the request or expected action." }),
    section({ id: "closing", title: "Closing", purpose: "Close politely with name/signature." }),
  ],
};

/** Additional catalog entries with structured (not yet deeply pedagogical) templates. */
function genericStructured(
  id: string,
  title: string,
  category: HaulWritingType["category"],
  description: string,
  purpose: string,
  sectionTitles: string[],
): HaulWritingType {
  return {
    id,
    title,
    category,
    description,
    purpose,
    specialization: "structured",
    availableTools: [...DEFAULT_TOOLS],
    sections: sectionTitles.map((t, i) =>
      section({
        id: `${id}-s${i + 1}`,
        title: t,
        purpose: `Develop the “${t}” part of your ${title.toLowerCase()}.`,
        required: i < 3,
      }),
    ),
  };
}

export const ADDITIONAL_WRITING_TYPES: HaulWritingType[] = [
  genericStructured(
    "persuasive",
    "Persuasive Paper",
    "academic",
    "Persuade an audience toward a position.",
    "Move readers toward agreement or action.",
    ["Introduction", "Position", "Support 1", "Support 2", "Appeal / call", "Conclusion"],
  ),
  genericStructured(
    "literature-review",
    "Literature Review",
    "academic",
    "Synthesize published work on a topic.",
    "Map what is known and where gaps remain.",
    ["Scope", "Themes", "Key studies", "Synthesis", "Gaps", "Conclusion"],
  ),
  genericStructured(
    "short-answer",
    "Short Answer",
    "school",
    "Answer a prompt briefly and completely.",
    "Respond directly with support.",
    ["Restate prompt", "Direct answer", "Support", "Closing"],
  ),
  genericStructured(
    "book-response",
    "Book / Article Response",
    "school",
    "Respond to a reading with summary and reaction.",
    "Show understanding and thoughtful response.",
    ["Summary", "Key ideas", "Response", "Connection", "Closing"],
  ),
  genericStructured(
    "project-writeup",
    "Project Write-Up",
    "school",
    "Document a project’s process and outcome.",
    "Explain what you built and what you learned.",
    ["Goal", "Process", "Outcome", "Reflection"],
  ),
  genericStructured(
    "business-report",
    "Business Report",
    "professional",
    "Report findings and recommendations for a workplace audience.",
    "Inform decisions with clear structure.",
    ["Executive summary", "Background", "Findings", "Recommendations", "Appendix notes"],
  ),
  genericStructured(
    "proposal",
    "Proposal",
    "professional",
    "Propose a plan, project, or solution.",
    "Persuade stakeholders to approve a plan.",
    ["Problem", "Proposed solution", "Benefits", "Plan / timeline", "Ask"],
  ),
  genericStructured(
    "resume",
    "Resume",
    "professional",
    "Present experience and skills for opportunities.",
    "Highlight fit for a role clearly.",
    ["Contact", "Summary", "Experience", "Education", "Skills"],
  ),
  genericStructured(
    "cover-letter",
    "Cover Letter",
    "professional",
    "Introduce yourself for a specific opportunity.",
    "Connect your background to the role.",
    ["Greeting", "Hook / interest", "Fit evidence", "Closing ask"],
  ),
  genericStructured(
    "personal-statement",
    "Personal Statement",
    "professional",
    "Tell a focused story of purpose and readiness.",
    "Show who you are and why this path.",
    ["Opening story", "Growth", "Goals", "Fit", "Closing"],
  ),
  genericStructured(
    "story",
    "Story",
    "creative",
    "Write a creative narrative.",
    "Engage readers through story craft.",
    ["Opening", "Characters", "Conflict", "Rising action", "Climax", "Resolution"],
  ),
  genericStructured(
    "creative-narrative",
    "Narrative",
    "creative",
    "Creative narrative writing.",
    "Tell a story with voice and detail.",
    ["Opening", "Development", "Turning point", "Ending"],
  ),
  genericStructured(
    "script",
    "Script",
    "creative",
    "Write scenes in script form.",
    "Convey story through dialogue and action.",
    ["Logline", "Scene 1", "Scene 2", "Dialogue focus", "Closing beat"],
  ),
];

export const HAUL_WRITING_TYPES: HaulWritingType[] = [
  ESSAY_WRITING_TYPE,
  ARGUMENTATIVE_WRITING_TYPE,
  COMPARE_CONTRAST_WRITING_TYPE,
  RESEARCH_PAPER_WRITING_TYPE,
  ANALYTICAL_WRITING_TYPE,
  EXPOSITORY_WRITING_TYPE,
  NARRATIVE_ESSAY_WRITING_TYPE,
  REFLECTIVE_WRITING_TYPE,
  LAB_REPORT_WRITING_TYPE,
  CASE_STUDY_WRITING_TYPE,
  DISCUSSION_POST_WRITING_TYPE,
  PROFESSIONAL_EMAIL_WRITING_TYPE,
  ...ADDITIONAL_WRITING_TYPES,
];

const BY_ID = new Map(HAUL_WRITING_TYPES.map((t) => [t.id, t]));

export function listHaulWritingTypes(): readonly HaulWritingType[] {
  return HAUL_WRITING_TYPES;
}

export function getHaulWritingType(id: string): HaulWritingType | null {
  return BY_ID.get(id) ?? null;
}

export function listHaulWritingTypesByCategory(
  category: HaulWritingType["category"],
): HaulWritingType[] {
  return HAUL_WRITING_TYPES.filter((t) => t.category === category);
}

export const HAUL_WRITING_CATEGORY_LABELS: Record<
  HaulWritingType["category"],
  string
> = {
  academic: "Academic Writing",
  school: "School Writing",
  professional: "Professional Writing",
  creative: "Creative Writing",
};

/** Heuristic assignment → writing type suggestion (never forced). */
export function suggestHaulWritingTypeFromAssignment(
  prompt: string,
): { typeId: string; confidence: "high" | "medium" | "low" } | null {
  const t = prompt.toLowerCase();
  if (!t.trim()) return null;
  if (/lab report|hypothesis|procedure|materials/.test(t)) {
    return { typeId: "lab-report", confidence: "high" };
  }
  if (/argumentative|argue whether|take a position|counterargument/.test(t)) {
    return { typeId: "argumentative", confidence: "high" };
  }
  if (/compare and contrast|compare & contrast|similarities and differences/.test(t)) {
    return { typeId: "compare-contrast", confidence: "high" };
  }
  if (/research paper|literature review|cite sources|annotated bibliography/.test(t)) {
    return { typeId: /literature review/.test(t) ? "literature-review" : "research-paper", confidence: "medium" };
  }
  if (/case study|recommend.*(solution|action)/.test(t)) {
    return { typeId: "case-study", confidence: "medium" };
  }
  if (/discussion post|respond to the prompt|forum/.test(t)) {
    return { typeId: "discussion-post", confidence: "high" };
  }
  if (/email|subject line/.test(t)) {
    return { typeId: "professional-email", confidence: "medium" };
  }
  if (/5-?paragraph|essay/.test(t)) {
    return { typeId: "essay", confidence: "medium" };
  }
  return { typeId: "essay", confidence: "low" };
}
