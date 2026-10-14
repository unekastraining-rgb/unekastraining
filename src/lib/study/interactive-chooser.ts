/**
 * Bundle K — Learner-facing interactive practice chooser labels.
 * Uses Knowledge Library / activity runtime forms — does not invent support.
 */

import {
  listAvailableInteractiveForms,
  type InteractiveForm,
} from "@/lib/learning/activity/runtime";

export type InteractiveChooserOption = {
  form: InteractiveForm;
  label: string;
  description: string;
};

const FORM_LABELS: Partial<
  Record<InteractiveForm, { label: string; description: string }>
> = {
  multiple_choice: {
    label: "Quick Check",
    description: "Pick the best answer.",
  },
  true_false: {
    label: "True or False",
    description: "Decide if the statement is true.",
  },
  multi_select: {
    label: "Select All That Apply",
    description: "Choose every correct option.",
  },
  matching: {
    label: "Match It",
    description: "Pair terms with definitions.",
  },
  equation_solve: {
    label: "Solve It",
    description: "Work through an equation.",
  },
  code_write: {
    label: "Write Code",
    description: "Write a short code solution.",
  },
  code_predict: {
    label: "Predict the Output",
    description: "Say what the code will do.",
  },
  code_trace: {
    label: "Trace the Code",
    description: "Follow the code step by step.",
  },
  sql_write: {
    label: "Write SQL",
    description: "Write a query for the schema.",
  },
  diagram_label: {
    label: "Diagram It",
    description: "Label parts of a diagram.",
  },
  explain: {
    label: "Explain It",
    description: "Explain the idea in your own words.",
  },
  short_answer: {
    label: "Short Answer",
    description: "Write a brief response.",
  },
  fill_in: {
    label: "Fill In",
    description: "Complete the missing piece.",
  },
  ordering: {
    label: "Put in Order",
    description: "Arrange steps in the right order.",
  },
  classification: {
    label: "Classify",
    description: "Sort items into categories.",
  },
  prediction: {
    label: "Predict",
    description: "Predict what happens next.",
  },
  scenario: {
    label: "Scenario",
    description: "Respond to a realistic situation.",
  },
};

/**
 * Options the learner may choose for a KL concept — only forms the runtime can build.
 */
export function listInteractiveChooserOptions(
  conceptId: string,
): InteractiveChooserOption[] {
  const forms = listAvailableInteractiveForms(conceptId);
  return forms.map((form) => {
    const meta = FORM_LABELS[form] ?? {
      label: "Practice",
      description: "Practice this concept.",
    };
    return { form, label: meta.label, description: meta.description };
  });
}

/** Studio / Learning launch into interactive practice for a form. */
export function buildInteractivePracticeHref(input: {
  conceptId: string;
  form?: InteractiveForm;
  courseId?: string | null;
  topic?: string | null;
}): string {
  const params = new URLSearchParams();
  params.set("conceptId", input.conceptId);
  if (input.form) params.set("form", input.form);
  if (input.courseId) params.set("courseId", input.courseId);
  if (input.topic) params.set("topic", input.topic);
  // Learning Studio interactive stage — existing teach-me / activity runtime path
  return `/study/teach-me?${params.toString()}&focus=practice`;
}
