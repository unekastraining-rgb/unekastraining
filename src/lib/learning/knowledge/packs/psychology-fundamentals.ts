/**
 * Knowledge pack: Psychology fundamentals (proof domain).
 * Canonical instructional knowledge — not a course pack requirement.
 */

import type { InstructionalKnowledgePack } from "@/lib/learning/knowledge/instructional-library";
import { registerInstructionalPack } from "@/lib/learning/knowledge/instructional-library";
import { klConcept } from "@/lib/learning/knowledge/packs/helpers";

export const PSYCHOLOGY_FUNDAMENTALS_PACK: InstructionalKnowledgePack = {
  id: "psychology-fundamentals",
  match: [
    "psychology",
    "teach me psychology",
    "classical conditioning",
    "operant conditioning",
    "psychology fundamentals",
    "intro to psychology",
  ],
  domain: "science",
  subject: "psychology",
  displayTitle: "Psychology fundamentals",
  learningFrame:
    "Core psychology: learning through association and consequence, memory basics, and how behavior is shaped.",
  cheatSheet:
    "Classical conditioning → Operant conditioning → Reinforcement → Memory → Social influence",
  concepts: [
    klConcept({
      id: "psychology-classical-conditioning",
      title: "Classical conditioning",
      aliases: [
        "Pavlovian conditioning",
        "classical conditioning psychology",
        "teach me classical conditioning",
      ],
      definition:
        "Classical conditioning is learning in which a neutral stimulus comes to elicit a response after being paired with a stimulus that naturally produces that response.",
      explanation:
        "An unconditioned stimulus (US) naturally triggers an unconditioned response (UR). A neutral stimulus paired with the US becomes a conditioned stimulus (CS) that elicits a conditioned response (CR). Timing and repeated pairing matter. Extinction occurs when the CS is presented without the US until the CR weakens. Classical conditioning explains many automatic emotional and physiological associations — not voluntary skill learning.",
      purpose: "Explain how associations form between stimuli and automatic responses.",
      example:
        "Pavlov: bell (CS) paired with food (US) → salivation (CR) to the bell alone.",
      examples: [
        "A hospital smell (CS) paired with nausea-inducing treatment (US) → nausea (CR) on later smell alone",
      ],
      nonExamples: [
        "Teaching a dog to sit for a treat (that is operant conditioning — behavior → consequence)",
      ],
      nonExample: "Studying harder after failing a test (consequence-shaped voluntary behavior)",
      representation:
        "US → UR; CS + US → UR; after learning: CS → CR",
      breakdown:
        "US/UR → pairing with neutral stimulus → CS/CR → extinction / generalization",
      misconceptions: [
        "Classical conditioning is not the same as rewarding voluntary actions.",
      ],
      misconception: "Calling any learning with a reward “classical conditioning.”",
      misconceptionDetails: [
        {
          misconception:
            "Classical conditioning means learning because you get a reward after doing something.",
          why: "Reward language is common in everyday talk about learning.",
          correction:
            "Rewards after voluntary behavior are operant. Classical pairs stimuli so a response becomes automatic to a new cue.",
          contrast: "classical (stimulus→stimulus) vs operant (behavior→consequence)",
          diagnosticClue: "Student describes “training a dog to sit” as classical conditioning",
        },
      ],
      vocabulary: [
        "unconditioned stimulus",
        "conditioned stimulus",
        "unconditioned response",
        "conditioned response",
        "extinction",
        "generalization",
      ],
      relatedConcepts: [
        "psychology-operant-conditioning",
        "psychology-reinforcement",
      ],
      relationships: [
        {
          kind: "contrasts_with",
          targetConceptId: "psychology-operant-conditioning",
          reason: "Association of stimuli vs consequence of behavior",
        },
        {
          kind: "related_to",
          targetConceptId: "psychology-reinforcement",
          reason: "Both shape learning, different mechanisms",
        },
      ],
      visualModels: ["Timeline: before pairing → during pairing → after learning"],
      procedures: [
        "Identify US and UR",
        "Identify the neutral stimulus being paired",
        "Predict the CS and CR after learning",
      ],
      scenarios: [
        "A child hears a can opener (CS) before being fed and later salivates to the sound alone",
      ],
      applications: ["Phobia acquisition", "Advertising cue pairing", "Taste aversions"],
      transferPrompts: [
        "Design a classical-conditioning explanation for anxiety before exams triggered by a classroom smell.",
      ],
      practiceForms: ["identify", "explain", "scenario", "compare"],
      assessmentForms: [
        "label US/UR/CS/CR",
        "distinguish classical vs operant",
        "predict extinction",
      ],
      masteryCriteria: [
        "Can label US, UR, CS, CR in a novel example",
        "Can contrast classical with operant conditioning",
      ],
      difficulty: 2,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "intro-psych-survey",
          label: "Intro Psychology",
          unit: "Learning",
          chapter: "Classical conditioning",
          conceptId: "psychology-classical-conditioning",
        },
      ],
      checkPrompt: "In Pavlov’s setup, what becomes the conditioned stimulus?",
    }),
    klConcept({
      id: "psychology-operant-conditioning",
      title: "Operant conditioning",
      aliases: ["instrumental conditioning", "Skinnerian conditioning"],
      definition:
        "Operant conditioning is learning in which behavior is strengthened or weakened by its consequences.",
      explanation:
        "Organisms emit voluntary behaviors (operants). Consequences that increase behavior are reinforcement; those that decrease it are punishment. Positive/negative refer to adding or removing a stimulus — not “good” or “bad.” Schedules of reinforcement affect how strongly and persistently behavior continues.",
      purpose: "Explain how consequences shape voluntary behavior.",
      example: "A student who earns points for homework completion does homework more often (positive reinforcement).",
      examples: ["Removing an annoying alarm when you buckle a seatbelt (negative reinforcement)"],
      nonExamples: ["Salivating to a bell after food pairing (classical)"],
      misconceptions: ["Negative reinforcement is not the same as punishment."],
      misconception: "Calling any unpleasant outcome “negative reinforcement.”",
      vocabulary: [
        "reinforcement",
        "punishment",
        "positive",
        "negative",
        "schedule",
      ],
      relatedConcepts: [
        "psychology-classical-conditioning",
        "psychology-reinforcement",
      ],
      relationships: [
        {
          kind: "contrasts_with",
          targetConceptId: "psychology-classical-conditioning",
        },
        { kind: "contains", targetConceptId: "psychology-reinforcement" },
      ],
      practiceForms: ["classify", "scenario", "explain"],
      assessmentForms: ["classify consequence type", "predict behavior change"],
      completeness: "teachable",
      checkPrompt: "How does negative reinforcement differ from punishment?",
    }),
    klConcept({
      id: "psychology-reinforcement",
      title: "Reinforcement",
      aliases: ["reinforcement psychology", "positive reinforcement"],
      parentConceptId: "psychology-operant-conditioning",
      definition:
        "Reinforcement is a consequence that increases the future likelihood of a behavior.",
      explanation:
        "Positive reinforcement adds a desirable stimulus after a behavior. Negative reinforcement removes an aversive stimulus after a behavior. Both increase behavior. Continuous schedules build quickly; intermittent schedules can make behavior more persistent.",
      purpose: "Specify how consequences strengthen behavior.",
      example: "Praise after a correct answer increases hand-raising.",
      misconceptions: ["Reinforcement always means giving a treat."],
      misconception: "Assuming reinforcement must be tangible.",
      vocabulary: ["positive reinforcement", "negative reinforcement", "schedule"],
      relatedConcepts: ["psychology-operant-conditioning"],
      relationships: [
        { kind: "part_of", targetConceptId: "psychology-operant-conditioning" },
      ],
      practiceForms: ["identify", "scenario"],
      assessmentForms: ["identify reinforcement type"],
      completeness: "teachable",
      checkPrompt: "Does reinforcement increase or decrease behavior?",
    }),
    klConcept({
      id: "psychology-memory-basics",
      title: "Memory basics",
      aliases: ["memory psychology", "encoding storage retrieval"],
      definition:
        "Memory involves encoding information, storing it, and retrieving it later.",
      explanation:
        "Encoding transforms experience into a memory trace. Storage maintains it over time. Retrieval brings it back into use. Failures can happen at any stage. Working memory holds limited information in the moment; long-term memory is more durable but still reconstructive.",
      purpose: "Frame how people retain and recall information.",
      example: "Rehearsing a phone number keeps it in working memory until you dial.",
      misconceptions: ["Memory is not a perfect video recording."],
      misconception: "Assuming retrieval always reproduces the original event exactly.",
      vocabulary: ["encoding", "storage", "retrieval", "working memory"],
      relatedConcepts: ["psychology-classical-conditioning"],
      practiceForms: ["explain", "apply"],
      assessmentForms: ["explain encoding vs retrieval"],
      completeness: "teachable",
      checkPrompt: "Name the three core memory processes.",
    }),
  ],
};

registerInstructionalPack(PSYCHOLOGY_FUNDAMENTALS_PACK);
