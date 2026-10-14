/**
 * Content expansion queue — STEM / CS / cyber / networking stem pack.
 * Additive StructuredChallenge fixtures only (not a subject engine).
 */

import type { StructuredChallenge } from "@/lib/learning/activities/structured/service";
import { hint, step, checklist } from "./helpers";

export const CONTENT_EXPANSION_STEM_CHALLENGES: StructuredChallenge[] = [
  // —— Computer science / software ——
  {
    id: "sim-interface-contract",
    kind: "simulation",
    title: "Honor the interface contract",
    objective:
      "Apply Java-style interface abstraction by choosing which methods a class must implement.",
    prompt:
      "Simulation: interface PaymentGateway declares charge(amount) and refund(id). Class StripeAdapter implements PaymentGateway but only has charge. Name the missing obligation, explain why the compiler rejects the class, and describe one benefit of coding to the interface instead of a concrete Stripe class.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "computer science",
    minChars: 48,
    conceptHints: [
      "interface",
      "abstraction",
      "java",
      "implements",
      "contract",
      "polymorphism",
    ],
    misconceptionTargets: [
      "treating interfaces as optional documentation",
      "confusing extends with implements",
    ],
    successLooksLike:
      "You name refund as required, cite the interface contract / compile error, and state a decoupling or substitutability benefit.",
    scaffolds: [
      hint(
        "Contract checklist",
        "An implementing class must provide every method declared on the interface — not just the ones you plan to call today.",
      ),
      step(
        "Separate type from vendor",
        "Ask: if tomorrow you swap Stripe for another provider, which names should call sites keep using?",
      ),
      checklist(
        "Before you submit",
        "Missing method named · why compile fails · one abstraction benefit",
      ),
    ],
    criteria: [
      {
        id: "missing-method",
        label: "Missing method",
        mustIncludeAny: ["refund", "refund(id)"],
      },
      {
        id: "contract",
        label: "Why rejected",
        mustIncludeAny: [
          "implement",
          "contract",
          "compile",
          "must provide",
          "required",
        ],
      },
      {
        id: "benefit",
        label: "Abstraction benefit",
        mustIncludeAny: [
          "swap",
          "decouple",
          "polymorph",
          "substitute",
          "loosely coupled",
          "not depend",
        ],
      },
    ],
  },
  {
    id: "lab-exception-handling-path",
    kind: "lab",
    title: "Trace the try/catch path",
    objective:
      "Perform a control-flow walkthrough of try, catch, and finally for a failing operation.",
    prompt:
      "Lab procedure: method readConfig opens a file inside try, catch(IOException) logs 'missing config', finally always closes the stream. The file is missing. List the blocks that run in order, state whether the exception is handled, and name one risk of an empty catch that swallows the error.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "computer science",
    minChars: 50,
    conceptHints: [
      "exception",
      "try",
      "catch",
      "finally",
      "ioexception",
      "error handling",
    ],
    misconceptionTargets: [
      "assuming finally is skipped when catch runs",
      "believing catch without action still reports the failure",
    ],
    successLooksLike:
      "You order try → catch → finally, say the exception is handled, and warn about silent / swallowed failures.",
    scaffolds: [
      hint(
        "Finally always",
        "finally runs whether the try succeeded or an exception was caught — unless the JVM exits abruptly.",
      ),
      step(
        "Walk the path",
        "Start at open, note the throw, then ask which handler matches, then ask what cleanup still runs.",
      ),
      checklist(
        "Path checklist",
        "Ordered blocks · handled or not · empty-catch risk",
      ),
    ],
    criteria: [
      {
        id: "order",
        label: "Block order",
        mustIncludeAny: ["try", "catch", "finally"],
      },
      {
        id: "handled",
        label: "Handled?",
        mustIncludeAny: ["handled", "caught", "catch runs", "logged"],
      },
      {
        id: "empty-catch",
        label: "Empty catch risk",
        mustIncludeAny: [
          "swallow",
          "silent",
          "hide",
          "mask",
          "lose",
          "never know",
        ],
      },
    ],
  },
  {
    id: "sim-debug-null-npe",
    kind: "simulation",
    title: "Debug a null pointer path",
    objective:
      "Solve a NullPointerException by locating the null reference and proposing a safe check.",
    prompt:
      "Simulation stack: NPE at UserService.getDisplayName line 42: return user.getProfile().getName(); Logs show getUser(id) returned null for id=0. Identify which expression is null, explain why chaining failed, and propose one defensive fix (guard, Optional, or fail-fast) without inventing a full app rewrite.",
    learningObjectType: "SIMULATION",
    skillFacet: "SOLVE",
    asPerform: false,
    domainTag: "computer science",
    minChars: 52,
    conceptHints: [
      "null",
      "npe",
      "nullpointerexception",
      "debugging",
      "stack trace",
      "guard",
    ],
    misconceptionTargets: [
      "blaming getName when an earlier link is null",
      "assuming NPE means the string name is empty",
    ],
    successLooksLike:
      "You identify user (or getUser result) as null, explain the chain dereference, and propose a null check / Optional / early return.",
    scaffolds: [
      hint(
        "Read left to right",
        "In a.b.c(), if a is null the crash happens before b or c run.",
      ),
      step(
        "Match log to expression",
        "The log already says getUser returned null — connect that to the variable used on line 42.",
      ),
      checklist(
        "Debug checklist",
        "Null expression · why chain fails · one defensive fix",
      ),
    ],
    criteria: [
      {
        id: "null-ref",
        label: "Null reference",
        mustIncludeAny: ["user", "getuser", "null user", "returned null"],
      },
      {
        id: "chain",
        label: "Why chaining failed",
        mustIncludeAny: [
          "dereference",
          "dot",
          "chain",
          "call on null",
          "before getprofile",
          "before getname",
        ],
      },
      {
        id: "fix",
        label: "Defensive fix",
        mustIncludeAny: [
          "null check",
          "if null",
          "optional",
          "guard",
          "early return",
          "fail-fast",
          "requireNonNull",
        ],
      },
    ],
  },
  {
    id: "write-unit-test-intent",
    kind: "writing",
    title: "Explain why we unit test",
    objective:
      "Explain the purpose of a unit test in terms of behavior, isolation, and regression safety.",
    prompt:
      "Writing exercise: In your own words, explain what a unit test is trying to prove about one small unit (function/class), why isolation from databases/network matters, and how a failing test after a change protects the team. Avoid pasting a framework tutorial.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "computer science",
    minChars: 50,
    conceptHints: [
      "unit test",
      "testing",
      "regression",
      "isolation",
      "assert",
      "behavior",
    ],
    misconceptionTargets: [
      "thinking tests only prove the code compiles",
      "equating unit tests with manual click-through QA",
    ],
    successLooksLike:
      "You describe expected behavior of a small unit, isolation, and catching regressions after changes.",
    scaffolds: [
      hint(
        "Behavior not framework",
        "Focus on what claim the test makes ('given X, expect Y'), not on JUnit annotations.",
      ),
      step(
        "Three beats",
        "Define the unit → say what you isolate → say what a red test means after a change.",
      ),
      checklist(
        "Explain checklist",
        "Unit behavior · isolation reason · regression protection",
      ),
    ],
    criteria: [
      {
        id: "behavior",
        label: "Behavior claim",
        mustIncludeAny: [
          "behavior",
          "expect",
          "assert",
          "output",
          "return",
          "given",
        ],
      },
      {
        id: "isolation",
        label: "Isolation",
        mustIncludeAny: [
          "isolat",
          "mock",
          "without database",
          "without network",
          "unit alone",
          "dependencies",
        ],
      },
      {
        id: "regression",
        label: "Regression safety",
        mustIncludeAny: [
          "regression",
          "break",
          "failing",
          "change",
          "protect",
          "catch",
        ],
      },
    ],
  },
  {
    id: "sim-git-conflict-resolve",
    kind: "simulation",
    title: "Resolve a merge conflict safely",
    objective:
      "Apply version-control reasoning to choose conflict markers and keep both intended changes.",
    prompt:
      "Simulation: you merge feature/login into main. Conflict in auth.ts: HEAD adds validateEmail(); their branch adds rateLimit(). Markers show <<<<<<< HEAD ... ======= ... >>>>>>>. Explain what each marker region means, which resolution keeps both behaviors, and why committing without reviewing markers is dangerous.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "computer science",
    minChars: 50,
    conceptHints: [
      "git",
      "merge conflict",
      "version control",
      "conflict markers",
      "branch",
    ],
    misconceptionTargets: [
      "always deleting the incoming side",
      "leaving conflict markers in committed code",
    ],
    successLooksLike:
      "You map HEAD vs incoming, keep both validateEmail and rateLimit, and warn about leftover markers.",
    scaffolds: [
      hint(
        "Read the markers",
        "<<<<<<< is your current side, ======= separates, >>>>>>> is the other branch — neither side is automatically 'wrong'.",
      ),
      step(
        "Intent first",
        "Ask which behaviors the team still needs, then edit the file so both remain without markers.",
      ),
      checklist(
        "Conflict checklist",
        "Marker meanings · keep both intents · marker risk",
      ),
    ],
    criteria: [
      {
        id: "markers",
        label: "Marker meaning",
        mustIncludeAny: ["head", "incoming", "=======", "other branch", "theirs"],
      },
      {
        id: "both",
        label: "Keep both behaviors",
        mustIncludeAny: [
          "both",
          "validateemail",
          "ratelimit",
          "keep validate",
          "keep rate",
        ],
      },
      {
        id: "markers-risk",
        label: "Unreviewed markers risk",
        mustIncludeAny: [
          "marker",
          "<<<<<<",
          "syntax",
          "break",
          "compile",
          "runtime",
        ],
      },
    ],
  },
  {
    id: "lab-algorithm-two-sum-trace",
    kind: "lab",
    title: "Trace two-sum reasoning",
    objective:
      "Perform a step-by-step trace of the two-sum problem using a complement map.",
    prompt:
      "Algorithm lab: nums = [2, 7, 11, 15], target = 9. Walk an O(n) hash-map approach: for each value, state the complement you look up, whether it is present, and the indices you return. Also name why nested loops are correct but slower.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "computer science",
    minChars: 52,
    conceptHints: [
      "two sum",
      "algorithm",
      "hash map",
      "complement",
      "indices",
      "complexity",
    ],
    misconceptionTargets: [
      "returning values instead of indices",
      "thinking the hash map must store the whole array first without scanning",
    ],
    successLooksLike:
      "You show complement 7 for 2, find indices 0 and 1, and contrast O(n) map vs O(n²) nested loops.",
    scaffolds: [
      hint(
        "Complement",
        "For value x, the partner you need is target − x — look that up before inserting x.",
      ),
      step(
        "One pass",
        "Process index 0, then 1; stop when the map already holds the complement.",
      ),
      checklist(
        "Trace checklist",
        "Complement named · indices · nested-loop contrast",
      ),
    ],
    criteria: [
      {
        id: "complement",
        label: "Complement",
        mustIncludeAny: ["7", "complement", "9-2", "target -"],
      },
      {
        id: "indices",
        label: "Indices",
        mustIncludeAny: ["0", "1", "index"],
      },
      {
        id: "complexity",
        label: "Nested loops contrast",
        mustIncludeAny: [
          "nested",
          "o(n^2)",
          "o(n²)",
          "slower",
          "brute",
          "two loops",
        ],
      },
    ],
  },
  {
    id: "sim-collections-list-vs-set",
    kind: "simulation",
    title: "Choose List vs Set",
    objective:
      "Apply collection trade-offs: order, duplicates, and membership checks.",
    prompt:
      "Simulation: you store ticket IDs for a queue display (order matters, duplicates must not appear twice on screen) and separately need fast 'already processed?' checks. For each need, choose List or Set (or both in a pipeline), and justify with order vs uniqueness vs lookup.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "computer science",
    minChars: 48,
    conceptHints: [
      "list",
      "set",
      "collections",
      "duplicates",
      "order",
      "membership",
    ],
    misconceptionTargets: [
      "assuming List prevents duplicates automatically",
      "assuming Set preserves insertion order in every language",
    ],
    successLooksLike:
      "You use ordered unique display (List+Set or LinkedHashSet-style reasoning) and Set for membership, citing duplicates and lookup.",
    scaffolds: [
      hint(
        "Ask two questions",
        "Do you care about sequence? Do you care about uniqueness or O(1)-ish contains?",
      ),
      step(
        "Split the jobs",
        "Display order and 'already seen' are different jobs — they may need different structures.",
      ),
      checklist(
        "Collection checklist",
        "Display choice · membership choice · uniqueness/order reason",
      ),
    ],
    criteria: [
      {
        id: "display",
        label: "Display structure",
        mustIncludeAny: ["list", "ordered", "queue", "sequence", "linkedhash"],
      },
      {
        id: "membership",
        label: "Membership structure",
        mustIncludeAny: ["set", "contains", "membership", "lookup", "hash"],
      },
      {
        id: "duplicates",
        label: "Duplicates / uniqueness",
        mustIncludeAny: ["duplicate", "unique", "uniqueness", "once", "no repeat"],
      },
    ],
  },

  // —— SQL-adjacent reasoning (sims / writing, not SQL evaluator) ——
  {
    id: "sim-normalization-1nf",
    kind: "simulation",
    title: "Spot a 1NF violation",
    objective:
      "Apply first normal form by identifying multi-valued cells and proposing atomic rows.",
    prompt:
      "Simulation table Orders: order_id=7, items='widget,gadget,sensor' in one cell, customer='Ana'. Explain why this violates 1NF, propose a redesign with an order_items table (columns you need), and state one query problem multi-valued cells cause.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "computer science",
    minChars: 50,
    conceptHints: [
      "normalization",
      "1nf",
      "atomic",
      "multi-valued",
      "schema",
      "database",
    ],
    misconceptionTargets: [
      "thinking 1NF is only about primary keys",
      "storing CSV lists as acceptable relational cells",
    ],
    successLooksLike:
      "You cite non-atomic items, propose order_items with order_id + item, and name filtering/counting pain.",
    scaffolds: [
      hint(
        "Atomic values",
        "1NF wants one value per cell — a comma-separated list is multiple facts jammed together.",
      ),
      step(
        "Child table",
        "Move repeating item facts into rows that reference the parent order_id.",
      ),
      checklist(
        "1NF checklist",
        "Violation named · new table/columns · query pain",
      ),
    ],
    criteria: [
      {
        id: "violation",
        label: "1NF violation",
        mustIncludeAny: [
          "multi",
          "comma",
          "list",
          "atomic",
          "non-atomic",
          "multiple values",
        ],
      },
      {
        id: "redesign",
        label: "Redesign",
        mustIncludeAny: [
          "order_items",
          "order id",
          "item",
          "separate table",
          "child table",
        ],
      },
      {
        id: "query-pain",
        label: "Query problem",
        mustIncludeAny: [
          "filter",
          "like",
          "count",
          "join",
          "hard to query",
          "split",
          "search",
        ],
      },
    ],
  },
  {
    id: "sim-index-selectivity",
    kind: "simulation",
    title: "When an index helps",
    objective:
      "Apply selectivity reasoning to decide whether an index is useful.",
    prompt:
      "Simulation: table Users has 1,000,000 rows. Column is_active is true for 950,000 rows; column email is unique. Workload mostly looks up by email and occasionally filters WHERE is_active = true. Which column deserves an index first, why selectivity matters, and why indexing is_active alone may not help much?",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "computer science",
    minChars: 50,
    conceptHints: [
      "index",
      "selectivity",
      "database",
      "query",
      "cardinality",
      "lookup",
    ],
    misconceptionTargets: [
      "indexing every column by default",
      "assuming low-selectivity boolean columns always speed filters",
    ],
    successLooksLike:
      "You pick email, explain high selectivity / unique lookups, and note is_active matches most rows so the index is weak.",
    scaffolds: [
      hint(
        "Selectivity",
        "Indexes help most when a predicate narrows to a small fraction of rows.",
      ),
      step(
        "Compare match rates",
        "Email points to ~1 row; is_active=true still leaves almost the whole table.",
      ),
      checklist(
        "Index checklist",
        "Chosen column · selectivity reason · weak boolean case",
      ),
    ],
    criteria: [
      {
        id: "choose-email",
        label: "Index email first",
        mustIncludeAny: ["email"],
      },
      {
        id: "selectivity",
        label: "Selectivity",
        mustIncludeAny: [
          "selectiv",
          "unique",
          "few rows",
          "cardinality",
          "narrow",
        ],
      },
      {
        id: "boolean-weak",
        label: "Why is_active weak",
        mustIncludeAny: [
          "most rows",
          "950",
          "almost all",
          "low selectiv",
          "not selective",
          "still scans",
        ],
      },
    ],
  },
  {
    id: "write-transaction-acid",
    kind: "writing",
    title: "Explain ACID in plain language",
    objective:
      "Explain Atomicity, Consistency, Isolation, and Durability with a concrete transfer example.",
    prompt:
      "Writing: Using a bank transfer of $50 from A to B, explain each ACID letter in one short beat — what could go wrong if that property failed. Keep it conceptual (no vendor lock-in essay).",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "computer science",
    minChars: 55,
    conceptHints: [
      "acid",
      "transaction",
      "atomicity",
      "consistency",
      "isolation",
      "durability",
    ],
    misconceptionTargets: [
      "confusing durability with backups only",
      "treating isolation as authentication",
    ],
    successLooksLike:
      "You cover all four ACID properties with transfer-flavored failure modes.",
    scaffolds: [
      hint(
        "Four failure stories",
        "All-or-nothing debit/credit · rules still hold · concurrent weirdness · crash after commit.",
      ),
      step(
        "One sentence each",
        "Name the letter, define it, then say the $50 failure mode.",
      ),
      checklist(
        "ACID checklist",
        "A · C · I · D each with a transfer risk",
      ),
    ],
    criteria: [
      {
        id: "atomicity",
        label: "Atomicity",
        mustIncludeAny: ["atomic", "all or nothing", "partial", "rollback"],
      },
      {
        id: "consistency",
        label: "Consistency",
        mustIncludeAny: ["consist", "invariant", "rule", "balance", "valid"],
      },
      {
        id: "isolation",
        label: "Isolation",
        mustIncludeAny: [
          "isolat",
          "concurrent",
          "race",
          "dirty",
          "interference",
          "simultaneous",
        ],
      },
      {
        id: "durability",
        label: "Durability",
        mustIncludeAny: ["durab", "crash", "persist", "disk", "survives", "commit"],
      },
    ],
  },

  // —— Cybersecurity (defensive only) ——
  {
    id: "sim-cia-triad-breach",
    kind: "simulation",
    title: "Map a breach to the CIA triad",
    objective:
      "Apply confidentiality, integrity, and availability to classify an incident impact.",
    prompt:
      "Simulation (defensive analysis): After a ransomware event, patient records are encrypted offline, a public paste shows a sample record, and the ER scheduling system is down. Map each observed impact to C, I, and/or A, and state one defensive control that would have reduced that impact (no attack steps).",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "cybersecurity",
    minChars: 52,
    conceptHints: [
      "cia triad",
      "confidentiality",
      "integrity",
      "availability",
      "incident",
      "ransomware",
    ],
    misconceptionTargets: [
      "treating CIA as only confidentiality",
      "equating integrity with uptime",
    ],
    successLooksLike:
      "You map leak→C, encryption/tamper→I and/or A, downtime→A, and name backups/access control/encryption-at-rest style defenses.",
    scaffolds: [
      hint(
        "Three questions",
        "Was data exposed? Was data altered/untrustworthy? Could people use the system?",
      ),
      step(
        "One impact → one letter",
        "Paste sample → C; encrypted/unusable records → A (and often I concerns); scheduling down → A.",
      ),
      checklist(
        "CIA checklist",
        "C mapping · I mapping · A mapping · one control each theme",
      ),
    ],
    criteria: [
      {
        id: "confidentiality",
        label: "Confidentiality",
        mustIncludeAny: [
          "confidential",
          "leak",
          "paste",
          "exposed",
          "disclosure",
        ],
      },
      {
        id: "integrity",
        label: "Integrity",
        mustIncludeAny: [
          "integr",
          "alter",
          "encrypt",
          "tamper",
          "trustworth",
          "modified",
        ],
      },
      {
        id: "availability",
        label: "Availability",
        mustIncludeAny: [
          "availab",
          "down",
          "offline",
          "ransomware",
          "scheduling",
          "cannot use",
        ],
      },
      {
        id: "control",
        label: "Defensive control",
        mustIncludeAny: [
          "backup",
          "access control",
          "mfa",
          "least privilege",
          "encrypt",
          "segment",
          "monitor",
        ],
      },
    ],
  },
  {
    id: "sim-mfa-bypass-social",
    kind: "simulation",
    title: "MFA under social pressure",
    objective:
      "Apply MFA importance by choosing a safe response to a social-engineering prompt.",
    prompt:
      "Defensive simulation: a caller claiming to be IT says your MFA is broken and asks you to read the six-digit code from your authenticator 'so they can sync your account.' Password was already phished yesterday. Explain why sharing the code defeats MFA, what you do instead, and one habit that keeps MFA effective.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "cybersecurity",
    minChars: 48,
    conceptHints: [
      "mfa",
      "multi-factor",
      "social engineering",
      "authenticator",
      "phishing",
      "verification",
    ],
    misconceptionTargets: [
      "believing IT always needs your live MFA code",
      "thinking MFA still protects you after you read codes aloud",
    ],
    successLooksLike:
      "You refuse code sharing, explain second-factor theft, and verify via known IT channel / report.",
    scaffolds: [
      hint(
        "Codes are secrets",
        "An MFA code is a short-lived second factor — anyone who has it can act as you.",
      ),
      step(
        "Out-of-band verify",
        "Hang up and contact IT using a known number or portal — never the callback the stranger provides.",
      ),
      checklist(
        "MFA checklist",
        "Why sharing defeats MFA · safe action · lasting habit",
      ),
    ],
    criteria: [
      {
        id: "defeats",
        label: "Why sharing defeats MFA",
        mustIncludeAny: [
          "second factor",
          "defeats",
          "bypass",
          "act as you",
          "impersonat",
          "code is secret",
        ],
      },
      {
        id: "safe-action",
        label: "Safe action",
        mustIncludeAny: [
          "refuse",
          "hang up",
          "verify",
          "official",
          "report",
          "known channel",
          "do not share",
        ],
      },
      {
        id: "habit",
        label: "Protective habit",
        mustIncludeAny: [
          "never share",
          "out-of-band",
          "phish",
          "check url",
          "authenticator",
          "it portal",
        ],
      },
    ],
  },
  {
    id: "lab-least-privilege-roles",
    kind: "lab",
    title: "Assign least-privilege roles",
    objective:
      "Perform a role assignment that grants only the permissions each job needs.",
    prompt:
      "Lab: roles are Reader (view tickets), Agent (view+update tickets), Admin (view+update+delete+manage users). New hire Jordan only answers tickets; intern Riley only views the queue for training; Sam temporarily covers user onboarding. Assign each person a role, justify with least privilege, and name one risk of giving everyone Admin.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "cybersecurity",
    minChars: 50,
    conceptHints: [
      "least privilege",
      "rbac",
      "roles",
      "permissions",
      "access control",
    ],
    misconceptionTargets: [
      "granting Admin for convenience",
      "confusing job title with maximum access",
    ],
    successLooksLike:
      "Jordan→Agent, Riley→Reader, Sam→Admin (temporary), with blast-radius reasoning.",
    scaffolds: [
      hint(
        "Need to do the job",
        "Grant the minimum role that still lets the person complete assigned tasks — nothing more.",
      ),
      step(
        "Match tasks to verbs",
        "View only → Reader; update tickets → Agent; manage users → Admin.",
      ),
      checklist(
        "Privilege checklist",
        "Jordan · Riley · Sam · Admin over-grant risk",
      ),
    ],
    criteria: [
      {
        id: "jordan",
        label: "Jordan role",
        mustIncludeAny: ["agent"],
      },
      {
        id: "riley",
        label: "Riley role",
        mustIncludeAny: ["reader"],
      },
      {
        id: "sam",
        label: "Sam role",
        mustIncludeAny: ["admin"],
      },
      {
        id: "risk",
        label: "Admin-for-all risk",
        mustIncludeAny: [
          "delete",
          "blast",
          "mistake",
          "compromise",
          "over-privilege",
          "too much access",
        ],
      },
    ],
  },
  {
    id: "sim-incident-first-hour",
    kind: "simulation",
    title: "First-hour incident triage",
    objective:
      "Solve an incident-response triage by ordering contain, assess, and communicate steps.",
    prompt:
      "Defensive IR simulation (no exploit how-to): Alerts show unusual admin logins and a workstation encrypting shares. In the first hour, prioritize three actions from {isolate host, preserve logs, notify stakeholders, rebuild from scratch immediately, post publicly}. Justify order using contain → evidence → communicate, and say why wiping first can destroy evidence.",
    learningObjectType: "SIMULATION",
    skillFacet: "SOLVE",
    asPerform: false,
    domainTag: "cybersecurity",
    minChars: 52,
    conceptHints: [
      "incident response",
      "triage",
      "containment",
      "forensics",
      "communication",
      "ir",
    ],
    misconceptionTargets: [
      "wiping systems before containment and evidence capture",
      "public posting before internal coordination",
    ],
    successLooksLike:
      "You isolate, preserve logs, notify stakeholders; reject premature wipe/public post; explain evidence loss.",
    scaffolds: [
      hint(
        "Stop the bleed first",
        "Containment limits spread; evidence capture needs volatile data before rebuilds.",
      ),
      step(
        "Hour-one order",
        "Isolate → preserve logs → notify internal stakeholders; delay wipe and public statements.",
      ),
      checklist(
        "IR checklist",
        "Three prioritized actions · reject wipe-first · evidence reason",
      ),
    ],
    criteria: [
      {
        id: "isolate",
        label: "Isolate",
        mustIncludeAny: ["isolate", "contain", "segment", "quarantine"],
      },
      {
        id: "logs",
        label: "Preserve evidence",
        mustIncludeAny: ["log", "evidence", "preserve", "forensic", "capture"],
      },
      {
        id: "notify",
        label: "Notify",
        mustIncludeAny: ["notify", "stakeholder", "communicate", "incident team"],
      },
      {
        id: "wipe-risk",
        label: "Wipe-first risk",
        mustIncludeAny: [
          "evidence",
          "destroy",
          "lose",
          "wipe",
          "rebuild too early",
          "volatile",
        ],
      },
    ],
  },
  {
    id: "write-threat-model-stride-lite",
    kind: "writing",
    title: "STRIDE-lite threat notes",
    objective:
      "Explain a lightweight threat model using a few STRIDE categories for a simple web login.",
    prompt:
      "Writing (defensive): For a basic username/password login page, pick three STRIDE categories (Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege). For each, state one realistic threat and one mitigation. Educational only — no attack instructions.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "cybersecurity",
    minChars: 55,
    conceptHints: [
      "threat model",
      "stride",
      "spoofing",
      "tampering",
      "mitigation",
      "login",
    ],
    misconceptionTargets: [
      "listing attacks without mitigations",
      "thinking threat modeling requires only tools, not reasoning",
    ],
    successLooksLike:
      "Three STRIDE categories each with a threat and a mitigation tied to login.",
    scaffolds: [
      hint(
        "Pair threat + control",
        "Each category should answer: what could go wrong, and what control reduces it?",
      ),
      step(
        "Stay at login scope",
        "Keep examples at credentials, session tokens, and availability — not unrelated features.",
      ),
      checklist(
        "STRIDE checklist",
        "Three categories · threat each · mitigation each",
      ),
    ],
    criteria: [
      {
        id: "categories",
        label: "STRIDE categories",
        mustIncludeAny: [
          "spoof",
          "tamper",
          "repudiation",
          "disclosure",
          "denial",
          "elevation",
          "dos",
        ],
      },
      {
        id: "threats",
        label: "Threats named",
        mustIncludeAny: [
          "phish",
          "brute",
          "session",
          "inject",
          "leak",
          "flood",
          "privilege",
          "credential",
        ],
      },
      {
        id: "mitigations",
        label: "Mitigations",
        mustIncludeAny: [
          "mfa",
          "hash",
          "tls",
          "rate limit",
          "logging",
          "lockout",
          "least privilege",
          "validation",
          "https",
        ],
      },
    ],
  },

  // —— Networking ——
  {
    id: "lab-osi-layer-map",
    kind: "lab",
    title: "Map OSI to TCP/IP",
    objective:
      "Perform a mapping of OSI layers to the TCP/IP model with example protocols.",
    prompt:
      "Lab worksheet: Place HTTP, TCP, IP, and Ethernet into the best OSI layer(s), then show how those collapse into the TCP/IP model (Application / Transport / Internet / Network Access). Note one common confusion between Layer 3 and Layer 4.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "networking",
    minChars: 50,
    conceptHints: [
      "osi",
      "tcp/ip",
      "layer",
      "http",
      "tcp",
      "ip",
      "ethernet",
    ],
    misconceptionTargets: [
      "putting IP at Layer 4",
      "thinking HTTP replaces TCP",
    ],
    successLooksLike:
      "HTTP→App, TCP→Transport/L4, IP→Internet/L3, Ethernet→Network Access/L2; note L3 vs L4 mix-up.",
    scaffolds: [
      hint(
        "Job of each layer",
        "App talks meaning; transport delivers ports/reliability; network routes; link moves frames on a medium.",
      ),
      step(
        "Collapse carefully",
        "OSI 5–7 often map into TCP/IP Application; OSI 1–2 into Network Access.",
      ),
      checklist(
        "Layer checklist",
        "Four protocols placed · TCP/IP names · L3/L4 confusion",
      ),
    ],
    criteria: [
      {
        id: "http",
        label: "HTTP layer",
        mustIncludeAny: ["application", "layer 7", "l7"],
      },
      {
        id: "tcp",
        label: "TCP layer",
        mustIncludeAny: ["transport", "layer 4", "l4"],
      },
      {
        id: "ip",
        label: "IP layer",
        mustIncludeAny: ["internet", "network layer", "layer 3", "l3"],
      },
      {
        id: "ethernet",
        label: "Ethernet / access",
        mustIncludeAny: [
          "ethernet",
          "data link",
          "network access",
          "layer 2",
          "l2",
        ],
      },
    ],
  },
  {
    id: "sim-dhcp-apipa",
    kind: "simulation",
    title: "DHCP miss vs APIPA",
    objective:
      "Apply DHCP vs APIPA reasoning to explain a 169.254 address.",
    prompt:
      "Simulation: a Windows laptop shows IPv4 169.254.32.10, no default gateway, and cannot reach internal servers by name. Explain what APIPA means, why it appears when DHCP fails, and two checks you would run next (link, DHCP server reachability, or renew).",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "networking",
    minChars: 48,
    conceptHints: [
      "dhcp",
      "apipa",
      "169.254",
      "link-local",
      "lease",
      "gateway",
    ],
    misconceptionTargets: [
      "thinking 169.254 is a normal routable LAN address",
      "assuming DNS failure alone causes APIPA",
    ],
    successLooksLike:
      "You identify link-local/APIPA after DHCP failure and propose cable/DHCP/server/renew checks.",
    scaffolds: [
      hint(
        "169.254 hint",
        "Addresses starting 169.254 are link-local autopilot — not a DHCP lease from your server.",
      ),
      step(
        "Work backwards",
        "Confirm physical/link, then whether a DHCP offer can arrive, then try renew/release.",
      ),
      checklist(
        "APIPA checklist",
        "APIPA meaning · DHCP failure link · two next checks",
      ),
    ],
    criteria: [
      {
        id: "apipa",
        label: "APIPA meaning",
        mustIncludeAny: [
          "apipa",
          "link-local",
          "169.254",
          "automatic private",
        ],
      },
      {
        id: "dhcp-fail",
        label: "DHCP failure",
        mustIncludeAny: [
          "dhcp",
          "no lease",
          "offer",
          "failed",
          "unreachable server",
        ],
      },
      {
        id: "checks",
        label: "Next checks",
        mustIncludeAny: [
          "cable",
          "link",
          "renew",
          "dhcp server",
          "switch",
          "release",
          "wifi",
        ],
      },
    ],
  },
  {
    id: "lab-vlan-broadcast",
    kind: "lab",
    title: "VLAN broadcast domain lab",
    objective:
      "Perform a VLAN reasoning lab: which hosts share a broadcast domain.",
    prompt:
      "Lab: Switch ports — PC-A VLAN 10, PC-B VLAN 10, PC-C VLAN 20. A sends a broadcast frame. State who receives it, whether B and C need a router to talk IP, and why VLANs shrink broadcast domains.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "networking",
    minChars: 45,
    conceptHints: [
      "vlan",
      "broadcast domain",
      "switch",
      "router",
      "segmentation",
    ],
    misconceptionTargets: [
      "assuming all switch ports share one broadcast domain regardless of VLAN",
      "thinking VLANs replace IP routing entirely",
    ],
    successLooksLike:
      "Only VLAN 10 hears the broadcast (A+B); C needs L3 routing; VLANs limit broadcast scope.",
    scaffolds: [
      hint(
        "Same VLAN = same broadcast domain",
        "Broadcasts stay inside the VLAN unless something routes between VLANs.",
      ),
      step(
        "Name receivers",
        "List who shares VLAN 10 first, then ask what C needs to reach them at L3.",
      ),
      checklist(
        "VLAN checklist",
        "Broadcast receivers · router need · why domains shrink",
      ),
    ],
    criteria: [
      {
        id: "receivers",
        label: "Broadcast receivers",
        mustIncludeAny: ["pc-b", "b", "vlan 10", "not c", "only"],
      },
      {
        id: "router",
        label: "Inter-VLAN routing",
        mustIncludeAny: ["router", "layer 3", "l3", "inter-vlan", "gateway"],
      },
      {
        id: "shrink",
        label: "Why VLANs help",
        mustIncludeAny: [
          "broadcast",
          "segment",
          "isolate",
          "smaller domain",
          "limit",
        ],
      },
    ],
  },
  {
    id: "sim-wifi-auth-fail",
    kind: "simulation",
    title: "Wireless auth failure triage",
    objective:
      "Solve a Wi-Fi authentication failure using association vs IP symptoms.",
    prompt:
      "Simulation: laptop shows 'connected, no internet'. Wi-Fi status: authenticated to CorpSSID (WPA2-Enterprise). ipconfig: APIPA 169.254.x.x. Separate whether the wireless auth succeeded, what failed next, and the next two checks (DHCP, VLAN/AAA authorization, DNS) without hacking the AP.",
    learningObjectType: "SIMULATION",
    skillFacet: "SOLVE",
    asPerform: false,
    domainTag: "networking",
    minChars: 50,
    conceptHints: [
      "wifi",
      "wpa2",
      "authentication",
      "association",
      "dhcp",
      "apipa",
    ],
    misconceptionTargets: [
      "assuming 'connected' means full network access",
      "blaming only the password when APIPA appears after auth",
    ],
    successLooksLike:
      "Auth/association OK; DHCP/IP assignment failed; propose DHCP/VLAN/AAA checks.",
    scaffolds: [
      hint(
        "Two stages",
        "Wireless auth can succeed while IPv4 configuration still fails afterward.",
      ),
      step(
        "Read the address",
        "169.254 after a successful SSID join points past the password — toward DHCP/authorization.",
      ),
      checklist(
        "Wi-Fi checklist",
        "Auth status · post-auth failure · two checks",
      ),
    ],
    criteria: [
      {
        id: "auth-ok",
        label: "Auth succeeded",
        mustIncludeAny: [
          "authenticated",
          "auth succeeded",
          "association",
          "wpa",
          "connected to ssid",
        ],
      },
      {
        id: "dhcp-fail",
        label: "IP/DHCP failure",
        mustIncludeAny: ["dhcp", "apipa", "169.254", "no lease", "no ip"],
      },
      {
        id: "next-checks",
        label: "Next checks",
        mustIncludeAny: [
          "dhcp",
          "vlan",
          "aaa",
          "radius",
          "dns",
          "authorization",
          "scope",
        ],
      },
    ],
  },

  // —— Mathematics ——
  {
    id: "lab-fraction-ops",
    kind: "lab",
    title: "Fraction operations lab",
    objective:
      "Perform addition and multiplication of fractions with common-denominator reasoning.",
    prompt:
      "Lab: Compute 1/4 + 1/6 and 2/3 × 3/5. Show common-denominator or cancellation steps, give both answers in lowest terms, and name one mistake (adding denominators or canceling across addition).",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "mathematics",
    minChars: 45,
    conceptHints: [
      "fraction",
      "denominator",
      "numerator",
      "lowest terms",
      "multiply",
      "add",
    ],
    misconceptionTargets: [
      "adding denominators when adding fractions",
      "canceling terms across an addition sign",
    ],
    successLooksLike:
      "You get 5/12 and 2/5 with valid steps and name a common error.",
    scaffolds: [
      hint(
        "Different operations",
        "Addition needs a common denominator; multiplication multiplies across — don't mix the rules.",
      ),
      step(
        "LCD then multiply",
        "For 1/4+1/6 find LCD 12; for 2/3×3/5 cancel or multiply then reduce.",
      ),
      checklist(
        "Fraction checklist",
        "Sum · product · one named mistake",
      ),
    ],
    criteria: [
      {
        id: "sum",
        label: "Sum",
        mustIncludeAny: ["5/12", "5⁄12"],
      },
      {
        id: "product",
        label: "Product",
        mustIncludeAny: ["2/5", "2⁄5"],
      },
      {
        id: "mistake",
        label: "Common mistake",
        mustIncludeAny: [
          "add denomin",
          "cancel",
          "mistake",
          "wrong lcd",
          "across addition",
        ],
      },
    ],
  },
  {
    id: "sim-percent-discount",
    kind: "simulation",
    title: "Stack a percent discount",
    objective:
      "Apply percent decrease to a price and explain the remaining portion.",
    prompt:
      "Simulation: A $80 jacket is 25% off. Compute the sale price, show whether you used 0.25×80 or 0.75×80, and explain why taking 25% off is not the same as subtracting 25 dollars automatically.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "mathematics",
    minChars: 42,
    conceptHints: [
      "percent",
      "discount",
      "sale price",
      "proportion",
      "decimal",
    ],
    misconceptionTargets: [
      "subtracting the percent number as dollars",
      "adding the discount instead of multiplying",
    ],
    successLooksLike:
      "Sale price $60 via 75% remaining or 25% off $80, with percent-vs-dollars caution.",
    scaffolds: [
      hint(
        "Remaining percent",
        "25% off means you pay 75% of the original — multiply by 0.75.",
      ),
      step(
        "Compute then interpret",
        "Find the dollar discount or the sale price, then say what 25 means relative to 80.",
      ),
      checklist(
        "Percent checklist",
        "Sale price · method · percent≠dollars",
      ),
    ],
    criteria: [
      {
        id: "price",
        label: "Sale price",
        mustIncludeAny: ["60", "$60"],
      },
      {
        id: "method",
        label: "Method",
        mustIncludeAny: ["0.75", "75%", "0.25", "25%", "20"],
      },
      {
        id: "not-dollars",
        label: "Percent vs dollars",
        mustIncludeAny: [
          "not 25 dollars",
          "percent of",
          "depends on",
          "not the same",
          "relative",
        ],
      },
    ],
  },
  {
    id: "lab-linear-system-two",
    kind: "lab",
    title: "Solve a 2×2 linear system",
    objective:
      "Perform elimination or substitution on a two-variable linear system.",
    prompt:
      "Lab: Solve x + y = 10 and 2x − y = 2. Show substitution or elimination steps, state the (x, y) pair, and verify by plugging back into both equations.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "mathematics",
    minChars: 48,
    conceptHints: [
      "system of equations",
      "linear",
      "substitution",
      "elimination",
      "variables",
    ],
    misconceptionTargets: [
      "solving only one equation",
      "forgetting to check in both equations",
    ],
    successLooksLike:
      "You find x=4, y=6 with method shown and a verification step.",
    scaffolds: [
      hint(
        "Eliminate y",
        "Adding the equations cancels y if coefficients are opposites — check the signs.",
      ),
      step(
        "Solve then back-substitute",
        "Get one variable, substitute into the simpler equation, then verify both.",
      ),
      checklist(
        "System checklist",
        "Method · (x,y) · verification",
      ),
    ],
    criteria: [
      {
        id: "x",
        label: "x value",
        mustIncludeAny: ["x = 4", "x=4", "(4"],
      },
      {
        id: "y",
        label: "y value",
        mustIncludeAny: ["y = 6", "y=6", "6)"],
      },
      {
        id: "verify",
        label: "Verification",
        mustIncludeAny: ["verify", "plug", "check", "both", "substitut"],
      },
    ],
  },
  {
    id: "sim-mean-outlier",
    kind: "simulation",
    title: "Mean pulled by an outlier",
    objective:
      "Apply mean calculation and explain how an outlier shifts the average.",
    prompt:
      "Simulation: quiz scores 70, 72, 74, 76, 98. Compute the mean, identify the outlier, and explain whether the mean or median better represents a 'typical' score here and why.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "mathematics",
    minChars: 45,
    conceptHints: [
      "mean",
      "average",
      "outlier",
      "median",
      "statistics",
      "typical",
    ],
    misconceptionTargets: [
      "assuming the mean always equals a typical value",
      "ignoring outliers when interpreting averages",
    ],
    successLooksLike:
      "Mean 78, outlier 98, prefer median (~74) for typical with reasoning.",
    scaffolds: [
      hint(
        "Sum ÷ n",
        "Add all five scores, divide by 5 — then look which point sits far from the cluster.",
      ),
      step(
        "Compare centers",
        "Order the list for the median; contrast with the mean pulled toward 98.",
      ),
      checklist(
        "Stats checklist",
        "Mean · outlier · mean vs median choice",
      ),
    ],
    criteria: [
      {
        id: "mean",
        label: "Mean",
        mustIncludeAny: ["78", "78.0"],
      },
      {
        id: "outlier",
        label: "Outlier",
        mustIncludeAny: ["98", "outlier"],
      },
      {
        id: "median-better",
        label: "Typical measure",
        mustIncludeAny: ["median", "typical", "resistant", "not pulled", "skew"],
      },
    ],
  },
  {
    id: "write-probability-fair-coin",
    kind: "writing",
    title: "Explain fair-coin probability",
    objective:
      "Explain independent fair-coin probability for single and combined flips.",
    prompt:
      "Writing: A fair coin has P(H)=1/2. Explain what 'fair' means, why two heads in a row has probability 1/4 if flips are independent, and why 'due for tails' after many heads is a misconception.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "mathematics",
    minChars: 50,
    conceptHints: [
      "probability",
      "fair coin",
      "independent",
      "gambler's fallacy",
      "sample space",
    ],
    misconceptionTargets: [
      "gambler's fallacy that tails becomes due",
      "adding probabilities of independent heads instead of multiplying",
    ],
    successLooksLike:
      "Fair = equal outcomes; HH = 1/4 via independence; past flips don't change the next.",
    scaffolds: [
      hint(
        "Independence",
        "If flips don't influence each other, multiply the single-flip probabilities for a sequence.",
      ),
      step(
        "Call out the fallacy",
        "State clearly that memoryless coins don't 'owe' a tails.",
      ),
      checklist(
        "Probability checklist",
        "Fair definition · HH probability · due-for-tails myth",
      ),
    ],
    criteria: [
      {
        id: "fair",
        label: "Fair meaning",
        mustIncludeAny: ["equal", "1/2", "fifty", "unbiased", "same chance"],
      },
      {
        id: "two-heads",
        label: "Two heads",
        mustIncludeAny: ["1/4", "0.25", "multiply", "independent"],
      },
      {
        id: "fallacy",
        label: "Not due for tails",
        mustIncludeAny: [
          "not due",
          "independent",
          "same probability",
          "gambler",
          "doesn't remember",
          "still 1/2",
        ],
      },
    ],
  },
  {
    id: "lab-pythagorean-apply",
    kind: "lab",
    title: "Apply Pythagorean theorem",
    objective:
      "Perform a right-triangle side calculation using a²+b²=c².",
    prompt:
      "Lab: A right triangle has legs 6 and 8. Find the hypotenuse, show the squared steps, and state how you know which side is c. Include units as 'units' if none given.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "mathematics",
    minChars: 40,
    conceptHints: [
      "pythagorean",
      "hypotenuse",
      "right triangle",
      "legs",
      "square root",
    ],
    misconceptionTargets: [
      "using a leg as the hypotenuse in the formula",
      "forgetting to take the square root at the end",
    ],
    successLooksLike:
      "Hypotenuse 10 from 36+64=100, with c opposite the right angle.",
    scaffolds: [
      hint(
        "c is longest",
        "The hypotenuse is opposite the right angle — the longest side.",
      ),
      step(
        "Square, add, root",
        "Compute 6² and 8², add, then √ to get c.",
      ),
      checklist(
        "Triangle checklist",
        "Identify c · show squares · hypotenuse value",
      ),
    ],
    criteria: [
      {
        id: "hyp",
        label: "Hypotenuse",
        mustIncludeAny: ["10", "10 units"],
      },
      {
        id: "squares",
        label: "Squared steps",
        mustIncludeAny: ["36", "64", "100", "6^2", "8^2", "6²", "8²"],
      },
      {
        id: "which-c",
        label: "Which side is c",
        mustIncludeAny: [
          "hypotenuse",
          "opposite right",
          "longest",
          "across from right",
        ],
      },
    ],
  },
  {
    id: "sim-log-exponent-undo",
    kind: "simulation",
    title: "Logs undo exponents",
    objective:
      "Apply the inverse relationship between exponents and logarithms.",
    prompt:
      "Simulation: You know 2^x = 32. Rewrite using a log statement, solve for x, and explain in one sentence why log base 2 'undoes' the exponential. Mention one domain restriction (argument > 0).",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "mathematics",
    minChars: 42,
    conceptHints: [
      "logarithm",
      "exponent",
      "inverse",
      "log base",
      "power",
    ],
    misconceptionTargets: [
      "treating log as multiplication",
      "allowing non-positive log arguments",
    ],
    successLooksLike:
      "log₂(32)=x, x=5, inverse language, argument positive.",
    scaffolds: [
      hint(
        "Definition bridge",
        "b^c = a means log_b(a) = c — same relationship, two writings.",
      ),
      step(
        "Ask what power",
        "2 to what power is 32? Count doubling: 2,4,8,16,32.",
      ),
      checklist(
        "Log checklist",
        "Log form · x value · inverse + domain note",
      ),
    ],
    criteria: [
      {
        id: "log-form",
        label: "Log form",
        mustIncludeAny: ["log", "log2", "log₂", "log_2"],
      },
      {
        id: "x",
        label: "x value",
        mustIncludeAny: ["5", "x = 5", "x=5"],
      },
      {
        id: "inverse",
        label: "Inverse / domain",
        mustIncludeAny: [
          "inverse",
          "undo",
          "positive",
          "greater than 0",
          "> 0",
          "argument",
        ],
      },
    ],
  },

  // —— Physics ——
  {
    id: "lab-kinematics-distance",
    kind: "lab",
    title: "Distance at constant speed",
    objective:
      "Perform a constant-speed distance calculation using d = vt.",
    prompt:
      "Lab: A cart moves at constant 4 m/s for 6 s. Compute distance, show the formula substitution, and state what would change if speed were not constant (why d=vt alone is insufficient).",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "physics",
    minChars: 42,
    conceptHints: [
      "kinematics",
      "distance",
      "velocity",
      "speed",
      "d=vt",
      "motion",
    ],
    misconceptionTargets: [
      "using d=vt when acceleration is significant without adaptation",
      "confusing speed with velocity direction needs",
    ],
    successLooksLike:
      "Distance 24 m with d=vt shown; note acceleration needs other equations.",
    scaffolds: [
      hint(
        "Constant speed only",
        "d = vt assumes speed doesn't change during the interval.",
      ),
      step(
        "Substitute units",
        "Multiply 4 m/s by 6 s — seconds cancel to meters.",
      ),
      checklist(
        "Motion checklist",
        "Distance · substitution · non-constant caveat",
      ),
    ],
    criteria: [
      {
        id: "distance",
        label: "Distance",
        mustIncludeAny: ["24", "24 m", "24 meters"],
      },
      {
        id: "formula",
        label: "Formula use",
        mustIncludeAny: ["d = vt", "d=vt", "4", "6", "v*t"],
      },
      {
        id: "caveat",
        label: "Non-constant caveat",
        mustIncludeAny: [
          "accelerat",
          "not constant",
          "average",
          "changing speed",
          "kinematics equation",
        ],
      },
    ],
  },
  {
    id: "sim-work-energy",
    kind: "simulation",
    title: "Work–energy connection",
    objective:
      "Apply W = Fd and relate net work to kinetic energy change.",
    prompt:
      "Simulation: You push a box with 20 N over 3 m along the force direction on a frictionless floor. Compute work done, state the energy form that increases, and explain what happens to KE if an equal opposite friction force cancels the push (net work).",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "physics",
    minChars: 48,
    conceptHints: [
      "work",
      "energy",
      "kinetic",
      "force",
      "joule",
      "net work",
    ],
    misconceptionTargets: [
      "thinking any force does positive work regardless of direction",
      "equating force with energy",
    ],
    successLooksLike:
      "W=60 J increases KE; with canceling friction net work≈0 so KE unchanged.",
    scaffolds: [
      hint(
        "Parallel force",
        "Work is force along the displacement — same direction here means positive W = Fd.",
      ),
      step(
        "Net work theorem",
        "Net work equals change in kinetic energy — opposing forces can cancel.",
      ),
      checklist(
        "Work checklist",
        "Work value · energy form · net-work case",
      ),
    ],
    criteria: [
      {
        id: "work",
        label: "Work",
        mustIncludeAny: ["60", "60 j", "60 joule"],
      },
      {
        id: "ke",
        label: "Energy form",
        mustIncludeAny: ["kinetic", "ke", "motion energy"],
      },
      {
        id: "net",
        label: "Net work / friction",
        mustIncludeAny: [
          "net work",
          "zero",
          "cancel",
          "no change",
          "unchanged",
          "friction",
        ],
      },
    ],
  },
  {
    id: "lab-momentum-collision",
    kind: "lab",
    title: "Momentum in a collision",
    objective:
      "Perform a 1D momentum check for a simple collision scenario.",
    prompt:
      "Lab: Cart A (2 kg) moves at 3 m/s right and sticks to cart B (2 kg) at rest (perfectly inelastic). Compute total momentum before, velocity after if momentum is conserved, and state whether KE is conserved in this sticking collision.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "physics",
    minChars: 50,
    conceptHints: [
      "momentum",
      "collision",
      "inelastic",
      "conservation",
      "mass",
      "velocity",
    ],
    misconceptionTargets: [
      "assuming kinetic energy is always conserved in sticking collisions",
      "forgetting total mass after they stick",
    ],
    successLooksLike:
      "p_before=6 kg·m/s, v_after=1.5 m/s, KE not conserved when they stick.",
    scaffolds: [
      hint(
        "p = mv",
        "Sum momentum before; after sticking use combined mass times shared velocity.",
      ),
      step(
        "Elastic vs sticky",
        "Momentum can conserve while kinetic energy drops in perfectly inelastic cases.",
      ),
      checklist(
        "Momentum checklist",
        "p before · v after · KE conserved?",
      ),
    ],
    criteria: [
      {
        id: "p-before",
        label: "Momentum before",
        mustIncludeAny: ["6", "6 kg", "2*3", "2 × 3"],
      },
      {
        id: "v-after",
        label: "Velocity after",
        mustIncludeAny: ["1.5", "3/2", "1.5 m/s"],
      },
      {
        id: "ke",
        label: "KE not conserved",
        mustIncludeAny: [
          "not conserved",
          "decreases",
          "lost",
          "inelastic",
          "no",
        ],
      },
    ],
  },
  {
    id: "sim-wave-frequency",
    kind: "simulation",
    title: "Wave speed, frequency, wavelength",
    objective:
      "Apply v = fλ to find a missing wave quantity.",
    prompt:
      "Simulation: A wave travels at 12 m/s with wavelength 3 m. Find frequency, show v=fλ rearrangement, and explain qualitatively what happens to frequency if wavelength halves while speed stays constant.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "physics",
    minChars: 42,
    conceptHints: [
      "wave",
      "frequency",
      "wavelength",
      "wave speed",
      "v=fλ",
      "oscillation",
    ],
    misconceptionTargets: [
      "confusing frequency with wave speed",
      "thinking wavelength and frequency rise together at fixed speed",
    ],
    successLooksLike:
      "f=4 Hz; if λ halves at fixed v then f doubles.",
    scaffolds: [
      hint(
        "Rearrange",
        "f = v / λ when speed and wavelength are known.",
      ),
      step(
        "Inverse link",
        "At constant speed, frequency and wavelength trade off inversely.",
      ),
      checklist(
        "Wave checklist",
        "Frequency · formula · half-λ effect",
      ),
    ],
    criteria: [
      {
        id: "freq",
        label: "Frequency",
        mustIncludeAny: ["4", "4 hz", "4Hz"],
      },
      {
        id: "formula",
        label: "Formula",
        mustIncludeAny: ["v = f", "f = v", "v/λ", "v/lambda", "fλ"],
      },
      {
        id: "half-lambda",
        label: "Half wavelength",
        mustIncludeAny: ["double", "twice", "8", "increases", "×2"],
      },
    ],
  },
  {
    id: "write-ohm-circuit-reason",
    kind: "writing",
    title: "Reason with Ohm's law",
    objective:
      "Explain how voltage, current, and resistance relate in a simple circuit.",
    prompt:
      "Writing: Using V = IR, explain what happens to current if resistance doubles at fixed voltage, what a larger battery voltage does at fixed R, and why a short (very small R) is dangerous in terms of current. Conceptual — no unsafe experiments.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "physics",
    minChars: 50,
    conceptHints: [
      "ohm",
      "voltage",
      "current",
      "resistance",
      "circuit",
      "v=ir",
    ],
    misconceptionTargets: [
      "thinking current is independent of resistance",
      "confusing voltage with current",
    ],
    successLooksLike:
      "I halves when R doubles; I rises with V; tiny R → large I hazard.",
    scaffolds: [
      hint(
        "Same equation, three stories",
        "Solve for I = V/R and narrate each change as a fraction.",
      ),
      step(
        "Safety angle",
        "Connect 'small R' to large current qualitatively — no need for extreme numbers.",
      ),
      checklist(
        "Ohm checklist",
        "R doubles · V increases · short/small-R risk",
      ),
    ],
    criteria: [
      {
        id: "r-double",
        label: "R doubles",
        mustIncludeAny: ["half", "halves", "decreases", "less current", "1/2"],
      },
      {
        id: "v-up",
        label: "Voltage up",
        mustIncludeAny: [
          "increases",
          "larger current",
          "more current",
          "rises",
          "proportional",
        ],
      },
      {
        id: "short",
        label: "Short / small R",
        mustIncludeAny: [
          "large current",
          "high current",
          "danger",
          "overheat",
          "hazard",
          "too much current",
        ],
      },
    ],
  },

  // —— Chemistry ——
  {
    id: "lab-atomic-shell-basics",
    kind: "lab",
    title: "Atomic shell basics",
    objective:
      "Perform a Bohr-model style electron shell count for a light atom.",
    prompt:
      "Lab: Neutral sodium has atomic number 11. State protons, electrons, a possible shell filling (2,8,1), and why the outer electron relates to reactivity compared with neon (full outer shell).",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "chemistry",
    minChars: 48,
    conceptHints: [
      "atomic number",
      "electron shell",
      "proton",
      "valence",
      "sodium",
      "neon",
    ],
    misconceptionTargets: [
      "equating atomic number with neutrons only",
      "ignoring valence electrons when discussing reactivity",
    ],
    successLooksLike:
      "11 p / 11 e; shells 2-8-1; Na reactive vs Ne stable full shell.",
    scaffolds: [
      hint(
        "Neutral atom",
        "Atomic number = protons; in a neutral atom, electrons match that count.",
      ),
      step(
        "Fill low shells first",
        "First shell holds 2, second 8 — leftover electrons go to the next shell.",
      ),
      checklist(
        "Atom checklist",
        "p and e · shell pattern · Na vs Ne reactivity",
      ),
    ],
    criteria: [
      {
        id: "counts",
        label: "Protons/electrons",
        mustIncludeAny: ["11", "eleven"],
      },
      {
        id: "shells",
        label: "Shell filling",
        mustIncludeAny: ["2,8,1", "2-8-1", "2 8 1", "valence 1"],
      },
      {
        id: "reactivity",
        label: "Reactivity contrast",
        mustIncludeAny: [
          "valence",
          "outer",
          "full shell",
          "stable",
          "reactive",
          "neon",
        ],
      },
    ],
  },
  {
    id: "sim-ionic-vs-covalent",
    kind: "simulation",
    title: "Ionic vs covalent bonding",
    objective:
      "Apply bonding type using electronegativity / electron transfer vs sharing.",
    prompt:
      "Simulation: Classify NaCl and O₂ as ionic or covalent, explain electron transfer vs sharing, and name one macroscopic property clue (melting point / conductivity in melt) that often differs between the types.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "chemistry",
    minChars: 48,
    conceptHints: [
      "ionic",
      "covalent",
      "bonding",
      "electron transfer",
      "sharing",
      "electronegativity",
    ],
    misconceptionTargets: [
      "calling all compounds ionic",
      "thinking covalent bonds never involve electronegativity differences",
    ],
    successLooksLike:
      "NaCl ionic (transfer), O₂ covalent (share), plus a property contrast.",
    scaffolds: [
      hint(
        "Metal + nonmetal cue",
        "Large electronegativity differences often favor ion formation; two nonmetals often share.",
      ),
      step(
        "Property clue",
        "Ionic solids often conduct when melted/dissolved; many covalent molecular substances do not.",
      ),
      checklist(
        "Bonding checklist",
        "NaCl type · O₂ type · property clue",
      ),
    ],
    criteria: [
      {
        id: "nacl",
        label: "NaCl",
        mustIncludeAny: ["ionic", "transfer"],
      },
      {
        id: "o2",
        label: "O₂",
        mustIncludeAny: ["covalent", "sharing", "share"],
      },
      {
        id: "property",
        label: "Property clue",
        mustIncludeAny: [
          "conduct",
          "melting",
          "melt",
          "dissolved",
          "brittle",
          "molecule",
        ],
      },
    ],
  },
  {
    id: "lab-balance-simple-reaction",
    kind: "lab",
    title: "Balance a simple reaction",
    objective:
      "Perform balancing of a simple chemical equation by atom inventory.",
    prompt:
      "Lab: Balance H₂ + O₂ → H₂O. Show atom counts before and after, state the coefficients you choose, and explain why changing subscripts (e.g. writing H₂O₂) would be chemically wrong here.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "chemistry",
    minChars: 45,
    conceptHints: [
      "balance",
      "coefficient",
      "reaction",
      "conservation of mass",
      "subscript",
      "h2o",
    ],
    misconceptionTargets: [
      "changing subscripts to balance",
      "thinking unbalanced equations still conserve atoms",
    ],
    successLooksLike:
      "2 H₂ + O₂ → 2 H₂O with counts matching; subscripts identify substances.",
    scaffolds: [
      hint(
        "Coefficients only",
        "Balance by coefficients in front — subscripts define the actual molecules.",
      ),
      step(
        "Inventory atoms",
        "Count H and O on each side; adjust H₂ and H₂O together, then check O₂.",
      ),
      checklist(
        "Balance checklist",
        "Coefficients · atom counts · subscript warning",
      ),
    ],
    criteria: [
      {
        id: "coefficients",
        label: "Coefficients",
        mustIncludeAny: ["2 h2", "2 H₂", "2h2", "2 h₂o", "2 H₂O"],
      },
      {
        id: "counts",
        label: "Atom counts",
        mustIncludeAny: ["4 h", "4 hydrogen", "2 o", "2 oxygen", "atoms"],
      },
      {
        id: "subscripts",
        label: "Don't change subscripts",
        mustIncludeAny: [
          "subscript",
          "different compound",
          "h2o2",
          "identity",
          "wrong substance",
        ],
      },
    ],
  },
  {
    id: "sim-ph-acid-base",
    kind: "simulation",
    title: "pH acid–base placement",
    objective:
      "Apply pH scale reasoning to classify solutions and relative [H⁺].",
    prompt:
      "Simulation: Solution A pH 2, Solution B pH 7, Solution C pH 11. Label acid/neutral/base, state which has the highest [H⁺], and explain what a jump of 2 pH units means for [H⁺] (factor of 100).",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "chemistry",
    minChars: 45,
    conceptHints: [
      "ph",
      "acid",
      "base",
      "neutral",
      "hydrogen ion",
      "logarithmic",
    ],
    misconceptionTargets: [
      "thinking higher pH means more H⁺",
      "treating pH as a linear rather than logarithmic scale",
    ],
    successLooksLike:
      "A acid, B neutral, C base; A highest [H⁺]; ΔpH 2 ⇒ ×100 [H⁺].",
    scaffolds: [
      hint(
        "Lower pH, more H⁺",
        "Acids sit below 7; each pH unit is a tenfold change in [H⁺].",
      ),
      step(
        "Label then compare",
        "Classify all three, then ask which label implies the largest [H⁺].",
      ),
      checklist(
        "pH checklist",
        "Labels · highest [H⁺] · two-unit factor",
      ),
    ],
    criteria: [
      {
        id: "labels",
        label: "Acid/neutral/base",
        mustIncludeAny: ["acid", "neutral", "base", "alkaline"],
      },
      {
        id: "highest-h",
        label: "Highest [H⁺]",
        mustIncludeAny: ["a", "ph 2", "solution a"],
      },
      {
        id: "log-factor",
        label: "Two pH units",
        mustIncludeAny: ["100", "tenfold", "10^2", "hundred", "logarithmic"],
      },
    ],
  },
  {
    id: "write-stoich-mole-bridge",
    kind: "writing",
    title: "Explain the mole bridge",
    objective:
      "Explain how moles connect mass and particles in stoichiometry.",
    prompt:
      "Writing: Explain why chemists use the mole as a bridge between grams and number of molecules, how molar mass fits in, and why balanced coefficients are mole ratios — not gram ratios — in a reaction.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "chemistry",
    minChars: 52,
    conceptHints: [
      "mole",
      "stoichiometry",
      "molar mass",
      "avogadro",
      "coefficient",
      "ratio",
    ],
    misconceptionTargets: [
      "using coefficient ratios directly on grams",
      "treating mole as a mass unit",
    ],
    successLooksLike:
      "Mole links mass↔particles via molar mass/Avogadro; coefficients are mole ratios.",
    scaffolds: [
      hint(
        "Count, don't weigh blindly",
        "Reactions happen particle-to-particle; moles let us count huge numbers via measurable grams.",
      ),
      step(
        "Two conversions",
        "grams ⇄ moles (molar mass), moles ⇄ particles (Avogadro), moles ⇄ moles (coefficients).",
      ),
      checklist(
        "Mole checklist",
        "Bridge idea · molar mass · coefficients as mole ratios",
      ),
    ],
    criteria: [
      {
        id: "bridge",
        label: "Mole bridge",
        mustIncludeAny: [
          "mole",
          "particles",
          "molecules",
          "avogadro",
          "count",
        ],
      },
      {
        id: "molar-mass",
        label: "Molar mass",
        mustIncludeAny: ["molar mass", "g/mol", "grams per mole", "convert mass"],
      },
      {
        id: "coefficients",
        label: "Coefficient ratios",
        mustIncludeAny: [
          "mole ratio",
          "moles not grams",
          "coefficient",
          "not gram ratio",
          "molar ratio",
        ],
      },
    ],
  },

  // —— Biology ——
  {
    id: "lab-cell-organelle-map",
    kind: "lab",
    title: "Map organelles to jobs",
    objective:
      "Perform matching of key organelles to their primary functions.",
    prompt:
      "Lab: Assign nucleus, mitochondria, ribosome, and cell membrane to their jobs (DNA control, ATP energy, protein synthesis, selective boundary). For each, write one evidence phrase you would expect in a microscope or function description.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "biology",
    minChars: 50,
    conceptHints: [
      "organelle",
      "nucleus",
      "mitochondria",
      "ribosome",
      "membrane",
      "cell",
    ],
    misconceptionTargets: [
      "assigning energy production to the nucleus",
      "thinking ribosomes store DNA",
    ],
    successLooksLike:
      "Correct function map for all four with brief evidence phrases.",
    scaffolds: [
      hint(
        "Job verbs",
        "Control/genetic · energy · build proteins · gatekeep traffic.",
      ),
      step(
        "One pair at a time",
        "Write organelle → function → tiny evidence before moving on.",
      ),
      checklist(
        "Organelle checklist",
        "Four pairs · evidence phrases",
      ),
    ],
    criteria: [
      {
        id: "nucleus",
        label: "Nucleus",
        mustIncludeAny: ["dna", "genetic", "control", "chromosome"],
      },
      {
        id: "mito",
        label: "Mitochondria",
        mustIncludeAny: ["atp", "energy", "respiration"],
      },
      {
        id: "ribo",
        label: "Ribosome",
        mustIncludeAny: ["protein", "synthes"],
      },
      {
        id: "membrane",
        label: "Membrane",
        mustIncludeAny: [
          "selective",
          "boundary",
          "barrier",
          "transport",
          "phospholipid",
        ],
      },
    ],
  },
  {
    id: "sim-dna-replication-steps",
    kind: "simulation",
    title: "Order DNA replication steps",
    objective:
      "Apply the sequence of major DNA replication events.",
    prompt:
      "Simulation: Put these in order and justify: helicase unwinds, primers laid down, DNA polymerase extends, ligase seals fragments. State why base pairing (A-T, C-G) makes the copies semi-conservative in spirit (each new duplex has an old strand).",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "biology",
    minChars: 52,
    conceptHints: [
      "dna replication",
      "helicase",
      "polymerase",
      "ligase",
      "base pairing",
      "semi-conservative",
    ],
    misconceptionTargets: [
      "polymerase unwinding the helix alone",
      "thinking both strands of a new duplex are brand new",
    ],
    successLooksLike:
      "Unwind → prime → extend → seal; semi-conservative via complementary templates.",
    scaffolds: [
      hint(
        "Open before copy",
        "The helix must unwind before polymerase can read templates.",
      ),
      step(
        "Fragments need glue",
        "Ligase comes after extension leaves nicks/fragments to seal.",
      ),
      checklist(
        "Replication checklist",
        "Ordered steps · base pairing · semi-conservative idea",
      ),
    ],
    criteria: [
      {
        id: "order",
        label: "Step order",
        mustIncludeAny: [
          "helicase",
          "primer",
          "polymerase",
          "ligase",
        ],
      },
      {
        id: "base-pair",
        label: "Base pairing",
        mustIncludeAny: ["a-t", "a–t", "c-g", "c–g", "complement"],
      },
      {
        id: "semi",
        label: "Semi-conservative",
        mustIncludeAny: [
          "semi-conservative",
          "old strand",
          "template",
          "one old one new",
          "parent strand",
        ],
      },
    ],
  },
  {
    id: "write-natural-selection-explain",
    kind: "writing",
    title: "Explain natural selection",
    objective:
      "Explain natural selection using variation, heredity, and differential survival.",
    prompt:
      "Writing: In your own words, explain how natural selection can increase a trait in a population over generations. Include variation, heritability, and uneven survival/reproduction. Give a short non-teleological example (no 'animals choose to evolve').",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "biology",
    minChars: 55,
    conceptHints: [
      "natural selection",
      "variation",
      "heritability",
      "fitness",
      "evolution",
      "population",
    ],
    misconceptionTargets: [
      "individuals evolving by trying",
      "thinking selection creates variation on demand",
    ],
    successLooksLike:
      "Variation + heritability + differential success → trait frequency change; example without intentionality.",
    scaffolds: [
      hint(
        "Populations change",
        "Selection sorts existing variation across generations — individuals don't opt in.",
      ),
      step(
        "Three necessary pieces",
        "Differences exist → they can be inherited → some leave more offspring.",
      ),
      checklist(
        "Selection checklist",
        "Variation · heredity · differential success · example",
      ),
    ],
    criteria: [
      {
        id: "variation",
        label: "Variation",
        mustIncludeAny: ["variation", "differ", "traits vary", "mutation"],
      },
      {
        id: "heredity",
        label: "Heredity",
        mustIncludeAny: ["herit", "inherit", "offspring", "genes", "passed on"],
      },
      {
        id: "differential",
        label: "Differential success",
        mustIncludeAny: [
          "survive",
          "reproduce",
          "fitness",
          "more offspring",
          "selected",
        ],
      },
    ],
  },
  {
    id: "sim-homeostasis-feedback-loop",
    kind: "simulation",
    title: "Homeostasis feedback loop",
    objective:
      "Apply negative feedback reasoning to a body-temperature scenario.",
    prompt:
      "Simulation: Body temperature rises above set point. Identify sensor/control/effector roles at a high level, describe a cooling response, and explain why this is negative feedback (reduces the deviation) rather than positive feedback.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "biology",
    minChars: 48,
    conceptHints: [
      "homeostasis",
      "negative feedback",
      "set point",
      "effector",
      "temperature",
      "thermoregulation",
    ],
    misconceptionTargets: [
      "calling all feedback positive",
      "thinking homeostasis means conditions never change at all",
    ],
    successLooksLike:
      "You name sensing/control/effectors (e.g. sweat), and define negative feedback as counteracting the rise.",
    scaffolds: [
      hint(
        "Oppose the change",
        "Negative feedback pushes the variable back toward the set point.",
      ),
      step(
        "Trace the loop",
        "Detect rise → decide → activate cooling effectors → temperature falls toward set point.",
      ),
      checklist(
        "Feedback checklist",
        "Roles · cooling response · negative vs positive",
      ),
    ],
    criteria: [
      {
        id: "roles",
        label: "Loop roles",
        mustIncludeAny: [
          "sensor",
          "receptor",
          "control",
          "brain",
          "effector",
          "set point",
        ],
      },
      {
        id: "cooling",
        label: "Cooling response",
        mustIncludeAny: [
          "sweat",
          "vasodil",
          "pant",
          "radiat",
          "cool",
        ],
      },
      {
        id: "negative",
        label: "Negative feedback",
        mustIncludeAny: [
          "negative",
          "reduces",
          "counteract",
          "toward set",
          "oppose",
        ],
      },
    ],
  },
  {
    id: "lab-ecology-food-web",
    kind: "lab",
    title: "Food-web energy links",
    objective:
      "Perform labeling of producers, consumers, and energy flow in a simple web.",
    prompt:
      "Lab: In a web with grass → grasshopper → frog → snake, label producer and each consumer level, draw/describe energy arrows (what they mean), and explain why energy available typically drops at higher trophic levels.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "biology",
    minChars: 48,
    conceptHints: [
      "food web",
      "producer",
      "consumer",
      "trophic",
      "energy flow",
      "ecology",
    ],
    misconceptionTargets: [
      "drawing arrows toward the organism being eaten",
      "assuming energy increases up the food chain",
    ],
    successLooksLike:
      "Grass producer; correct consumer levels; arrows show energy to consumer; loss via heat/metabolism.",
    scaffolds: [
      hint(
        "Arrow direction",
        "Arrows show where energy goes — from prey to predator / eaten to eater.",
      ),
      step(
        "Name levels",
        "Producer → primary → secondary → tertiary consumer.",
      ),
      checklist(
        "Food-web checklist",
        "Producer · consumer levels · arrow meaning · energy drop",
      ),
    ],
    criteria: [
      {
        id: "producer",
        label: "Producer",
        mustIncludeAny: ["grass", "producer"],
      },
      {
        id: "consumers",
        label: "Consumers",
        mustIncludeAny: [
          "grasshopper",
          "frog",
          "snake",
          "primary",
          "secondary",
          "tertiary",
        ],
      },
      {
        id: "energy-drop",
        label: "Energy drop",
        mustIncludeAny: [
          "heat",
          "metabolism",
          "10%",
          "lost",
          "less energy",
          "inefficient",
        ],
      },
    ],
  },

  // —— Earth / environment ——
  {
    id: "lab-water-cycle-stages",
    kind: "lab",
    title: "Trace water-cycle stages",
    objective:
      "Perform sequencing of evaporation, condensation, precipitation, and collection.",
    prompt:
      "Lab: Starting from ocean water on a warm day, order evaporation → condensation → precipitation → collection/runoff. For each stage, write one observable clue (e.g. clouds, rain) and state where energy from the Sun matters most.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "earth science",
    minChars: 50,
    conceptHints: [
      "water cycle",
      "evaporation",
      "condensation",
      "precipitation",
      "runoff",
      "sun energy",
    ],
    misconceptionTargets: [
      "thinking water is destroyed between stages",
      "skipping condensation before precipitation",
    ],
    successLooksLike:
      "Correct stage order with clues; Sun drives evaporation primarily.",
    scaffolds: [
      hint(
        "Phase changes",
        "Liquid → vapor (evap) → tiny droplets (condense) → fall (precip) → gather (collect).",
      ),
      step(
        "Sun's main job",
        "Solar energy powers evaporation and keeps the cycle moving.",
      ),
      checklist(
        "Cycle checklist",
        "Ordered stages · clues · Sun's role",
      ),
    ],
    criteria: [
      {
        id: "order",
        label: "Stage order",
        mustIncludeAny: [
          "evaporat",
          "condens",
          "precipitat",
          "collect",
          "runoff",
        ],
      },
      {
        id: "clues",
        label: "Observable clues",
        mustIncludeAny: ["cloud", "rain", "vapor", "humidity", "river", "ocean"],
      },
      {
        id: "sun",
        label: "Sun's role",
        mustIncludeAny: ["sun", "solar", "heat", "energy", "evaporat"],
      },
    ],
  },
  {
    id: "sim-climate-vs-weather",
    kind: "simulation",
    title: "Climate vs weather contrast",
    objective:
      "Apply the distinction between short-term weather and long-term climate.",
    prompt:
      "Simulation: Monday is unusually cold in a normally mild coastal city. Explain whether that single day revises the region's climate classification, what evidence would speak to climate, and give one sentence distinguishing weather vs climate.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "earth science",
    minChars: 45,
    conceptHints: [
      "climate",
      "weather",
      "long-term",
      "average",
      "atmosphere",
      "trend",
    ],
    misconceptionTargets: [
      "using one cold day to deny a climate pattern",
      "equating climate with today's forecast",
    ],
    successLooksLike:
      "One day = weather; climate needs long-term averages/patterns; clear distinction sentence.",
    scaffolds: [
      hint(
        "Timescale",
        "Weather is hours–days; climate is decades of typical patterns.",
      ),
      step(
        "Ask for averages",
        "What would 30-year temperature/precipitation normals say versus Monday's reading?",
      ),
      checklist(
        "Climate checklist",
        "Single-day judgment · climate evidence · distinction sentence",
      ),
    ],
    criteria: [
      {
        id: "not-climate",
        label: "Single day ≠ climate rewrite",
        mustIncludeAny: [
          "weather",
          "not climate",
          "single day",
          "does not change climate",
          "one day",
        ],
      },
      {
        id: "evidence",
        label: "Climate evidence",
        mustIncludeAny: [
          "long-term",
          "average",
          "decades",
          "normals",
          "pattern",
          "30-year",
        ],
      },
      {
        id: "distinction",
        label: "Distinction",
        mustIncludeAny: [
          "weather",
          "climate",
          "short",
          "long",
          "forecast",
          "typical",
        ],
      },
    ],
  },
  {
    id: "write-sustainability-tradeoff",
    kind: "writing",
    title: "Explain a sustainability tradeoff",
    objective:
      "Explain an environmental sustainability tradeoff with costs, benefits, and a stakeholder.",
    prompt:
      "Writing: Choose one tradeoff (e.g. expanding a city park vs new housing, or hydropower vs river habitat). Explain the sustainability goal, who benefits, who may bear costs, and one metric you would monitor. Keep it balanced — not a slogan.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "earth science",
    minChars: 55,
    conceptHints: [
      "sustainability",
      "tradeoff",
      "environment",
      "stakeholder",
      "resource",
      "impact",
    ],
    misconceptionTargets: [
      "claiming zero-cost solutions with no tradeoffs",
      "ignoring who bears environmental or social costs",
    ],
    successLooksLike:
      "Clear goal, benefit side, cost side, and a monitorable metric.",
    scaffolds: [
      hint(
        "Both sides",
        "Name at least one real benefit and one real cost — sustainability is negotiation, not magic.",
      ),
      step(
        "Pick a metric",
        "Examples: habitat area, emissions, housing units, water quality index.",
      ),
      checklist(
        "Tradeoff checklist",
        "Goal · beneficiaries · costs · metric",
      ),
    ],
    criteria: [
      {
        id: "goal",
        label: "Sustainability goal",
        mustIncludeAny: [
          "sustain",
          "environment",
          "habitat",
          "resource",
          "emission",
          "conservation",
        ],
      },
      {
        id: "stakeholders",
        label: "Stakeholders / costs",
        mustIncludeAny: [
          "benefit",
          "cost",
          "resident",
          "wildlife",
          "community",
          "tradeoff",
          "stakeholder",
        ],
      },
      {
        id: "metric",
        label: "Metric",
        mustIncludeAny: [
          "metric",
          "measure",
          "monitor",
          "indicator",
          "index",
          "units",
        ],
      },
    ],
  },
];
