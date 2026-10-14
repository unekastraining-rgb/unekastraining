/**
 * Knowledge pack: Economics fundamentals (expanded Phase 6).
 * Preserves economics-supply-demand and economics-opportunity-cost.
 */

import type { InstructionalKnowledgePack } from "@/lib/learning/knowledge/instructional-library";
import { registerInstructionalPack } from "@/lib/learning/knowledge/instructional-library";
import { klConcept } from "@/lib/learning/knowledge/packs/helpers";

export const ECONOMICS_FUNDAMENTALS_PACK: InstructionalKnowledgePack = {
  id: "economics-fundamentals",
  match: [
    "supply and demand",
    "supply & demand",
    "economics supply and demand",
    "opportunity cost",
    "economic opportunity cost",
    "scarcity economics",
    "elasticity economics",
    "economics fundamentals",
    "intro to economics",
  ],
  domain: "business",
  subject: "economics",
  displayTitle: "Economics fundamentals",
  learningFrame:
    "Introductory economics: scarcity and trade-offs, supply and demand, equilibrium, and elasticity.",
  cheatSheet:
    "Scarcity → Opportunity cost → Demand ↔ Supply → Equilibrium → Elasticity",
  concepts: [
    klConcept({
      id: "economics-scarcity",
      title: "Scarcity",
      aliases: ["scarcity in economics", "economic scarcity", "scarce resources"],
      definition:
        "Scarcity means wants exceed the resources available to satisfy them, so choices are required.",
      explanation:
        "Time, money, labor, and materials are limited. Because of scarcity, every society and person faces trade-offs. Economics studies how those choices are made. Scarcity is not the same as poverty — even wealthy people face scarce time.",
      purpose: "Explain why trade-offs exist.",
      example:
        "You have three evening hours and want to study, work, and rest — you cannot fully do all three.",
      misconceptions: ["Scarcity is not only about money."],
      misconception: "Thinking scarcity disappears if income is high.",
      vocabulary: ["scarcity", "resources", "wants", "trade-off"],
      relatedConcepts: ["economics-opportunity-cost", "economics-incentives"],
      practiceForms: ["scenario", "explain"],
      masteryCriteria: ["Can define scarcity and give a non-money example"],
      difficulty: 1,
      checkPrompt: "Why does scarcity force choices?",
    }),
    klConcept({
      id: "economics-opportunity-cost",
      title: "Opportunity cost",
      aliases: [
        "economic opportunity cost",
        "opportunity cost in economics",
        "definition of opportunity cost",
      ],
      role: "concept",
      definition:
        "Opportunity cost is the value of the next-best alternative you give up when you make a choice.",
      explanation:
        "Every choice uses scarce resources. Opportunity cost includes what you forgo — not only cash spent. Economists compare trade-offs honestly: a cheap option can be costly if it blocks a better use of time.",
      purpose: "Make trade-offs visible.",
      example:
        "Choosing a movie over a paid tutoring shift: opportunity cost includes the wages not earned.",
      examples: [
        "Planting corn on land that could grow soy includes forgone soy profit.",
      ],
      nonExamples: [
        "Listing only sticker price while ignoring alternative uses of money/time",
      ],
      misconceptions: [
        "Opportunity cost is not only the money paid.",
      ],
      misconception:
        "Counting only explicit cash costs and ignoring forgone alternatives.",
      vocabulary: ["trade-off", "forgone", "next-best alternative"],
      relatedConcepts: ["economics-scarcity", "economics-supply-demand"],
      practiceForms: ["scenario", "explain"],
      masteryCriteria: [
        "Can state opportunity cost as the next-best alternative forgone",
      ],
      difficulty: 1,
      checkPrompt: "What is opportunity cost in one sentence?",
    }),
    klConcept({
      id: "economics-incentives",
      title: "Incentives",
      aliases: ["economic incentives", "incentives in economics"],
      definition:
        "Incentives are rewards or penalties that influence choices.",
      explanation:
        "People respond to incentives — prices, grades, fines, praise. Changing incentives changes behavior, sometimes with unintended side effects. Good policy anticipates those responses.",
      purpose: "Predict how people respond to rewards and penalties.",
      example:
        "A fine for late library books increases return rates; a bonus for sales may increase sales calls.",
      misconceptions: ["Incentives are not only money — status and convenience matter too."],
      misconception: "Assuming only cash incentives change behavior.",
      vocabulary: ["incentive", "penalty", "unintended consequence"],
      relatedConcepts: ["economics-scarcity"],
      practiceForms: ["scenario"],
      masteryCriteria: ["Can give an example of a non-monetary incentive"],
      difficulty: 1,
      checkPrompt: "Give one example of an incentive that is not cash.",
    }),
    klConcept({
      id: "economics-supply-demand",
      title: "Supply and demand",
      aliases: [
        "supply & demand",
        "economics supply and demand",
        "supply and demand in economics",
        "market supply and demand",
        "teach me supply and demand",
      ],
      role: "concept",
      definition:
        "Supply and demand describe how much sellers offer and buyers want at each price; together they help determine market price and quantity.",
      explanation:
        "Demand usually falls as price rises; supply usually rises as price rises. Movement along a curve is a price change; a shift moves the whole curve when non-price determinants change (income, tastes, input costs, technology). Surpluses and shortages push prices toward equilibrium. Elasticity measures responsiveness of quantity to price.",
      purpose: "Explain how prices and quantities emerge in markets.",
      example:
        "If demand for coffee rises and supply is unchanged, equilibrium price tends to rise.",
      examples: [
        "Drought reduces crop supply → higher equilibrium price.",
        "A fad increases demand → higher price and quantity if supply fixed in the short run.",
      ],
      nonExamples: [
        "A single store’s sticker price with no reference to buyers’ willingness",
      ],
      nonExample: "Treating “demand” as a fixed number of units people want at any price",
      representation:
        "Price\n  ↑\n  |  Supply /\n  |         X ← equilibrium\n  |  Demand \\\n  +------------→ Quantity",
      breakdown:
        "scarcity → markets → buyers/sellers → demand → supply → equilibrium → shifts vs movements → elasticity",
      misconceptions: [
        "Price is not only set by sellers in competitive markets — demand matters too.",
      ],
      misconception:
        "Assuming demand equals what people wish they could buy regardless of price.",
      misconceptionDetails: [
        {
          misconception: "A shift and a movement along the curve are the same.",
          why: "Both change observed quantity.",
          correction:
            "Movement along = response to own price; shift = change in a non-price determinant.",
          contrast: "movement along vs shift",
        },
      ],
      vocabulary: [
        "demand",
        "supply",
        "shortage",
        "surplus",
        "shift",
        "equilibrium",
        "elasticity",
        "scarcity",
      ],
      prerequisites: ["economics-scarcity"],
      relatedConcepts: [
        "economics-equilibrium",
        "economics-elasticity",
        "economics-scarcity",
        "economics-opportunity-cost",
      ],
      relationships: [
        { kind: "prerequisite", targetConceptId: "economics-scarcity", reason: "Markets allocate scarce resources" },
        { kind: "leads_to", targetConceptId: "economics-equilibrium" },
        { kind: "related_to", targetConceptId: "economics-elasticity" },
        { kind: "related_to", targetConceptId: "economics-opportunity-cost" },
      ],
      visualModels: ["Supply-demand graph with labeled shift vs movement"],
      procedures: [
        "Draw demand downward, supply upward",
        "Find intersection (equilibrium)",
        "Decide shift vs movement for a news event",
      ],
      scenarios: ["A new factory lowers production costs — which curve shifts?"],
      applications: ["Commodity markets", "Ticket pricing", "Policy analysis"],
      transferPrompts: [
        "Analyze a rideshare surge-pricing event using supply, demand, and equilibrium.",
      ],
      workedExamples: [
        "Demand shifts right → new higher P* and Q*; annotate the graph",
      ],
      practiceForms: ["scenario", "diagram", "explain", "predict"],
      assessmentForms: [
        "define supply and demand",
        "predict price direction of a shift",
        "distinguish shift vs movement",
        "relate to scarcity",
      ],
      masteryCriteria: [
        "Can define supply and demand",
        "Can predict price direction of a simple shift",
        "Can distinguish movement along a curve from a shift",
      ],
      difficulty: 2,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "intro-microeconomics",
          label: "Intro Microeconomics",
          unit: "Supply and demand",
          conceptId: "economics-supply-demand",
        },
      ],
      checkPrompt: "What happens to equilibrium price if demand rises and supply stays the same?",
    }),
    klConcept({
      id: "economics-equilibrium",
      title: "Market equilibrium",
      aliases: ["equilibrium price", "economic equilibrium", "market clearing price"],
      definition:
        "Equilibrium is where quantity demanded equals quantity supplied at a price.",
      explanation:
        "At the equilibrium price, there is no built-in pressure from surplus or shortage. Real markets move as conditions change; equilibrium is a useful model for the balance point.",
      purpose: "Identify the market-clearing price/quantity in a simple model.",
      example:
        "If at $5 quantity demanded equals quantity supplied, $5 is the equilibrium price in that model.",
      misconceptions: ["Equilibrium does not mean prices never change in the real world."],
      misconception: "Thinking equilibrium means a frozen permanent price.",
      vocabulary: ["equilibrium", "market clearing"],
      relatedConcepts: ["economics-supply-demand"],
      practiceForms: ["diagram", "calculate"],
      masteryCriteria: ["Can find equilibrium from a simple schedule"],
      difficulty: 2,
      checkPrompt: "At equilibrium, how do quantity demanded and supplied compare?",
    }),
    klConcept({
      id: "economics-elasticity",
      title: "Elasticity",
      aliases: ["price elasticity of demand", "elastic demand", "inelastic demand"],
      definition:
        "Elasticity measures how responsive quantity is to a change in price (or another factor).",
      explanation:
        "If quantity demanded changes a lot when price changes, demand is elastic; if little, inelastic. Necessities with few substitutes tend to be more inelastic. Elasticity informs tax incidence and revenue effects.",
      purpose: "Measure responsiveness of buyers or sellers.",
      example:
        "If price rises 10% and quantity demanded falls 30%, demand is relatively elastic.",
      misconceptions: ["Elastic does not mean \"luxury\" automatically — it means responsive."],
      misconception: "Equating elastic only with expensive goods.",
      vocabulary: ["elastic", "inelastic", "responsiveness"],
      relatedConcepts: ["economics-supply-demand"],
      practiceForms: ["scenario", "explain"],
      masteryCriteria: ["Can contrast elastic vs inelastic demand in plain language"],
      difficulty: 2,
      checkPrompt: "What does it mean if demand is inelastic?",
    }),
    klConcept({
      id: "economics-marginal-analysis",
      title: "Marginal analysis",
      aliases: ["marginal cost benefit", "thinking at the margin"],
      definition:
        "Marginal analysis compares the extra benefit of one more unit to its extra cost.",
      explanation:
        "Decisions are often about a little more or less, not all-or-nothing. If marginal benefit exceeds marginal cost, do a bit more; otherwise stop. This frames many economic choices.",
      purpose: "Decide how much of an activity to do.",
      example:
        "Studying one more hour is worth it if the expected grade gain outweighs lost sleep/work.",
      misconceptions: ["Average cost is not the same as marginal cost."],
      misconception: "Using only averages to decide the next unit.",
      vocabulary: ["marginal benefit", "marginal cost"],
      relatedConcepts: ["economics-opportunity-cost"],
      practiceForms: ["scenario"],
      masteryCriteria: ["Can state the marginal rule in plain language"],
      difficulty: 2,
      checkPrompt: "When should you do one more unit of an activity?",
    }),
    klConcept({
      id: "economics-market-structures",
      title: "Market structures",
      aliases: ["perfect competition monopoly", "oligopoly monopolistic competition"],
      definition:
        "Market structures describe how competitive an industry is — from many sellers to one.",
      explanation:
        "Perfect competition has many sellers of similar products. Monopoly has one seller. Oligopoly has few. Monopolistic competition has many sellers of differentiated products. Structure affects pricing power.",
      purpose: "Classify how firms compete.",
      example:
        "A local wheat market with many farmers approximates competition; a patented drug may be closer to monopoly.",
      misconceptions: ["Most real markets are rarely textbook perfect competition."],
      misconception: "Assuming every market has no pricing power.",
      vocabulary: ["competition", "monopoly", "oligopoly", "differentiation"],
      relatedConcepts: ["economics-supply-demand"],
      practiceForms: ["classify", "explain"],
      masteryCriteria: ["Can name and briefly contrast two market structures"],
      difficulty: 2,
      checkPrompt: "How does monopoly differ from perfect competition?",
    }),
  ],
};

registerInstructionalPack(ECONOMICS_FUNDAMENTALS_PACK);
