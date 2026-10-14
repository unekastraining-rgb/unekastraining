/**
 * Knowledge pack: Business fundamentals (Phase 6).
 * Distinct from economics — firm-level business concepts.
 */

import type { InstructionalKnowledgePack } from "@/lib/learning/knowledge/instructional-library";
import { registerInstructionalPack } from "@/lib/learning/knowledge/instructional-library";
import { klConcept } from "@/lib/learning/knowledge/packs/helpers";

export const BUSINESS_FUNDAMENTALS_PACK: InstructionalKnowledgePack = {
  id: "business-fundamentals",
  match: [
    "business fundamentals",
    "intro to business",
    "entrepreneurship basics",
    "marketing basics",
    "marketing",
    "teach me marketing",
    "financial statements basics",
    "organizational structure business",
  ],
  domain: "business",
  subject: "business",
  displayTitle: "Business fundamentals",
  learningFrame:
    "Introductory business: creating value, organizing work, marketing, operations, and reading basic financial statements.",
  cheatSheet:
    "Entrepreneurship → Management/Org → Marketing → Operations → Accounting statements → Strategy",
  concepts: [
    klConcept({
      id: "business-entrepreneurship",
      title: "Entrepreneurship",
      aliases: ["starting a business", "entrepreneur basics"],
      definition:
        "Entrepreneurship is creating and growing a venture that delivers value under uncertainty.",
      explanation:
        "Entrepreneurs identify problems, test solutions, gather resources, and iterate. Risk and learning are central — not every idea succeeds. Value creation for customers comes before scaling.",
      purpose: "Frame how new ventures begin.",
      example:
        "A student builds a tutoring app, interviews classmates, and revises the offer based on feedback.",
      misconceptions: ["Entrepreneurship is not only inventing technology."],
      misconception: "Thinking entrepreneurship requires a patented invention.",
      vocabulary: ["venture", "customer", "uncertainty", "iterate"],
      relatedConcepts: ["business-strategy", "business-marketing"],
      practiceForms: ["scenario", "explain"],
      masteryCriteria: ["Can describe a simple customer problem → offer loop"],
      difficulty: 1,
      checkPrompt: "What does an entrepreneur create under uncertainty?",
    }),
    klConcept({
      id: "business-management",
      title: "Management",
      aliases: ["business management basics", "planning organizing leading controlling"],
      definition:
        "Management coordinates people and resources through planning, organizing, leading, and controlling.",
      explanation:
        "Managers set goals, assign work, motivate teams, and measure results. Good management aligns daily work with strategy without micromanaging every detail.",
      purpose: "Explain how organizations get work done.",
      example:
        "A store manager schedules shifts, trains staff, and reviews weekly sales against targets.",
      misconceptions: ["Management is not only giving orders."],
      misconception: "Equating management solely with authority.",
      vocabulary: ["planning", "organizing", "leading", "controlling"],
      relatedConcepts: ["business-org-structure"],
      practiceForms: ["explain", "scenario"],
      masteryCriteria: ["Can name the four classic management functions"],
      difficulty: 1,
      checkPrompt: "Name one of the four management functions.",
    }),
    klConcept({
      id: "business-org-structure",
      title: "Organizational structure",
      aliases: ["org chart", "organizational design basics"],
      definition:
        "Organizational structure defines roles, reporting lines, and how work is divided and coordinated.",
      explanation:
        "Functional structures group by specialty; divisional by product/region. Flat vs tall hierarchies change communication speed. Structure should fit strategy and size.",
      purpose: "Show how firms arrange people and authority.",
      example:
        "A small startup may be flat; a hospital may organize by clinical departments.",
      misconceptions: ["One structure is not best for every firm."],
      misconception: "Copying a big-company org chart for a 5-person team.",
      vocabulary: ["hierarchy", "functional", "divisional", "span of control"],
      relatedConcepts: ["business-management"],
      practiceForms: ["classify", "explain"],
      masteryCriteria: ["Can contrast flat vs hierarchical structures briefly"],
      difficulty: 2,
      checkPrompt: "What does an organizational structure define?",
    }),
    klConcept({
      id: "business-marketing",
      title: "Marketing",
      aliases: [
        "marketing basics",
        "4Ps marketing",
        "teach me marketing",
        "what is marketing",
      ],
      definition:
        "Marketing creates, communicates, and delivers offerings that have value for customers.",
      explanation:
        "Marketing starts from customer needs and wants, then designs value and delivers it through a coherent mix. Classic 4Ps: product, price, place, promotion. Research informs segmentation, targeting, and positioning. Branding shapes perception over time. Marketing is broader than advertising alone — it includes deciding who to serve and how to create exchange.",
      purpose: "Connect offerings to customer needs profitably and sustainably.",
      example:
        "A bakery prices lunch specials, posts on social media, and places goods near the register.",
      examples: [
        "A fitness app segments busy professionals, targets them with short workouts, and positions as “results in 20 minutes.”",
      ],
      nonExamples: [
        "Printing flyers with no idea who the customer is or what problem you solve",
      ],
      nonExample: "Equating marketing with a single Super Bowl ad",
      representation:
        "Needs → Value proposition → Segmentation/Targeting/Positioning → Marketing mix (4Ps) → Measure",
      breakdown:
        "Customer needs & value → research → segmentation → targeting → positioning → product/price/place/promotion → brand & results",
      misconceptions: ["Marketing ≠ only ads."],
      misconception: "Thinking marketing is just commercials.",
      misconceptionDetails: [
        {
          misconception: "Marketing is the same as advertising.",
          why: "Ads are the most visible tip of the mix.",
          correction:
            "Advertising is one promotion tool; marketing also includes product, price, place, research, and positioning.",
          contrast: "marketing (system) vs advertising (promotion tactic)",
        },
      ],
      vocabulary: [
        "customer value",
        "segmentation",
        "targeting",
        "positioning",
        "product",
        "price",
        "place",
        "promotion",
        "brand",
      ],
      prerequisites: ["business-entrepreneurship"],
      relatedConcepts: [
        "business-customer-value",
        "business-segmentation",
        "business-targeting",
        "business-positioning",
        "business-marketing-mix",
        "business-strategy",
      ],
      relationships: [
        { kind: "contains", targetConceptId: "business-customer-value", reason: "Value is the core exchange idea" },
        { kind: "contains", targetConceptId: "business-segmentation", reason: "Divide the market meaningfully" },
        { kind: "contains", targetConceptId: "business-targeting", reason: "Choose whom to serve" },
        { kind: "contains", targetConceptId: "business-positioning", reason: "Own a place in the mind" },
        { kind: "contains", targetConceptId: "business-marketing-mix", reason: "4Ps deliver the offer" },
        { kind: "related_to", targetConceptId: "business-strategy", reason: "Marketing supports competitive strategy" },
      ],
      childConceptIds: [
        "business-customer-value",
        "business-segmentation",
        "business-targeting",
        "business-positioning",
        "business-marketing-mix",
      ],
      visualModels: [
        "STP funnel: Segment → Target → Position",
        "4Ps diamond around the customer",
      ],
      procedures: [
        "Define the customer problem",
        "Segment → choose target → write positioning",
        "Align product, price, place, promotion with that position",
      ],
      scenarios: [
        "Launch a campus meal kit: who is the customer, what value, which 4P choices?",
      ],
      applications: [
        "Launch planning",
        "Campaign briefs",
        "Competitive response",
      ],
      transferPrompts: [
        "Apply STP and the 4Ps to a nonprofit tutoring service.",
      ],
      workedExamples: [
        "Map a coffee shop’s weekday lunch special through needs → segment → 4Ps.",
      ],
      practiceForms: ["scenario", "explain", "classify", "compare", "apply"],
      assessmentForms: [
        "define marketing",
        "list 4Ps with examples",
        "distinguish marketing vs advertising",
        "apply STP to a case",
      ],
      masteryCriteria: [
        "Can list the 4Ps with one example each",
        "Can explain STP briefly",
        "Can separate marketing from advertising",
      ],
      difficulty: 1,
      completeness: "rich",
      curriculumMappings: [
        {
          curriculumId: "intro-business-survey",
          label: "Intro to Business",
          unit: "Marketing",
          conceptId: "business-marketing",
        },
      ],
      checkPrompt: "Name the four Ps of marketing.",
    }),
    klConcept({
      id: "business-customer-value",
      title: "Customer needs and value",
      aliases: ["customer value", "customer needs and wants", "customer needs"],
      parentConceptId: "business-marketing",
      definition:
        "Customer value is the perceived benefit of an offering relative to what the customer gives up.",
      explanation:
        "Needs and wants drive demand. Value is not only price — it includes quality, convenience, status, and risk reduction. Marketing succeeds when the offer’s perceived benefits exceed perceived costs for a chosen customer.",
      purpose: "Anchor marketing in exchange of value.",
      example: "A student pays for a meal kit to save time during finals week.",
      examples: ["Safety features that reduce perceived risk of a used car"],
      nonExamples: ["Assuming everyone values the same features equally"],
      misconceptions: ["Lowest price always equals highest value."],
      misconception: "Equating value with being cheapest.",
      misconceptionDetails: [
        {
          misconception: "Value means the lowest price.",
          correction: "Value is benefits minus costs; convenience or quality can outweigh a higher price.",
        },
      ],
      vocabulary: ["needs", "wants", "perceived benefit", "exchange"],
      relatedConcepts: ["business-marketing", "business-segmentation"],
      relationships: [
        { kind: "part_of", targetConceptId: "business-marketing" },
        { kind: "leads_to", targetConceptId: "business-segmentation" },
      ],
      practiceForms: ["explain", "scenario"],
      assessmentForms: ["explain value", "compare two offers"],
      completeness: "teachable",
      checkPrompt: "What is customer value in marketing terms?",
    }),
    klConcept({
      id: "business-segmentation",
      title: "Market segmentation",
      aliases: ["segmentation", "market segments", "customer segmentation"],
      parentConceptId: "business-marketing",
      definition:
        "Segmentation divides a broad market into groups that share needs, behaviors, or characteristics relevant to an offer.",
      explanation:
        "Useful segments are measurable, accessible, substantial, and actionable. Bases include demographic, geographic, psychographic, and behavioral. Segmentation is not stereotyping — it is choosing meaningful differences for marketing decisions.",
      purpose: "Focus effort on distinguishable customer groups.",
      example: "A bank segments students, first-time homebuyers, and retirees.",
      examples: ["Behavioral: heavy vs light users of a streaming service"],
      nonExamples: ["Splitting customers randomly with no shared need"],
      misconceptions: ["More segments is always better."],
      misconception: "Creating tiny segments the firm cannot serve profitably.",
      vocabulary: ["segment", "demographic", "psychographic", "behavioral"],
      prerequisites: ["business-customer-value"],
      relatedConcepts: ["business-targeting", "business-marketing"],
      relationships: [
        { kind: "prerequisite", targetConceptId: "business-customer-value" },
        { kind: "part_of", targetConceptId: "business-marketing" },
        { kind: "leads_to", targetConceptId: "business-targeting" },
      ],
      practiceForms: ["classify", "scenario", "compare"],
      assessmentForms: ["propose segments", "critique a segment base"],
      completeness: "teachable",
      checkPrompt: "Name two bases for market segmentation.",
    }),
    klConcept({
      id: "business-targeting",
      title: "Targeting",
      aliases: ["market targeting", "target market"],
      parentConceptId: "business-marketing",
      definition:
        "Targeting chooses which segment(s) the organization will serve.",
      explanation:
        "After segmentation, evaluate attractiveness and fit with capabilities. Strategies include undifferentiated, differentiated, concentrated, and micromarketing. Targeting commits resources — it is a strategic choice, not a slogan.",
      purpose: "Decide whom to serve.",
      example: "A startup concentrates on campus students before expanding citywide.",
      nonExamples: ["Saying “everyone” is the target without prioritization"],
      misconceptions: ["Targeting means excluding people from buying."],
      misconception: "Confusing target focus with refusing walk-in customers.",
      vocabulary: ["target market", "concentrated", "differentiated"],
      prerequisites: ["business-segmentation"],
      relatedConcepts: ["business-positioning", "business-segmentation"],
      relationships: [
        { kind: "prerequisite", targetConceptId: "business-segmentation" },
        { kind: "leads_to", targetConceptId: "business-positioning" },
        { kind: "part_of", targetConceptId: "business-marketing" },
      ],
      practiceForms: ["scenario", "explain"],
      assessmentForms: ["choose a target and justify"],
      completeness: "teachable",
      checkPrompt: "How does targeting differ from segmentation?",
    }),
    klConcept({
      id: "business-positioning",
      title: "Positioning",
      aliases: ["brand positioning", "market positioning"],
      parentConceptId: "business-marketing",
      definition:
        "Positioning is the distinct place an offer occupies in customers’ minds relative to alternatives.",
      explanation:
        "A positioning statement typically names the target, frame of reference, point of difference, and reason to believe. Positioning guides the mix — inconsistent 4Ps blur the position. Repositioning changes that mental place over time.",
      purpose: "Own a clear competitive meaning.",
      example: "“For busy students, MealKit X is the lunch that beats cafeteria lines.”",
      nonExamples: ["A vague claim like “best quality” with no frame of reference"],
      misconceptions: ["Positioning is only a tagline."],
      misconception: "Treating a slogan as complete positioning.",
      vocabulary: ["point of difference", "frame of reference", "reason to believe"],
      prerequisites: ["business-targeting"],
      relatedConcepts: ["business-marketing-mix", "business-strategy"],
      relationships: [
        { kind: "prerequisite", targetConceptId: "business-targeting" },
        { kind: "used_with", targetConceptId: "business-marketing-mix" },
        { kind: "part_of", targetConceptId: "business-marketing" },
      ],
      practiceForms: ["write", "compare", "scenario"],
      assessmentForms: ["draft a positioning statement"],
      completeness: "teachable",
      checkPrompt: "What four elements often appear in a positioning statement?",
    }),
    klConcept({
      id: "business-marketing-mix",
      title: "Marketing mix (4Ps)",
      aliases: ["4Ps", "marketing mix", "product price place promotion"],
      parentConceptId: "business-marketing",
      definition:
        "The marketing mix is the coordinated set of product, price, place, and promotion decisions that deliver the offer.",
      explanation:
        "Product is the offer itself (features, brand, services). Price captures value and signals quality. Place is how customers obtain it. Promotion communicates. The mix must align with positioning — a premium position with deep everyday discounting confuses customers.",
      purpose: "Translate strategy into concrete marketing decisions.",
      example: "Premium headphones: high build quality, premium price, boutique + online, influencer demos.",
      examples: ["Place: campus vending vs downtown flagship"],
      nonExamples: ["Changing only the logo while ignoring product and price fit"],
      misconceptions: ["Promotion alone can fix a weak product."],
      misconception: "Believing ads overcome a misaligned product/price.",
      vocabulary: ["product", "price", "place", "promotion", "mix consistency"],
      prerequisites: ["business-positioning"],
      relatedConcepts: ["business-marketing", "business-positioning"],
      relationships: [
        { kind: "part_of", targetConceptId: "business-marketing" },
        { kind: "depends_on", targetConceptId: "business-positioning" },
      ],
      practiceForms: ["apply", "scenario", "compare"],
      assessmentForms: ["design a 4P set for a target"],
      completeness: "teachable",
      curriculumMappings: [
        {
          curriculumId: "intro-business-survey",
          label: "Intro to Business",
          unit: "Marketing mix",
          conceptId: "business-marketing-mix",
        },
      ],
      checkPrompt: "List the four Ps and one decision under each.",
    }),
    klConcept({
      id: "business-operations",
      title: "Operations",
      aliases: ["operations management basics", "business operations"],
      definition:
        "Operations turn inputs into goods or services customers receive.",
      explanation:
        "Operations manage process design, quality, inventory, and capacity. Efficiency and reliability matter. Service operations manage wait times and consistency as much as factories manage lines.",
      purpose: "Explain how products/services are produced and delivered.",
      example:
        "A cafe designs a drink-prep sequence so peak-hour orders stay fast without errors.",
      misconceptions: ["Operations is not only manufacturing."],
      misconception: "Assuming operations applies only to factories.",
      vocabulary: ["process", "capacity", "quality", "inventory"],
      relatedConcepts: ["business-supply-chain"],
      practiceForms: ["scenario"],
      masteryCriteria: ["Can define operations in a service or product example"],
      difficulty: 2,
      checkPrompt: "What do operations transform?",
    }),
    klConcept({
      id: "business-supply-chain",
      title: "Supply chain",
      aliases: ["supply chain basics", "logistics overview"],
      definition:
        "A supply chain is the network of suppliers, producers, distributors, and retailers that move a product to customers.",
      explanation:
        "Delays or shortages upstream affect downstream availability. Coordination, inventory buffers, and information sharing reduce risk. Supply chains are not only trucks — they include planning and relationships.",
      purpose: "See how goods reach customers.",
      example:
        "A phone's chips, assembly plant, and retail stores form parts of its supply chain.",
      misconceptions: ["The supply chain ends at the factory door — no, it continues to the customer."],
      misconception: "Ignoring retail/distribution as part of the chain.",
      vocabulary: ["supplier", "distributor", "logistics", "inventory"],
      relatedConcepts: ["business-operations"],
      practiceForms: ["explain", "diagram"],
      masteryCriteria: ["Can list at least three stages in a simple supply chain"],
      difficulty: 2,
      checkPrompt: "Name three participants in a typical supply chain.",
    }),
    klConcept({
      id: "business-accounting-basics",
      title: "Accounting fundamentals",
      aliases: ["accounting basics", "bookkeeping vs accounting"],
      definition:
        "Accounting measures, records, and communicates financial information about an organization.",
      explanation:
        "Transactions are recorded systematically so managers and outsiders can see performance and position. Accounting is not the same as budgeting, though they connect. Accuracy and consistency matter for trust.",
      purpose: "Introduce why financial records exist.",
      example:
        "Recording a cash sale increases cash and recognizes revenue in the accounts.",
      misconceptions: ["Accounting is not only for tax season."],
      misconception: "Thinking accounting is unused until taxes are due.",
      vocabulary: ["transaction", "ledger", "financial information"],
      relatedConcepts: ["business-financial-statements"],
      practiceForms: ["explain"],
      masteryCriteria: ["Can state what accounting communicates"],
      difficulty: 1,
      checkPrompt: "What does accounting communicate?",
    }),
    klConcept({
      id: "business-financial-statements",
      title: "Financial statements",
      aliases: ["income statement balance sheet", "basic financial statements"],
      definition:
        "Core statements include the income statement (performance), balance sheet (position), and cash flow statement (cash movements).",
      explanation:
        "Income statement shows revenues and expenses over a period. Balance sheet shows assets = liabilities + equity at a point in time. Cash flow explains cash in and out. Together they give a fuller picture than any one statement.",
      purpose: "Read the basic story of performance and position.",
      example:
        "Profit on the income statement can differ from cash in the bank because of timing and non-cash items.",
      misconceptions: ["Profit is not identical to cash."],
      misconception: "Equating net income with cash on hand.",
      vocabulary: ["income statement", "balance sheet", "cash flow", "assets", "liabilities", "equity"],
      relatedConcepts: ["business-accounting-basics"],
      practiceForms: ["identify", "explain"],
      masteryCriteria: ["Can name the three primary statements and what each shows"],
      difficulty: 2,
      checkPrompt: "Which statement shows assets and liabilities at a point in time?",
    }),
    klConcept({
      id: "business-strategy",
      title: "Business strategy",
      aliases: ["strategy basics", "competitive strategy intro"],
      definition:
        "Strategy is how an organization chooses to create and sustain value relative to alternatives.",
      explanation:
        "Strategy involves where to compete and how to win — cost leadership, differentiation, focus. It aligns resources with a coherent direction. Tactics are shorter-term moves inside a strategy.",
      purpose: "Distinguish direction from day-to-day tactics.",
      example:
        "A retailer might compete on everyday low prices rather than premium service.",
      misconceptions: ["A slogan is not a strategy by itself."],
      misconception: "Treating a tagline as a complete strategy.",
      vocabulary: ["positioning", "differentiation", "cost leadership", "tactics"],
      relatedConcepts: ["business-entrepreneurship", "business-marketing"],
      practiceForms: ["scenario", "explain"],
      masteryCriteria: ["Can contrast strategy vs tactics with an example"],
      difficulty: 2,
      checkPrompt: "How is strategy different from a single marketing tactic?",
    }),
  ],
};

registerInstructionalPack(BUSINESS_FUNDAMENTALS_PACK);
