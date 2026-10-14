/**
 * Knowledge pack: Biology / life science fundamentals (proof domain).
 */

import type { InstructionalKnowledgePack } from "@/lib/learning/knowledge/instructional-library";
import { registerInstructionalPack } from "@/lib/learning/knowledge/instructional-library";
import { klConcept } from "@/lib/learning/knowledge/packs/helpers";

export const BIOLOGY_FUNDAMENTALS_PACK: InstructionalKnowledgePack = {
  id: "biology-fundamentals",
  match: [
    "biology",
    "teach me biology",
    "cell biology",
    "photosynthesis",
    "biology fundamentals",
    "intro to biology",
  ],
  domain: "science",
  subject: "biology",
  displayTitle: "Biology fundamentals",
  learningFrame:
    "Life science foundations: cells as units of life, then energy flow through photosynthesis and cellular respiration.",
  cheatSheet:
    "Cell structure → Cell membrane → Photosynthesis → Cellular respiration → Homeostasis",
  concepts: [
    klConcept({
      id: "biology-cell-structure",
      title: "Cell structure",
      aliases: ["cells biology", "cell organelles", "what is a cell"],
      definition:
        "The cell is the basic unit of life; eukaryotic cells contain membrane-bound organelles that compartmentalize functions.",
      explanation:
        "All living organisms are made of cells. Prokaryotes lack a nucleus; eukaryotes have a nucleus and organelles (mitochondria, endoplasmic reticulum, Golgi, etc.). Structure supports function — membranes create compartments for specialized chemistry.",
      purpose: "Establish the cellular basis of life.",
      example: "Plant cells have chloroplasts and a cell wall; animal cells do not.",
      examples: ["Nucleus stores DNA; mitochondria produce ATP"],
      nonExamples: ["A virus is not a cell"],
      misconceptions: ["All cells look like animal cells in textbooks."],
      misconception: "Assuming plant and animal cells are identical.",
      vocabulary: ["organelle", "nucleus", "membrane", "prokaryote", "eukaryote"],
      relatedConcepts: ["biology-photosynthesis", "biology-cell-membrane"],
      relationships: [
        { kind: "leads_to", targetConceptId: "biology-photosynthesis" },
        { kind: "related_to", targetConceptId: "biology-cell-membrane" },
      ],
      visualModels: ["Labeled eukaryotic cell diagram"],
      practiceForms: ["identify", "compare", "label"],
      assessmentForms: ["label organelles", "compare plant vs animal"],
      completeness: "teachable",
      curriculumMappings: [
        {
          curriculumId: "hs-biology",
          label: "High School Biology",
          unit: "Cells",
          conceptId: "biology-cell-structure",
        },
      ],
      checkPrompt: "Name one organelle unique to plant cells.",
    }),
    klConcept({
      id: "biology-cell-membrane",
      title: "Cell membrane",
      aliases: ["plasma membrane", "cell membrane biology"],
      definition:
        "The cell membrane is a selectively permeable boundary that controls what enters and leaves the cell.",
      explanation:
        "A phospholipid bilayer with embedded proteins forms the membrane. Selective permeability maintains internal conditions. Diffusion, osmosis, and active transport move materials.",
      purpose: "Explain how cells regulate exchange with their environment.",
      example: "Oxygen diffuses into cells down its concentration gradient.",
      misconceptions: ["The membrane is not a solid wall — it is fluid and dynamic."],
      misconception: "Thinking the membrane blocks all movement.",
      vocabulary: ["phospholipid", "selective permeability", "diffusion"],
      relatedConcepts: ["biology-cell-structure"],
      relationships: [
        { kind: "part_of", targetConceptId: "biology-cell-structure" },
      ],
      practiceForms: ["explain", "predict"],
      assessmentForms: ["explain selective permeability"],
      completeness: "teachable",
      checkPrompt: "What does selectively permeable mean?",
    }),
    klConcept({
      id: "biology-photosynthesis",
      title: "Photosynthesis",
      aliases: ["teach me photosynthesis", "photosynthesis biology"],
      definition:
        "Photosynthesis converts light energy into chemical energy stored in sugars, releasing oxygen as a byproduct in oxygenic photosynthesis.",
      explanation:
        "In chloroplasts, light reactions capture energy and produce ATP/NADPH; the Calvin cycle fixes carbon dioxide into sugars. Overall: carbon dioxide + water + light → glucose + oxygen (simplified). Photosynthesis links solar energy to ecosystems.",
      purpose: "Explain how producers capture energy for food webs.",
      example: "A leaf’s chloroplasts produce sugars that fuel the plant and feed consumers.",
      examples: ["6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂ (simplified overall)"],
      nonExamples: ["Cellular respiration is not photosynthesis — it releases energy from sugars"],
      representation: "Light → chloroplast → sugars + O₂",
      misconceptions: ["Plants do not “only” do photosynthesis — they also respire."],
      misconception: "Believing plants never use cellular respiration.",
      misconceptionDetails: [
        {
          misconception: "Photosynthesis replaces cellular respiration in plants.",
          correction:
            "Plants photosynthesize and also respire; photosynthesis stores energy, respiration releases it.",
          contrast: "photosynthesis vs cellular respiration",
        },
      ],
      vocabulary: ["chloroplast", "chlorophyll", "Calvin cycle", "light reactions"],
      prerequisites: ["biology-cell-structure"],
      relatedConcepts: ["biology-cellular-respiration", "biology-cell-structure"],
      relationships: [
        { kind: "prerequisite", targetConceptId: "biology-cell-structure" },
        {
          kind: "contrasts_with",
          targetConceptId: "biology-cellular-respiration",
          reason: "Energy capture vs energy release",
        },
      ],
      visualModels: ["Chloroplast cross-section with light and Calvin cycle"],
      procedures: [
        "Locate chloroplasts",
        "State overall equation",
        "Separate light reactions from carbon fixation at a high level",
      ],
      practiceForms: ["explain", "diagram", "compare"],
      assessmentForms: ["write overall equation", "contrast with respiration"],
      completeness: "teachable",
      curriculumMappings: [
        {
          curriculumId: "intro-biology",
          label: "Intro Biology",
          unit: "Energy and metabolism",
          conceptId: "biology-photosynthesis",
        },
      ],
      checkPrompt: "What are the main products of oxygenic photosynthesis?",
    }),
    klConcept({
      id: "biology-cellular-respiration",
      title: "Cellular respiration",
      aliases: ["respiration biology", "ATP cellular respiration"],
      definition:
        "Cellular respiration breaks down sugars (and other fuels) to release usable energy as ATP.",
      explanation:
        "Glycolysis, the Krebs cycle, and the electron transport chain convert glucose and oxygen into ATP, carbon dioxide, and water (aerobic). It is complementary to photosynthesis in ecosystems, not identical to breathing alone.",
      purpose: "Explain how cells harvest energy from food.",
      example: "Muscle cells increase respiration rate during exercise to supply ATP.",
      relatedConcepts: ["biology-photosynthesis"],
      relationships: [
        {
          kind: "contrasts_with",
          targetConceptId: "biology-photosynthesis",
        },
      ],
      practiceForms: ["explain", "compare"],
      assessmentForms: ["contrast photosynthesis and respiration"],
      completeness: "teachable",
      checkPrompt: "What molecule is the main usable energy product of respiration?",
    }),
  ],
};

registerInstructionalPack(BIOLOGY_FUNDAMENTALS_PACK);
