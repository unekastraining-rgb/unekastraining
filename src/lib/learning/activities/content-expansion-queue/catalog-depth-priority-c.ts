/**
 * Content expansion queue — depth Priority C challenges
 * (cloud, data analytics, manufacturing, logistics).
 * Staging catalog only; not a subject engine.
 */

import type { StructuredChallenge } from "@/lib/learning/activities/structured/service";
import { hint, step, checklist } from "./helpers";

export const CONTENT_DEPTH_PRIORITY_C_CHALLENGES: StructuredChallenge[] = [
  // —— Cloud ——
  {
    id: "sim-cloud-iam-least-privilege",
    kind: "simulation",
    title: "IAM least privilege scenario",
    objective:
      "Apply least-privilege IAM judgment to a role-permission request.",
    prompt:
      "Simulation (educational — no live credentials): A contractor needs to read one S3 report bucket for two weeks. They ask for AdministratorAccess 'to move faster.' Choose a least-privilege alternative, name one permission boundary (resource/action/time), and state one risk of the broad role.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "cloud",
    minChars: 50,
    conceptHints: [
      "iam",
      "least privilege",
      "permissions",
      "role",
      "cloud security",
    ],
    misconceptionTargets: [
      "granting admin because temporary work 'isn't worth scoping'",
      "scoping actions but forgetting resource or time limits",
    ],
    successLooksLike:
      "Read-only scoped access, clear boundary, and admin blast-radius risk.",
    scaffolds: [
      hint(
        "Need to do, not power to do all",
        "Match permissions to the smallest task: read that bucket, time-boxed.",
      ),
      step(
        "Name a boundary",
        "Resource ARN/prefix, s3:GetObject-style actions, or expiry are educational examples.",
      ),
      checklist(
        "Least-privilege checklist",
        "Alternative · boundary · broad-role risk",
      ),
    ],
    criteria: [
      {
        id: "alternative",
        label: "Least-privilege alternative",
        mustIncludeAny: [
          "read",
          "least",
          "scoped",
          "getobject",
          "bucket",
          "minimal",
        ],
      },
      {
        id: "boundary",
        label: "Permission boundary",
        mustIncludeAny: [
          "bucket",
          "time",
          "two week",
          "action",
          "resource",
          "expir",
        ],
      },
      {
        id: "risk",
        label: "Admin risk",
        mustIncludeAny: [
          "admin",
          "blast",
          "delete",
          "overprivileg",
          "lateral",
          "risk",
        ],
      },
    ],
  },
  {
    id: "write-cloud-availability-zones",
    kind: "writing",
    title: "Availability zones vs regions",
    objective:
      "Explain cloud availability zones versus regions educationally.",
    prompt:
      "Writing (educational cloud concepts — no account required): Contrast a region with an availability zone (AZ). Explain why placing replicas in multiple AZs inside one region improves resilience to some failures, and name one failure type that multi-AZ alone may not cover.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "cloud",
    minChars: 52,
    conceptHints: [
      "availability zone",
      "region",
      "resilience",
      "redundancy",
      "cloud",
    ],
    misconceptionTargets: [
      "treating region and AZ as synonyms",
      "assuming multi-AZ protects against every regional outage",
    ],
    successLooksLike:
      "Region = geographic area; AZ = isolated site within; multi-AZ helps local failure; regional disaster may remain.",
    scaffolds: [
      hint(
        "Nested geography",
        "Regions contain multiple AZs that are separate failure domains.",
      ),
      step(
        "What multi-AZ misses",
        "Wide regional events, config bugs, or account-level mistakes can still hurt.",
      ),
      checklist(
        "AZ/region checklist",
        "Region · AZ · multi-AZ benefit · remaining risk",
      ),
    ],
    criteria: [
      {
        id: "region",
        label: "Region",
        mustIncludeAny: [
          "region",
          "geographic",
          "area",
          "location",
        ],
      },
      {
        id: "az",
        label: "Availability zone",
        mustIncludeAny: [
          "availability zone",
          "az",
          "datacenter",
          "isolated",
          "within",
        ],
      },
      {
        id: "limit",
        label: "Multi-AZ limit",
        mustIncludeAny: [
          "region",
          "regional",
          "whole",
          "not cover",
          "still",
          "disaster",
          "config",
        ],
      },
    ],
  },
  {
    id: "sim-cloud-cost-idle",
    kind: "simulation",
    title: "Idle resource cost leak",
    objective:
      "Solve an idle-resource cost leak using cloud cost hygiene reasoning.",
    prompt:
      "Challenge simulation (no destructive live actions): A non-prod environment left 12 medium VMs and unattached disks running all weekend with zero traffic. Name the cost leak pattern, one detection signal, and one safe control (schedule stop, rightsizing, or delete unused disks) — educational only.",
    learningObjectType: "SIMULATION",
    skillFacet: "SOLVE",
    asPerform: false,
    domainTag: "cloud",
    minChars: 48,
    conceptHints: [
      "cloud cost",
      "idle resources",
      "rightsizing",
      "non-prod",
      "finops",
    ],
    misconceptionTargets: [
      "assuming stopped traffic means stopped billing for running VMs",
      "deleting production without distinguishing non-prod idle waste",
    ],
    successLooksLike:
      "Idle/always-on waste named, a utilization/billing signal, and a safe control.",
    scaffolds: [
      hint(
        "Running ≈ billing",
        "Compute often bills while instances are on, even with no users.",
      ),
      step(
        "Safe first",
        "Prefer schedules/tags on non-prod before touching production.",
      ),
      checklist(
        "Cost-leak checklist",
        "Pattern · detection · safe control",
      ),
    ],
    criteria: [
      {
        id: "leak",
        label: "Cost leak pattern",
        mustIncludeAny: [
          "idle",
          "unused",
          "always on",
          "weekend",
          "waste",
          "running",
        ],
      },
      {
        id: "signal",
        label: "Detection signal",
        mustIncludeAny: [
          "cpu",
          "utiliz",
          "traffic",
          "billing",
          "metric",
          "zero",
          "monitor",
        ],
      },
      {
        id: "control",
        label: "Safe control",
        mustIncludeAny: [
          "schedule",
          "stop",
          "rightsiz",
          "delete",
          "disk",
          "tag",
          "shutdown",
        ],
      },
    ],
  },
  {
    id: "lab-cloud-storage-class-choose",
    kind: "lab",
    title: "Hot vs archive storage choice",
    objective:
      "Perform selecting hot vs archive storage for a stated use case.",
    prompt:
      "Lab (educational — no live buckets): Use case A — product images served to a website all day. Use case B — 7-year tax PDFs retrieved a few times a year. For each, choose hot/standard vs archive/cold storage and justify with access frequency and retrieval urgency.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "cloud",
    minChars: 52,
    conceptHints: [
      "storage class",
      "hot storage",
      "archive",
      "access frequency",
      "cloud",
    ],
    misconceptionTargets: [
      "archiving frequently served web assets to save pennies while hurting latency",
      "keeping rare long-retention files on premium hot tiers without reason",
    ],
    successLooksLike:
      "A → hot/standard; B → archive/cold; frequency/urgency justified.",
    scaffolds: [
      hint(
        "Access pattern first",
        "Hot fits frequent low-latency reads; archive fits rare retrieval.",
      ),
      step(
        "Retrieval cost",
        "Archive often trades cheaper storage for slower/costlier restores.",
      ),
      checklist(
        "Storage-class checklist",
        "Case A choice · Case B choice · frequency justification",
      ),
    ],
    criteria: [
      {
        id: "hot",
        label: "Hot for images",
        mustIncludeAny: [
          "hot",
          "standard",
          "frequent",
          "website",
          "image",
          "low latency",
        ],
      },
      {
        id: "archive",
        label: "Archive for tax PDFs",
        mustIncludeAny: [
          "archive",
          "cold",
          "glacier",
          "infrequent",
          "tax",
          "rare",
        ],
      },
      {
        id: "why",
        label: "Frequency / urgency",
        mustIncludeAny: [
          "frequen",
          "retriev",
          "urgent",
          "latency",
          "year",
          "access",
        ],
      },
    ],
  },

  // —— Data analytics ——
  {
    id: "write-data-correlation-vs-causation",
    kind: "writing",
    title: "Correlation is not causation",
    objective:
      "Explain why correlation does not imply causation with a clear counterexample.",
    prompt:
      "Writing: Explain correlation vs causation. Give one example where two metrics move together without one causing the other, and state what extra evidence would be needed before claiming a causal link.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "data analytics",
    minChars: 50,
    conceptHints: [
      "correlation",
      "causation",
      "confounder",
      "analytics",
      "evidence",
    ],
    misconceptionTargets: [
      "treating a strong correlation as proof of cause",
      "ignoring lurking variables that drive both series",
    ],
    successLooksLike:
      "Clear definitions, a non-causal co-movement example, and needed causal evidence.",
    scaffolds: [
      hint(
        "Together ≠ because of",
        "Correlation = association; causation = X produces change in Y.",
      ),
      step(
        "Ask for more",
        "Experiments, controls, timing, or ruling out confounders strengthen causal claims.",
      ),
      checklist(
        "Corr/cause checklist",
        "Definitions · counterexample · causal evidence need",
      ),
    ],
    criteria: [
      {
        id: "corr",
        label: "Correlation",
        mustIncludeAny: [
          "correlation",
          "associat",
          "move together",
          "related",
        ],
      },
      {
        id: "cause",
        label: "Causation",
        mustIncludeAny: [
          "caus",
          "because",
          "produces",
          "leads to",
          "effect",
        ],
      },
      {
        id: "extra",
        label: "Extra evidence",
        mustIncludeAny: [
          "confound",
          "experiment",
          "control",
          "trial",
          "timing",
          "rule out",
        ],
      },
    ],
  },
  {
    id: "lab-data-aggregate-pivot-intuition",
    kind: "lab",
    title: "Aggregation answers the question",
    objective:
      "Perform choosing which aggregation answers a business question.",
    prompt:
      "Lab: Business question — 'Which product category had the highest total revenue last month?' Given row-level sales (date, category, units, revenue), choose sum/avg/count/max for the right answer, name the group-by field, and explain why average revenue per order would answer a different question.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "data analytics",
    minChars: 50,
    conceptHints: [
      "aggregation",
      "sum",
      "group by",
      "pivot",
      "revenue",
      "data analytics",
    ],
    misconceptionTargets: [
      "averaging when the question asks for total revenue",
      "aggregating without grouping by category",
    ],
    successLooksLike:
      "SUM revenue grouped by category; AVG would answer a different question.",
    scaffolds: [
      hint(
        "Listen to 'total'",
        "Highest total revenue points to sum, not average.",
      ),
      step(
        "Group then aggregate",
        "Group by category, then sum revenue; compare categories.",
      ),
      checklist(
        "Aggregation checklist",
        "Measure · group-by · why not average",
      ),
    ],
    criteria: [
      {
        id: "agg",
        label: "Aggregation choice",
        mustIncludeAny: ["sum", "total", "aggregat"],
      },
      {
        id: "groupby",
        label: "Group by",
        mustIncludeAny: ["category", "group"],
      },
      {
        id: "avg",
        label: "Why not average",
        mustIncludeAny: [
          "average",
          "avg",
          "per order",
          "different",
          "not total",
        ],
      },
    ],
  },
  {
    id: "sim-data-dashboard-misleading",
    kind: "simulation",
    title: "Misleading dashboard cues",
    objective:
      "Apply detection of a misleading dashboard design (not axis truncation).",
    prompt:
      "Simulation (different from a truncated-axis chart lie): A dashboard tiles 12 bright KPI cards, uses dual metrics with unclear definitions ('users' vs 'active users'), and defaults the date filter to the best week. Name two ways it misleads, one clarification question you would ask, and one redesign that improves honest reading.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "data analytics",
    minChars: 52,
    conceptHints: [
      "dashboard",
      "kpi",
      "metric definition",
      "selection bias",
      "data literacy",
    ],
    misconceptionTargets: [
      "critiquing only axis scale when definitions and filters are the real issue",
      "assuming more KPI tiles always mean a clearer story",
    ],
    successLooksLike:
      "Calls out clutter/definition/filter cherry-pick; asks a clarifying question; proposes a clearer redesign.",
    scaffolds: [
      hint(
        "Not the axis trick",
        "Focus on definitions, filters, and cognitive overload — not truncated axes.",
      ),
      step(
        "Ask for the dictionary",
        "What counts as a user? What date range is default and why?",
      ),
      checklist(
        "Dashboard honesty checklist",
        "Two misleading cues · clarifying question · redesign",
      ),
    ],
    criteria: [
      {
        id: "mislead",
        label: "Misleading cues",
        mustIncludeAny: [
          "kpi",
          "definition",
          "filter",
          "best week",
          "clutter",
          "active",
          "unclear",
        ],
      },
      {
        id: "question",
        label: "Clarifying question",
        mustIncludeAny: [
          "what",
          "defin",
          "how",
          "date",
          "user",
          "ask",
        ],
      },
      {
        id: "redesign",
        label: "Redesign",
        mustIncludeAny: [
          "fewer",
          "define",
          "default",
          "filter",
          "label",
          "compare",
          "simplify",
        ],
      },
    ],
  },
  {
    id: "write-data-findings-communicate",
    kind: "writing",
    title: "Communicate findings to non-technical stakeholders",
    objective:
      "Explain analytics findings in plain language for non-technical stakeholders.",
    prompt:
      "Writing: You found that weekend support tickets rise 35% when chat bots are offline. Draft a 4–6 sentence note for a non-technical director: lead with the business takeaway, one plain-language evidence line, one uncertainty/caveat, and one recommended next action.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "data analytics",
    minChars: 55,
    conceptHints: [
      "communicate findings",
      "stakeholder",
      "plain language",
      "caveat",
      "data analytics",
    ],
    misconceptionTargets: [
      "leading with jargon (p-values, joins) before the business point",
      "omitting uncertainty when recommending action",
    ],
    successLooksLike:
      "Business takeaway first, plain evidence, caveat, and a next action.",
    scaffolds: [
      hint(
        "Director skim path",
        "What happened → why it matters → how sure → what to do.",
      ),
      step(
        "Translate the 35%",
        "Say weekends without bots mean more human tickets — avoid model talk.",
      ),
      checklist(
        "Findings note checklist",
        "Takeaway · evidence · caveat · action",
      ),
    ],
    criteria: [
      {
        id: "takeaway",
        label: "Business takeaway",
        mustIncludeAny: [
          "ticket",
          "weekend",
          "bot",
          "support",
          "rise",
          "increase",
        ],
      },
      {
        id: "caveat",
        label: "Caveat / uncertainty",
        mustIncludeAny: [
          "caveat",
          "uncertain",
          "may",
          "limit",
          "correlation",
          "other factor",
        ],
      },
      {
        id: "action",
        label: "Next action",
        mustIncludeAny: [
          "recommend",
          "next",
          "staff",
          "cover",
          "monitor",
          "pilot",
          "action",
        ],
      },
    ],
  },

  // —— Manufacturing ——
  {
    id: "sim-manufacturing-bottleneck-takt",
    kind: "simulation",
    title: "Takt vs cycle time bottleneck",
    objective:
      "Apply/solve a bottleneck using takt time vs process cycle time.",
    prompt:
      "Simulation: Customer demand requires a takt of 60 seconds/unit. Station A cycles in 45s, Station B in 75s, Station C in 50s. Identify the bottleneck, explain using takt vs cycle time, and propose one improvement idea (split work, add capacity, or reduce B’s cycle).",
    learningObjectType: "SIMULATION",
    skillFacet: "SOLVE",
    asPerform: false,
    domainTag: "manufacturing",
    minChars: 50,
    conceptHints: [
      "takt time",
      "cycle time",
      "bottleneck",
      "throughput",
      "manufacturing",
    ],
    misconceptionTargets: [
      "calling the fastest station the bottleneck",
      "ignoring takt when judging whether a station can meet demand",
    ],
    successLooksLike:
      "Station B is bottleneck (75s > 60s takt); improvement idea named.",
    scaffolds: [
      hint(
        "Takt = demand drumbeat",
        "If cycle time > takt, that station cannot keep up with demand pace.",
      ),
      step(
        "Find the longest over takt",
        "Compare each station’s cycle to 60s; the one above takt constrains flow.",
      ),
      checklist(
        "Bottleneck checklist",
        "Bottleneck named · takt/cycle contrast · improvement",
      ),
    ],
    criteria: [
      {
        id: "bottleneck",
        label: "Bottleneck station",
        mustIncludeAny: ["b", "75", "bottleneck"],
      },
      {
        id: "takt",
        label: "Takt vs cycle",
        mustIncludeAny: [
          "takt",
          "cycle",
          "60",
          "greater",
          "exceed",
          "slower",
        ],
      },
      {
        id: "improve",
        label: "Improvement",
        mustIncludeAny: [
          "split",
          "capacity",
          "reduce",
          "balance",
          "add",
          "improve",
        ],
      },
    ],
  },
  {
    id: "lab-manufacturing-spc-outlier",
    kind: "lab",
    title: "SPC out-of-control point",
    objective:
      "Perform identifying an educational out-of-control SPC point.",
    prompt:
      "Lab (educational SPC — not certification): A control chart has a centerline at 10, upper control limit 16, lower 4. Points: 9, 11, 10, 12, 18, 10. Identify the out-of-control point, state the rule you used (beyond limits), and name one process check you would do next before adjusting wildly.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "manufacturing",
    minChars: 45,
    conceptHints: [
      "spc",
      "control chart",
      "control limit",
      "outlier",
      "manufacturing",
    ],
    misconceptionTargets: [
      "treating every wiggle inside limits as out of control",
      "retuning the process before verifying measurement or special cause",
    ],
    successLooksLike:
      "Point 18 beyond UCL; beyond-limits rule; verify/measure/special-cause check.",
    scaffolds: [
      hint(
        "Beyond the fences",
        "A classic signal is a point outside the control limits.",
      ),
      step(
        "Check before tweak",
        "Confirm the reading, material lot, or tool change before big adjustments.",
      ),
      checklist(
        "SPC checklist",
        "Out-of-control point · rule · next check",
      ),
    ],
    criteria: [
      {
        id: "point",
        label: "Out-of-control point",
        mustIncludeAny: ["18", "upper", "ucl", "beyond", "outside"],
      },
      {
        id: "rule",
        label: "Rule used",
        mustIncludeAny: [
          "limit",
          "control limit",
          "beyond",
          "outside",
          "rule",
        ],
      },
      {
        id: "check",
        label: "Next check",
        mustIncludeAny: [
          "verify",
          "measure",
          "recheck",
          "special cause",
          "tool",
          "lot",
          "sensor",
        ],
      },
    ],
  },
  {
    id: "write-manufacturing-push-vs-pull",
    kind: "writing",
    title: "Push versus pull production",
    objective:
      "Explain push vs pull production systems with a clear contrast.",
    prompt:
      "Writing: Contrast push and pull production. Give one example of each (forecast-driven build-ahead vs consume-and-replenish), and state one inventory risk typical of unchecked push.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "manufacturing",
    minChars: 48,
    conceptHints: [
      "push production",
      "pull production",
      "kanban",
      "inventory",
      "manufacturing",
    ],
    misconceptionTargets: [
      "treating pull as 'never plan' and push as 'always waste'",
      "ignoring overproduction risk in push systems",
    ],
    successLooksLike:
      "Push = schedule/forecast ahead; pull = replenish on consumption; push overstock risk.",
    scaffolds: [
      hint(
        "Signal source",
        "Push is driven by a plan upstream; pull is triggered by downstream need.",
      ),
      step(
        "Inventory risk",
        "Push can pile WIP/finished goods if forecasts miss.",
      ),
      checklist(
        "Push/pull checklist",
        "Push · pull · examples · inventory risk",
      ),
    ],
    criteria: [
      {
        id: "push",
        label: "Push",
        mustIncludeAny: [
          "push",
          "forecast",
          "schedule",
          "ahead",
          "build",
        ],
      },
      {
        id: "pull",
        label: "Pull",
        mustIncludeAny: [
          "pull",
          "replenish",
          "consume",
          "kanban",
          "demand",
          "downstream",
        ],
      },
      {
        id: "risk",
        label: "Push inventory risk",
        mustIncludeAny: [
          "inventory",
          "overproduc",
          "stock",
          "wip",
          "excess",
          "unsold",
        ],
      },
    ],
  },
  {
    id: "sim-manufacturing-changeover-smed",
    kind: "simulation",
    title: "Changeover waste reduction (SMED idea)",
    objective:
      "Apply a SMED-style idea to reduce changeover waste.",
    prompt:
      "Simulation: A press line loses 40 minutes each changeover; 25 minutes are spent hunting tools and prepping dies while the machine sits idle. Name the waste, separate one internal (machine stopped) vs external (can prep while running) task, and propose one SMED-style improvement.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "manufacturing",
    minChars: 50,
    conceptHints: [
      "smed",
      "changeover",
      "internal setup",
      "external setup",
      "manufacturing",
    ],
    misconceptionTargets: [
      "doing all prep only after the machine stops",
      "cutting quality checks instead of converting internal work to external",
    ],
    successLooksLike:
      "Idle/search waste named; internal vs external split; convert prep to external or stage tools.",
    scaffolds: [
      hint(
        "Internal vs external",
        "Internal needs the machine stopped; external can happen while it still runs.",
      ),
      step(
        "SMED move",
        "Stage kits, pre-mount, or checklist prep before stop time.",
      ),
      checklist(
        "Changeover checklist",
        "Waste · internal/external · improvement",
      ),
    ],
    criteria: [
      {
        id: "waste",
        label: "Waste",
        mustIncludeAny: [
          "waste",
          "idle",
          "search",
          "waiting",
          "changeover",
          "hunt",
        ],
      },
      {
        id: "internal-external",
        label: "Internal vs external",
        mustIncludeAny: [
          "internal",
          "external",
          "while running",
          "machine stop",
          "prep",
        ],
      },
      {
        id: "improve",
        label: "SMED improvement",
        mustIncludeAny: [
          "stage",
          "kit",
          "pre",
          "external",
          "checklist",
          "smed",
          "convert",
        ],
      },
    ],
  },

  // —— Logistics ——
  {
    id: "write-logistics-lead-time",
    kind: "writing",
    title: "Lead time components",
    objective:
      "Explain the main components that make up logistics lead time.",
    prompt:
      "Writing: Explain lead time for ordering a part. Break it into at least three components (e.g., order processing, supplier manufacturing/wait, transit, receiving). State why shortening only transit may not fix a long lead time if another component dominates.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "logistics",
    minChars: 50,
    conceptHints: [
      "lead time",
      "order processing",
      "transit",
      "supplier",
      "logistics",
    ],
    misconceptionTargets: [
      "equating lead time with shipping days alone",
      "optimizing one segment while ignoring the longest segment",
    ],
    successLooksLike:
      "Three+ components named; notes that the longest segment can dominate.",
    scaffolds: [
      hint(
        "Clock starts at need",
        "Lead time spans from order decision to ready-to-use inventory.",
      ),
      step(
        "Find the long pole",
        "Map each segment’s days; improve the longest bottleneck first.",
      ),
      checklist(
        "Lead-time checklist",
        "Three components · dominance point",
      ),
    ],
    criteria: [
      {
        id: "components",
        label: "Components",
        mustIncludeAny: [
          "process",
          "supplier",
          "transit",
          "shipping",
          "receiv",
          "manufactur",
          "wait",
        ],
      },
      {
        id: "multi",
        label: "Multiple parts",
        mustIncludeAny: [
          "and",
          "plus",
          "component",
          "stage",
          "part",
        ],
      },
      {
        id: "dominate",
        label: "Dominant segment",
        mustIncludeAny: [
          "dominat",
          "longest",
          "not enough",
          "still",
          "bottleneck",
          "only transit",
        ],
      },
    ],
  },
  {
    id: "sim-logistics-mode-choose",
    kind: "simulation",
    title: "Truck vs rail vs air tradeoff",
    objective:
      "Apply mode selection across truck, rail, and air tradeoffs.",
    prompt:
      "Simulation: Ship 20 tons of non-perishable machine parts 1,200 miles with a flexible 10-day delivery window and a tight freight budget. Compare truck vs rail vs air on speed/cost/capacity fit, pick a mode, and name one risk of your choice.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "logistics",
    minChars: 52,
    conceptHints: [
      "mode choice",
      "truck",
      "rail",
      "air freight",
      "tradeoff",
      "logistics",
    ],
    misconceptionTargets: [
      "defaulting to air for heavy non-urgent freight",
      "picking a mode without stating a speed/cost tradeoff",
    ],
    successLooksLike:
      "Rail (or truck) preferred for heavy/flexible/budget; air rejected; risk named.",
    scaffolds: [
      hint(
        "Heavy + flexible + budget",
        "Air is fast/expensive; rail often fits heavy, less urgent moves.",
      ),
      step(
        "Name a risk",
        "Rail may mean less door-to-door flexibility; truck may cost more than rail.",
      ),
      checklist(
        "Mode checklist",
        "Compare three · pick · risk",
      ),
    ],
    criteria: [
      {
        id: "modes",
        label: "Modes compared",
        mustIncludeAny: ["truck", "rail", "air"],
      },
      {
        id: "pick",
        label: "Mode pick",
        mustIncludeAny: [
          "rail",
          "truck",
          "choose",
          "prefer",
          "best",
        ],
      },
      {
        id: "risk",
        label: "Risk",
        mustIncludeAny: [
          "risk",
          "delay",
          "cost",
          "flexib",
          "transfer",
          "schedule",
        ],
      },
    ],
  },
  {
    id: "lab-logistics-safety-stock-calc-intuition",
    kind: "lab",
    title: "Safety stock and demand uncertainty",
    objective:
      "Perform reasoning about why safety stock rises with demand uncertainty.",
    prompt:
      "Lab: Two SKUs have the same average weekly demand. SKU A demand is steady; SKU B swings widely week to week. Explain which needs higher safety stock and why, using service-level/uncertainty intuition (no need for a full formula).",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "logistics",
    minChars: 48,
    conceptHints: [
      "safety stock",
      "demand uncertainty",
      "variability",
      "service level",
      "logistics",
    ],
    misconceptionTargets: [
      "setting identical safety stock when averages match but variance differs",
      "thinking safety stock is only about average demand",
    ],
    successLooksLike:
      "SKU B needs more safety stock because variability raises stockout risk.",
    scaffolds: [
      hint(
        "Buffer for surprise",
        "Safety stock protects against demand (and lead-time) variability.",
      ),
      step(
        "Same mean, different spread",
        "Wide swings create more stockout risk at the same average.",
      ),
      checklist(
        "Safety-stock checklist",
        "Which SKU · uncertainty reason · service idea",
      ),
    ],
    criteria: [
      {
        id: "which",
        label: "Higher safety stock SKU",
        mustIncludeAny: ["b", "swing", "variable", "uncertain", "higher"],
      },
      {
        id: "why",
        label: "Uncertainty reason",
        mustIncludeAny: [
          "variab",
          "uncertain",
          "swing",
          "stockout",
          "volatil",
          "spread",
        ],
      },
      {
        id: "service",
        label: "Service / buffer idea",
        mustIncludeAny: [
          "service",
          "buffer",
          "safety",
          "protect",
          "risk",
        ],
      },
    ],
  },
  {
    id: "sim-logistics-disruption-transfer",
    kind: "simulation",
    title: "Port delay cascade transfer",
    objective:
      "Apply transfer of disruption thinking to a port-delay cascade.",
    prompt:
      "Transfer simulation (new surface): A container ship misses its berth window by 5 days at the port. Trace the cascade to warehouse receiving, outbound store replenishment, and one customer-facing effect. Name one mitigation (alternate mode, safety stock, or re-sequence priority).",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "logistics",
    minChars: 52,
    conceptHints: [
      "disruption",
      "port delay",
      "cascade",
      "replenishment",
      "logistics",
    ],
    misconceptionTargets: [
      "assuming a port delay stays isolated at the dock",
      "mitigating only at the store shelf without upstream options",
    ],
    successLooksLike:
      "Cascade through receiving → replenishment → customer impact; one mitigation named.",
    scaffolds: [
      hint(
        "Downstream dominoes",
        "Late unload delays putaway, then waves to stores, then empty shelves/promises.",
      ),
      step(
        "Mitigate somewhere",
        "Expedite a critical SKU, tap safety stock, or re-prioritize allocations.",
      ),
      checklist(
        "Cascade checklist",
        "Receiving · replenishment · customer effect · mitigation",
      ),
    ],
    criteria: [
      {
        id: "cascade",
        label: "Cascade stages",
        mustIncludeAny: [
          "receiv",
          "warehouse",
          "replenish",
          "store",
          "outbound",
        ],
      },
      {
        id: "customer",
        label: "Customer-facing effect",
        mustIncludeAny: [
          "stockout",
          "delay",
          "shelf",
          "customer",
          "backorder",
          "promise",
        ],
      },
      {
        id: "mitigate",
        label: "Mitigation",
        mustIncludeAny: [
          "alternate",
          "air",
          "safety stock",
          "priority",
          "expedite",
          "re-sequence",
          "mitigat",
        ],
      },
    ],
  },
];
