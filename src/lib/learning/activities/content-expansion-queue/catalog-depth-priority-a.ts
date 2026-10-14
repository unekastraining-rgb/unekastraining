/**
 * Content depth Priority A — career-domain structured challenges.
 * Staging catalog only; not a subject engine. Educational scenarios only.
 */

import type { StructuredChallenge } from "@/lib/learning/activities/structured/service";
import { hint, step, checklist } from "./helpers";

export const CONTENT_DEPTH_PRIORITY_A_CHALLENGES: StructuredChallenge[] = [
  // —— Healthcare administration ——
  {
    id: "write-hc-admin-roles-explain",
    kind: "writing",
    title: "Admin roles vs clinical roles",
    objective:
      "Explain how healthcare administration roles differ from clinical care roles in a clinic setting.",
    prompt:
      "Explain (educational): In a busy outpatient clinic, contrast what an office manager / front-desk admin typically owns versus what a nurse or clinician owns. Name one admin task, one clinical task, and why mixing those lanes can create risk for patients or privacy.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "healthcare administration",
    minChars: 50,
    conceptHints: [
      "healthcare administration",
      "admin roles",
      "clinical roles",
      "scope",
      "front desk",
    ],
    misconceptionTargets: [
      "assuming front-desk staff can interpret lab results because they 'see the chart all day'",
      "treating scheduling and triage as the same skill set",
    ],
    successLooksLike:
      "Separates admin operations (schedule, registration, billing handoff) from clinical judgment, and names a risk when roles blur.",
    scaffolds: [
      hint(
        "Two lanes",
        "Admin work moves information and access; clinical work judges symptoms and treatment.",
      ),
      step(
        "One example each",
        "Pick a concrete admin task and a concrete clinical task before you contrast them.",
      ),
      checklist(
        "Roles checklist",
        "Admin task · clinical task · blur/risk note",
      ),
    ],
    criteria: [
      {
        id: "admin",
        label: "Admin role",
        mustIncludeAny: [
          "schedule",
          "registration",
          "billing",
          "front desk",
          "insurance",
          "records",
          "admin",
        ],
      },
      {
        id: "clinical",
        label: "Clinical role",
        mustIncludeAny: [
          "nurse",
          "clinician",
          "doctor",
          "provider",
          "diagnose",
          "treat",
          "exam",
          "clinical",
        ],
      },
      {
        id: "risk",
        label: "Blur / risk",
        mustIncludeAny: [
          "privacy",
          "scope",
          "risk",
          "unsafe",
          "wrong person",
          "liability",
          "mix",
        ],
      },
    ],
  },
  {
    id: "sim-hc-admin-schedule-conflict",
    kind: "simulation",
    title: "Double-booked appointment conflict",
    objective:
      "Resolve a double-booked appointment conflict without abandoning either patient unfairly.",
    prompt:
      "Challenge: Two patients are booked for Dr. Rivera at 10:00 — one new patient (60 min) and one follow-up (20 min). The provider is already running 15 minutes late. Name the conflict, propose a fair resolution path (who waits / who reschedules / who gets a same-day alternate), and one communication line for each patient. Educational operations practice only.",
    learningObjectType: "SIMULATION",
    skillFacet: "SOLVE",
    asPerform: false,
    domainTag: "healthcare administration",
    minChars: 52,
    conceptHints: [
      "scheduling",
      "double book",
      "appointment",
      "conflict",
      "healthcare administration",
    ],
    misconceptionTargets: [
      "silently deleting one appointment without notifying the patient",
      "assuming the shorter visit can always be stacked into the new-patient slot",
    ],
    successLooksLike:
      "Names the double-book/time conflict, offers a concrete rebooking or wait plan, and scripts patient-facing communication.",
    scaffolds: [
      hint(
        "Conflict type",
        "This is a capacity conflict: one provider, two overlapping claims on the same block.",
      ),
      step(
        "Protect both experiences",
        "Decide who keeps the slot, who is offered the next opening, and what each person hears.",
      ),
      checklist(
        "Conflict checklist",
        "Conflict named · resolution · message to each patient",
      ),
    ],
    criteria: [
      {
        id: "conflict",
        label: "Conflict named",
        mustIncludeAny: [
          "double",
          "conflict",
          "overlap",
          "same time",
          "booked",
          "two patients",
        ],
      },
      {
        id: "resolution",
        label: "Resolution",
        mustIncludeAny: [
          "reschedule",
          "rebook",
          "wait",
          "alternate",
          "later",
          "next slot",
          "offer",
        ],
      },
      {
        id: "comm",
        label: "Patient communication",
        mustIncludeAny: [
          "call",
          "tell",
          "explain",
          "apolog",
          "notify",
          "message",
          "inform",
        ],
      },
    ],
  },
  {
    id: "lab-hc-admin-intake-checklist",
    kind: "lab",
    title: "Patient intake checklist",
    objective:
      "Perform an educational front-desk intake sequence for a new outpatient visit.",
    prompt:
      "Lab (educational): A new patient arrives 10 minutes early for a first visit. Build a short intake checklist covering identity verification, demographics/insurance capture, consent/privacy forms, and reason-for-visit notes for clinical staff — without diagnosing. List the sequence in order.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "healthcare administration",
    minChars: 50,
    conceptHints: [
      "intake",
      "registration",
      "insurance",
      "consent",
      "healthcare administration",
    ],
    misconceptionTargets: [
      "skipping identity check because the patient 'looks familiar from the waiting room'",
      "writing a clinical diagnosis in the admin reason-for-visit field",
    ],
    successLooksLike:
      "Orders ID check → demographics/insurance → forms/consent → non-diagnostic reason-for-visit handoff.",
    scaffolds: [
      hint(
        "Admin boundary",
        "Capture what the patient reports; leave diagnosis to clinical staff.",
      ),
      step(
        "Start with identity",
        "Confirm who is standing at the desk before you open or create a chart.",
      ),
      checklist(
        "Intake checklist",
        "ID · demographics/insurance · consent/privacy · reason-for-visit note",
      ),
    ],
    criteria: [
      {
        id: "identity",
        label: "Identity",
        mustIncludeAny: ["id", "identity", "verify", "name", "photo", "dob"],
      },
      {
        id: "insurance",
        label: "Demographics / insurance",
        mustIncludeAny: [
          "insurance",
          "demographic",
          "address",
          "coverage",
          "card",
          "contact",
        ],
      },
      {
        id: "forms",
        label: "Consent / privacy forms",
        mustIncludeAny: [
          "consent",
          "privacy",
          "hipaa",
          "form",
          "signature",
          "notice",
        ],
      },
      {
        id: "reason",
        label: "Reason for visit",
        mustIncludeAny: [
          "reason",
          "chief",
          "complaint",
          "symptom",
          "visit",
          "handoff",
        ],
      },
    ],
  },
  {
    id: "sim-hc-admin-records-request",
    kind: "simulation",
    title: "Records release request",
    objective:
      "Apply a privacy-aware educational workflow for a patient records release request.",
    prompt:
      "Apply (educational, not legal advice): A patient asks the front desk for a copy of their visit notes to share with a specialist. Outline verification of identity, what authorization/release step you would collect, and one privacy safeguard before handing over or transmitting records. Do not invent statutes — stay operational.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "healthcare administration",
    minChars: 52,
    conceptHints: [
      "records release",
      "authorization",
      "privacy",
      "phi",
      "healthcare administration",
    ],
    misconceptionTargets: [
      "emailing charts to any address the caller spells without verifying identity",
      "assuming a spouse can pick up records without documented authorization",
    ],
    successLooksLike:
      "Verifies requester identity, collects a release/authorization step, and names a privacy safeguard before release.",
    scaffolds: [
      hint(
        "Who is asking?",
        "Confirm the person is authorized before you locate or copy anything.",
      ),
      step(
        "Paper trail",
        "Educational practice usually includes a signed or documented release preference.",
      ),
      checklist(
        "Release checklist",
        "Verify identity · authorization · privacy safeguard",
      ),
    ],
    criteria: [
      {
        id: "verify",
        label: "Identity verification",
        mustIncludeAny: [
          "verify",
          "identity",
          "id",
          "confirm",
          "patient",
          "authenticate",
        ],
      },
      {
        id: "auth",
        label: "Authorization / release",
        mustIncludeAny: [
          "authoriz",
          "release",
          "consent",
          "form",
          "sign",
          "permission",
        ],
      },
      {
        id: "privacy",
        label: "Privacy safeguard",
        mustIncludeAny: [
          "privacy",
          "secure",
          "encrypt",
          "portal",
          "pickup",
          "fax",
          "minimum",
          "phi",
        ],
      },
    ],
  },
  {
    id: "write-hc-admin-insurance-basics",
    kind: "writing",
    title: "Deductible vs copay",
    objective:
      "Explain deductible versus copay in plain educational language for front-desk conversations.",
    prompt:
      "Explain (educational finance literacy for clinic admin — not advice): A patient asks why they still owe money after showing an insurance card. Define deductible and copay in your own words, and give one sentence on how each can appear at check-in or checkout.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "healthcare administration",
    minChars: 50,
    conceptHints: [
      "deductible",
      "copay",
      "insurance",
      "patient billing",
      "healthcare administration",
    ],
    misconceptionTargets: [
      "treating the insurance card as proof that the visit costs $0",
      "using deductible and copay as interchangeable words",
    ],
    successLooksLike:
      "Defines deductible as amount before plan shares more costs, copay as a fixed share at service, and ties each to a billing moment.",
    scaffolds: [
      hint(
        "Two cost shares",
        "One is often an annual threshold; the other is often a fixed amount per visit/service.",
      ),
      step(
        "Patient moment",
        "Mention when each might show up at registration or after the visit.",
      ),
      checklist(
        "Insurance basics",
        "Deductible definition · copay definition · when each appears",
      ),
    ],
    criteria: [
      {
        id: "deductible",
        label: "Deductible",
        mustIncludeAny: [
          "deductible",
          "before insurance",
          "out of pocket",
          "threshold",
          "annual",
        ],
      },
      {
        id: "copay",
        label: "Copay",
        mustIncludeAny: ["copay", "co-pay", "fixed", "flat", "per visit"],
      },
      {
        id: "timing",
        label: "When it appears",
        mustIncludeAny: [
          "check-in",
          "checkout",
          "billing",
          "owe",
          "collect",
          "visit",
        ],
      },
    ],
  },
  {
    id: "sim-hc-admin-outpatient-transfer",
    kind: "simulation",
    title: "Outpatient specialty scheduling bottleneck",
    objective:
      "Transfer scheduling judgment to an outpatient specialty clinic bottleneck (not a hospital ED).",
    prompt:
      "Transfer surface: A dermatology clinic has one provider and a three-week backlog. Two same-week cancelations open Tuesday morning. You also have a referral for a rapidly worsening rash marked 'urgent by PCP' and three routine annual skin checks waiting. Prioritize who gets the opened slots, what you tell the routine patients, and one bottleneck fix to propose to the office manager. Educational operations only — not clinical advice.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "healthcare administration",
    minChars: 55,
    conceptHints: [
      "outpatient",
      "specialty clinic",
      "scheduling",
      "backlog",
      "prioritization",
      "healthcare administration",
    ],
    misconceptionTargets: [
      "filling open slots with whoever called first while ignoring the urgent referral",
      "treating specialty outpatient triage like hospital ED bed assignment",
    ],
    successLooksLike:
      "Prioritizes the urgent referral into an open slot, communicates wait/options to routine patients, and proposes a bottleneck improvement.",
    scaffolds: [
      hint(
        "Transfer cue",
        "Same scheduling skills as primary care — different site: specialty outpatient, not inpatient floors.",
      ),
      step(
        "Urgency vs routine",
        "Separate time-sensitive referrals from annual maintenance visits before assigning slots.",
      ),
      checklist(
        "Bottleneck checklist",
        "Priority patient · routine messaging · process fix idea",
      ),
    ],
    criteria: [
      {
        id: "urgent",
        label: "Urgent priority",
        mustIncludeAny: [
          "urgent",
          "referral",
          "rash",
          "worsening",
          "priority",
          "first",
        ],
      },
      {
        id: "routine",
        label: "Routine patient messaging",
        mustIncludeAny: [
          "routine",
          "wait",
          "reschedule",
          "next",
          "annual",
          "tell",
          "offer",
        ],
      },
      {
        id: "fix",
        label: "Bottleneck fix",
        mustIncludeAny: [
          "template",
          "block",
          "hold",
          "triage",
          "extend",
          "add",
          "process",
          "backlog",
        ],
      },
    ],
  },

  // —— Construction ——
  {
    id: "write-construction-safety-hierarchy",
    kind: "writing",
    title: "Hierarchy of controls",
    objective:
      "Explain the hierarchy of controls for a worksite hazard in educational safety language.",
    prompt:
      "Explain (educational safety — follow local codes): Dust from cutting concrete is affecting nearby workers. Order the hierarchy of controls from most to least preferred (elimination/substitution, engineering, administrative, PPE) and give one concrete example at two different levels for this dust hazard.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "construction",
    minChars: 52,
    conceptHints: [
      "hierarchy of controls",
      "ppe",
      "engineering controls",
      "construction safety",
      "dust",
    ],
    misconceptionTargets: [
      "starting with PPE as the primary solution instead of higher controls",
      "treating a toolbox talk as equal to removing the hazard source",
    ],
    successLooksLike:
      "Orders controls most→least preferred and gives concrete examples at two levels for silica/dust.",
    scaffolds: [
      hint(
        "Preference order",
        "Remove or change the hazard before relying on rules or respirators alone.",
      ),
      step(
        "Two levels",
        "Example: wet methods/extraction vs scheduling/signage vs respirator — pick two levels to illustrate.",
      ),
      checklist(
        "Hierarchy checklist",
        "Order stated · example A · example B",
      ),
    ],
    criteria: [
      {
        id: "order",
        label: "Hierarchy order",
        mustIncludeAny: [
          "eliminat",
          "substitut",
          "engineering",
          "administrative",
          "ppe",
          "hierarchy",
        ],
      },
      {
        id: "higher",
        label: "Higher control example",
        mustIncludeAny: [
          "wet",
          "extract",
          "vacuum",
          "ventilat",
          "substitut",
          "eliminat",
          "enclosure",
        ],
      },
      {
        id: "lower",
        label: "Admin or PPE example",
        mustIncludeAny: [
          "respirator",
          "mask",
          "ppe",
          "training",
          "schedule",
          "signage",
          "limit time",
        ],
      },
    ],
  },
  {
    id: "lab-construction-measure-scale",
    kind: "lab",
    title: "Scale measurement from plan",
    objective:
      "Perform a scale conversion from a plan dimension using 1/4\" = 1'-0\".",
    prompt:
      "Lab: A floor plan is drawn at 1/4\" = 1'-0\". A corridor measures 3 inches on the printed plan. Convert to real length in feet, show the scale reasoning (how many feet per inch), and state one check you would do before cutting material from that number.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "construction",
    minChars: 48,
    conceptHints: [
      "scale",
      "blueprint",
      "measurement",
      "1/4 inch",
      "construction",
    ],
    misconceptionTargets: [
      "reading the printed inches as real-world inches without applying scale",
      "using 1\" = 1'-0\" when the title block says 1/4\" = 1'-0\"",
    ],
    successLooksLike:
      "Converts 3\" at 1/4\"=1'-0\" to 12 feet, explains feet-per-inch, and names a verification check.",
    scaffolds: [
      hint(
        "Scale meaning",
        "At 1/4\" = 1'-0\", each inch on paper equals four feet in the building.",
      ),
      step(
        "Multiply carefully",
        "Find feet per plan-inch, then multiply by the measured plan length.",
      ),
      checklist(
        "Scale checklist",
        "Scale stated · converted length · field/plan check",
      ),
    ],
    criteria: [
      {
        id: "scale",
        label: "Scale used",
        mustIncludeAny: ["1/4", "quarter", "4 feet", "four feet", "scale"],
      },
      {
        id: "length",
        label: "Converted length",
        mustIncludeAny: ["12", "twelve", "12'"],
      },
      {
        id: "check",
        label: "Verification check",
        mustIncludeAny: [
          "verify",
          "check",
          "title block",
          "field",
          "measure",
          "confirm",
          "dimension",
        ],
      },
    ],
  },
  {
    id: "sim-construction-sequence-pour",
    kind: "simulation",
    title: "Concrete pour sequencing",
    objective:
      "Solve a wrong-order concrete pour sequence before forms are filled.",
    prompt:
      "Solve: A crew is about to pour a slab. Someone proposes: finish grade → pour concrete → place vapor barrier → set forms → compact subgrade. Identify what is out of order, rewrite a safer educational sequence, and name one defect risk if the vapor barrier or forms are late.",
    learningObjectType: "SIMULATION",
    skillFacet: "SOLVE",
    asPerform: false,
    domainTag: "construction",
    minChars: 52,
    conceptHints: [
      "concrete pour",
      "sequencing",
      "forms",
      "vapor barrier",
      "construction",
    ],
    misconceptionTargets: [
      "pouring before forms and barrier are set because the truck is already on site",
      "treating subgrade compaction as optional cosmetic work",
    ],
    successLooksLike:
      "Flags the inverted order, restores compact → forms → barrier → pour logic, and names a moisture/edge defect risk.",
    scaffolds: [
      hint(
        "Contain first",
        "Concrete needs a prepared base and contained edges before it arrives.",
      ),
      step(
        "Barrier timing",
        "Vapor barriers usually go down before the pour — not after the slab exists.",
      ),
      checklist(
        "Pour sequence",
        "Wrong step named · corrected order · defect risk",
      ),
    ],
    criteria: [
      {
        id: "wrong",
        label: "Wrong order identified",
        mustIncludeAny: [
          "out of order",
          "wrong",
          "before",
          "after",
          "too late",
          "sequence",
        ],
      },
      {
        id: "order",
        label: "Corrected sequence",
        mustIncludeAny: [
          "compact",
          "subgrade",
          "form",
          "vapor",
          "barrier",
          "pour",
        ],
      },
      {
        id: "risk",
        label: "Defect risk",
        mustIncludeAny: [
          "moisture",
          "crack",
          "edge",
          "blowout",
          "defect",
          "void",
          "uneven",
        ],
      },
    ],
  },
  {
    id: "lab-construction-estimate-materials",
    kind: "lab",
    title: "Rough material estimate",
    objective:
      "Perform a rough educational material estimate from simple dimensions.",
    prompt:
      "Lab: Estimate paint for one rectangular interior wall 12 ft wide by 8 ft high. Assume one coat covers about 350 sq ft per gallon. Show area, gallons needed (round up to a practical purchase), and one waste/extra factor you would add for cut-ins or touch-up. Educational estimate only.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "construction",
    minChars: 48,
    conceptHints: [
      "estimate",
      "area",
      "materials",
      "coverage",
      "construction",
    ],
    misconceptionTargets: [
      "ordering exact theoretical gallons with zero waste allowance",
      "multiplying length × coverage instead of computing wall area first",
    ],
    successLooksLike:
      "Computes 96 sq ft, converts to under one gallon of coverage need, rounds up practically, and names a waste factor.",
    scaffolds: [
      hint(
        "Area first",
        "Width × height gives square feet before you divide by coverage.",
      ),
      step(
        "Round for the store",
        "Coverage math is a start — purchases usually round up to whole containers.",
      ),
      checklist(
        "Estimate checklist",
        "Area · gallons · waste/extra note",
      ),
    ],
    criteria: [
      {
        id: "area",
        label: "Area",
        mustIncludeAny: ["96", "square", "sq ft", "area", "12", "8"],
      },
      {
        id: "gallons",
        label: "Gallons",
        mustIncludeAny: ["gallon", "1", "one", "350", "coverage"],
      },
      {
        id: "waste",
        label: "Waste / extra",
        mustIncludeAny: [
          "waste",
          "extra",
          "touch-up",
          "cut-in",
          "overage",
          "spare",
          "10%",
        ],
      },
    ],
  },
  {
    id: "sim-construction-qc-defect",
    kind: "simulation",
    title: "QC defect before cover-up",
    objective:
      "Apply quality-control judgment to spot a defect before it is covered.",
    prompt:
      "Apply: Before hanging drywall, you notice a framing bay with a bowed stud and a missing fire-blocking piece where the drawings call for it. Name the defects, explain why covering now is costly, and state the corrective action before close-in.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "construction",
    minChars: 50,
    conceptHints: [
      "quality control",
      "framing",
      "defect",
      "fire blocking",
      "construction",
    ],
    misconceptionTargets: [
      "covering defects because punch-list can 'catch it later'",
      "assuming a bowed stud will straighten once drywall is screwed on",
    ],
    successLooksLike:
      "Names bow and missing fire block, explains rework/code risk of covering, and requires correction before drywall.",
    scaffolds: [
      hint(
        "Open wall advantage",
        "Defects are cheapest to fix when the cavity is still visible.",
      ),
      step(
        "Two issues",
        "Address geometry (bow) and required blocking separately in your note.",
      ),
      checklist(
        "QC checklist",
        "Defects named · why not cover · corrective action",
      ),
    ],
    criteria: [
      {
        id: "defects",
        label: "Defects named",
        mustIncludeAny: [
          "bow",
          "stud",
          "fire",
          "block",
          "missing",
          "framing",
        ],
      },
      {
        id: "cost",
        label: "Cover-up cost / risk",
        mustIncludeAny: [
          "rework",
          "tear out",
          "costly",
          "code",
          "inspect",
          "hidden",
          "later",
        ],
      },
      {
        id: "fix",
        label: "Corrective action",
        mustIncludeAny: [
          "replace",
          "sister",
          "install",
          "fix",
          "before",
          "straighten",
          "add block",
        ],
      },
    ],
  },
  {
    id: "write-construction-blueprint-symbols-retain",
    kind: "writing",
    title: "Blueprint symbols retrieval",
    objective:
      "Retain and retrieve common blueprint symbols without looking at a legend.",
    prompt:
      "Retain: Without opening a legend, recall what these usually mean on architectural plans: a dashed line for a hidden or overhead item, a rectangle with a swing arc for a door, and 'WC' or similar for a restroom. Write the symbol → meaning for each in your own words.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "RETAIN",
    asPerform: false,
    domainTag: "construction",
    minChars: 45,
    conceptHints: [
      "blueprint symbols",
      "door swing",
      "dashed line",
      "legend",
      "construction",
    ],
    misconceptionTargets: [
      "assuming every dashed line means demolition regardless of discipline",
      "reading door swings as windows because both are wall openings",
    ],
    successLooksLike:
      "Maps dashed/hidden, door swing, and WC/restroom symbols to meanings from memory.",
    scaffolds: [
      hint(
        "Retrieval only",
        "Answer from memory — legends exist so crews do not guess on site.",
      ),
      checklist(
        "Symbol recall",
        "Dashed/hidden · door swing · WC/restroom",
      ),
    ],
    criteria: [
      {
        id: "dashed",
        label: "Dashed / hidden",
        mustIncludeAny: [
          "hidden",
          "overhead",
          "above",
          "dashed",
          "beyond",
          "invisible",
        ],
      },
      {
        id: "door",
        label: "Door symbol",
        mustIncludeAny: ["door", "swing", "arc", "hinge"],
      },
      {
        id: "wc",
        label: "Restroom symbol",
        mustIncludeAny: ["restroom", "bathroom", "toilet", "wc", "lavatory"],
      },
    ],
  },

  // —— Education ——
  {
    id: "sim-education-choose-strategy",
    kind: "simulation",
    title: "Strategy for mixed readiness",
    objective:
      "Apply an instructional strategy choice for a class with mixed readiness.",
    prompt:
      "Apply: Period 3 is learning multi-step word problems. Four students race ahead, most are on-level, and three still struggle with single-step setup. Choose one primary instructional strategy (e.g., small-group rotation, worked-example fading, peer tutoring), justify why it fits mixed readiness, and name one pitfall to avoid.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "education",
    minChars: 52,
    conceptHints: [
      "instructional strategy",
      "differentiation",
      "mixed readiness",
      "teaching",
      "education",
    ],
    misconceptionTargets: [
      "teaching only to the middle and calling advanced students 'fine on their own' with no plan",
      "assuming one whole-class lecture pace serves every readiness band equally",
    ],
    successLooksLike:
      "Names a concrete strategy, ties it to mixed readiness bands, and flags a pitfall.",
    scaffolds: [
      hint(
        "Match strategy to spread",
        "Mixed readiness needs a structure that can run more than one support level at once.",
      ),
      step(
        "Name the pitfall",
        "Busywork for advanced students or public tracking that shames struggling students are common traps.",
      ),
      checklist(
        "Strategy checklist",
        "Strategy named · readiness fit · pitfall",
      ),
    ],
    criteria: [
      {
        id: "strategy",
        label: "Strategy",
        mustIncludeAny: [
          "group",
          "rotation",
          "tutoring",
          "worked example",
          "station",
          "scaffold",
          "tier",
          "differentiate",
        ],
      },
      {
        id: "fit",
        label: "Mixed readiness fit",
        mustIncludeAny: [
          "ready",
          "advanced",
          "struggle",
          "mixed",
          "level",
          "pace",
          "support",
        ],
      },
      {
        id: "pitfall",
        label: "Pitfall",
        mustIncludeAny: [
          "avoid",
          "pitfall",
          "busywork",
          "shame",
          "track",
          "ignore",
          "label",
        ],
      },
    ],
  },
  {
    id: "write-education-smart-objective",
    kind: "writing",
    title: "Rewrite vague objective",
    objective:
      "Rewrite a vague lesson objective into a measurable student-learning statement.",
    prompt:
      "Practice/explain: Rewrite 'Students will understand fractions' into a measurable objective. Include an observable verb, the content focus, and how you would know they met it (product or performance). Keep it educational planning practice.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "education",
    minChars: 48,
    conceptHints: [
      "learning objective",
      "measurable",
      "observable verb",
      "assessment",
      "education",
    ],
    misconceptionTargets: [
      "keeping 'understand' or 'know' as the only verb",
      "writing a teacher activity ('I will teach fractions') instead of student learning",
    ],
    successLooksLike:
      "Uses an observable verb, specifies fraction skill, and states evidence of mastery.",
    scaffolds: [
      hint(
        "Swap the verb",
        "Prefer verbs you can see or score: explain, represent, solve, compare.",
      ),
      step(
        "Add the evidence",
        "Finish with what students produce or demonstrate that proves the objective.",
      ),
      checklist(
        "Objective checklist",
        "Observable verb · content focus · success evidence",
      ),
    ],
    criteria: [
      {
        id: "verb",
        label: "Observable verb",
        mustIncludeAny: [
          "explain",
          "solve",
          "represent",
          "compare",
          "create",
          "demonstrate",
          "identify",
          "write",
        ],
      },
      {
        id: "content",
        label: "Content focus",
        mustIncludeAny: ["fraction", "numerator", "denominator", "equivalent"],
      },
      {
        id: "evidence",
        label: "Evidence of success",
        mustIncludeAny: [
          "quiz",
          "problem",
          "model",
          "exit",
          "show",
          "accurac",
          "rubric",
          "example",
        ],
      },
    ],
  },
  {
    id: "sim-education-differentiate-task",
    kind: "simulation",
    title: "Differentiate one objective three ways",
    objective:
      "Apply three differentiated paths that still target the same learning objective.",
    prompt:
      "Apply: Objective — students will explain cause and effect in a short nonfiction passage. Design three versions of the same task for (1) students needing support, (2) on-level, and (3) extension — without changing the objective. Name what stays constant and what changes.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "education",
    minChars: 55,
    conceptHints: [
      "differentiation",
      "scaffolding",
      "extension",
      "same objective",
      "education",
    ],
    misconceptionTargets: [
      "giving struggling students a different, easier objective instead of scaffolds",
      "equating differentiation with more worksheets of the same difficulty",
    ],
    successLooksLike:
      "Keeps cause-effect explanation constant and varies support, complexity, or product across three bands.",
    scaffolds: [
      hint(
        "Same destination",
        "Differentiation changes the path and supports — not the learning target.",
      ),
      step(
        "Vary one dimension",
        "Change scaffold, text complexity, or response format while keeping cause→effect.",
      ),
      checklist(
        "Differentiate checklist",
        "Support version · on-level · extension · what stayed constant",
      ),
    ],
    criteria: [
      {
        id: "support",
        label: "Support path",
        mustIncludeAny: [
          "support",
          "scaffold",
          "sentence starter",
          "graphic",
          "guided",
          "prompt",
        ],
      },
      {
        id: "onlevel",
        label: "On-level path",
        mustIncludeAny: ["on-level", "grade", "independent", "passage", "explain"],
      },
      {
        id: "extension",
        label: "Extension path",
        mustIncludeAny: [
          "extension",
          "advanced",
          "compare",
          "challenge",
          "deeper",
          "another text",
        ],
      },
      {
        id: "constant",
        label: "Constant objective",
        mustIncludeAny: [
          "same objective",
          "cause",
          "effect",
          "constant",
          "still explain",
        ],
      },
    ],
  },
  {
    id: "lab-education-feedback-rewrite",
    kind: "lab",
    title: "Rewrite unhelpful feedback",
    objective:
      "Perform a rewrite of vague feedback into specific, actionable teacher feedback.",
    prompt:
      "Lab: A student essay received only 'Needs work — be clearer.' Rewrite the feedback so it (1) names a specific strength, (2) points to one concrete revision target (claim, evidence, or organization), and (3) tells the student what to try next. Keep tone respectful.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "education",
    minChars: 50,
    conceptHints: [
      "feedback",
      "formative",
      "revision",
      "specific",
      "education",
    ],
    misconceptionTargets: [
      "replacing vagueness with praise-only comments that still give no revision target",
      "using harsh labels ('lazy writing') instead of naming a craft move",
    ],
    successLooksLike:
      "Includes a strength, one specific craft target, and a next action the student can try.",
    scaffolds: [
      hint(
        "Feedback formula",
        "Strength → one precise gap → actionable next step.",
      ),
      step(
        "Point to the text",
        "Refer to claim, evidence, or paragraph structure — not personality.",
      ),
      checklist(
        "Feedback checklist",
        "Strength · specific target · next try",
      ),
    ],
    criteria: [
      {
        id: "strength",
        label: "Strength",
        mustIncludeAny: [
          "strength",
          "strong",
          "effective",
          "clear",
          "good",
          "worked",
        ],
      },
      {
        id: "target",
        label: "Specific target",
        mustIncludeAny: [
          "claim",
          "evidence",
          "organiz",
          "thesis",
          "paragraph",
          "example",
          "unclear",
        ],
      },
      {
        id: "next",
        label: "Next action",
        mustIncludeAny: [
          "next",
          "try",
          "revise",
          "add",
          "rewrite",
          "explain",
          "connect",
        ],
      },
    ],
  },
  {
    id: "sim-education-assessment-align",
    kind: "simulation",
    title: "Activity–objective mismatch",
    objective:
      "Solve a mismatch between a classroom activity and its stated learning objective.",
    prompt:
      "Challenge: Objective says students will compare two authors' arguments. The planned activity is a vocabulary crossword on literary terms, graded for completion. Diagnose the misalignment, propose a replacement task that assesses comparison, and name what evidence would show the objective was met.",
    learningObjectType: "SIMULATION",
    skillFacet: "SOLVE",
    asPerform: false,
    domainTag: "education",
    minChars: 52,
    conceptHints: [
      "alignment",
      "assessment",
      "objective",
      "compare arguments",
      "education",
    ],
    misconceptionTargets: [
      "assuming any language-arts activity counts as assessing the stated objective",
      "keeping the crossword and only changing the points weight",
    ],
    successLooksLike:
      "Names the compare-vs-crossword mismatch, proposes a comparison task, and defines success evidence.",
    scaffolds: [
      hint(
        "Match the verb",
        "If the objective says compare, the task must require comparison — not only term recall.",
      ),
      step(
        "Design the evidence",
        "Ask what product would prove students can compare two arguments.",
      ),
      checklist(
        "Alignment checklist",
        "Mismatch named · replacement task · success evidence",
      ),
    ],
    criteria: [
      {
        id: "mismatch",
        label: "Mismatch diagnosed",
        mustIncludeAny: [
          "mismatch",
          "not align",
          "crossword",
          "vocabulary",
          "does not",
          "instead of",
        ],
      },
      {
        id: "task",
        label: "Replacement task",
        mustIncludeAny: [
          "compare",
          "contrast",
          "argument",
          "essay",
          "graphic",
          "discussion",
          "side by side",
        ],
      },
      {
        id: "evidence",
        label: "Success evidence",
        mustIncludeAny: [
          "evidence",
          "rubric",
          "both authors",
          "similarity",
          "difference",
          "claim",
        ],
      },
    ],
  },
  {
    id: "write-education-lesson-plan-retain",
    kind: "writing",
    title: "Lesson plan parts retrieval",
    objective:
      "Retain and retrieve key parts of a lesson plan from memory.",
    prompt:
      "Retain: Without looking at a template, list and briefly define four core lesson-plan parts you would expect (for example: objective, materials, instructional sequence, check for understanding/assessment). One sentence each.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "RETAIN",
    asPerform: false,
    domainTag: "education",
    minChars: 48,
    conceptHints: [
      "lesson plan",
      "objective",
      "assessment",
      "instructional sequence",
      "education",
    ],
    misconceptionTargets: [
      "listing only materials and decorations with no learning objective or check for understanding",
      "confusing a daily agenda slide with a complete lesson plan",
    ],
    successLooksLike:
      "Recalls objective, materials/resources, teaching sequence, and assessment/CFU with brief definitions.",
    scaffolds: [
      hint(
        "Plan skeleton",
        "Where are we going, with what, how will we teach it, and how will we know?",
      ),
      checklist(
        "Lesson plan recall",
        "Objective · materials · sequence · assessment/CFU",
      ),
    ],
    criteria: [
      {
        id: "objective",
        label: "Objective",
        mustIncludeAny: ["objective", "goal", "learning target", "students will"],
      },
      {
        id: "materials",
        label: "Materials",
        mustIncludeAny: ["material", "resource", "handout", "text", "supply"],
      },
      {
        id: "sequence",
        label: "Instructional sequence",
        mustIncludeAny: [
          "sequence",
          "procedure",
          "activities",
          "steps",
          "instruction",
          "lesson flow",
        ],
      },
      {
        id: "assess",
        label: "Assessment / CFU",
        mustIncludeAny: [
          "assess",
          "check for understanding",
          "exit",
          "formative",
          "quiz",
          "evidence",
        ],
      },
    ],
  },

  // —— Hospitality ——
  {
    id: "write-hospitality-service-standards",
    kind: "writing",
    title: "Standards vs upselling pressure",
    objective:
      "Explain how service standards differ from aggressive upselling pressure.",
    prompt:
      "Explain: A new server is told to 'hit add-on targets' while the brand promise is warm, unhurried hospitality. Contrast service standards (guest experience quality) with upselling pressure, and describe one way to offer an add-on without violating standards.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "hospitality",
    minChars: 50,
    conceptHints: [
      "service standards",
      "upselling",
      "guest experience",
      "hospitality",
      "brand promise",
    ],
    misconceptionTargets: [
      "treating every guest interaction as a quota hit regardless of comfort",
      "assuming standards mean never mentioning products or specials",
    ],
    successLooksLike:
      "Defines standards as guest-centered quality, separates quota pressure, and shows a consent-based offer.",
    scaffolds: [
      hint(
        "Guest first",
        "Standards protect how the guest feels; upsells are optional offers inside that frame.",
      ),
      step(
        "Offer, don't push",
        "Describe an invitational phrase that accepts 'no' cleanly.",
      ),
      checklist(
        "Standards checklist",
        "Standards defined · pressure contrast · respectful offer",
      ),
    ],
    criteria: [
      {
        id: "standards",
        label: "Service standards",
        mustIncludeAny: [
          "standard",
          "guest",
          "experience",
          "quality",
          "hospitality",
          "brand",
        ],
      },
      {
        id: "upsell",
        label: "Upselling pressure",
        mustIncludeAny: [
          "upsell",
          "quota",
          "target",
          "pressure",
          "add-on",
          "push",
        ],
      },
      {
        id: "offer",
        label: "Respectful offer",
        mustIncludeAny: [
          "offer",
          "ask",
          "optional",
          "if you'd like",
          "no pressure",
          "suggest",
        ],
      },
    ],
  },
  {
    id: "sim-hospitality-reservation-overbook",
    kind: "simulation",
    title: "Overbooking walk scenario",
    objective:
      "Solve an educational overbooking / walk scenario while protecting guest dignity.",
    prompt:
      "Challenge (educational ops): The hotel is overbooked. A confirmed guest arrives and no rooms remain. Outline acknowledge → options (walk to partner property / delay / upgrade path if one frees) → compensation mindset → documentation. Stay professional; this is training, not a real policy manual.",
    learningObjectType: "SIMULATION",
    skillFacet: "SOLVE",
    asPerform: false,
    domainTag: "hospitality",
    minChars: 52,
    conceptHints: [
      "overbooking",
      "walk",
      "reservation",
      "guest recovery",
      "hospitality",
    ],
    misconceptionTargets: [
      "blaming the guest for arriving at peak check-in time",
      "hiding the overbook and hoping they leave without options",
    ],
    successLooksLike:
      "Acknowledges the confirmed reservation failure, offers concrete alternatives, and notes compensation/documentation.",
    scaffolds: [
      hint(
        "Own the miss",
        "The property failed a confirmation — lead with accountability, not excuses.",
      ),
      step(
        "Options first",
        "Guests need choices: alternate hotel, wait list, transport, or tangible make-good.",
      ),
      checklist(
        "Walk checklist",
        "Acknowledge · options · compensation mindset · document",
      ),
    ],
    criteria: [
      {
        id: "ack",
        label: "Acknowledge",
        mustIncludeAny: [
          "acknowledge",
          "sorry",
          "apolog",
          "confirmed",
          "overbook",
          "no room",
        ],
      },
      {
        id: "options",
        label: "Options",
        mustIncludeAny: [
          "walk",
          "partner",
          "alternate",
          "another hotel",
          "wait",
          "transport",
          "upgrade",
        ],
      },
      {
        id: "make-good",
        label: "Compensation / documentation",
        mustIncludeAny: [
          "comp",
          "voucher",
          "discount",
          "document",
          "note",
          "follow-up",
          "compensation",
        ],
      },
    ],
  },
  {
    id: "lab-hospitality-front-desk-checkin",
    kind: "lab",
    title: "Front-desk check-in sequence",
    objective:
      "Perform an educational front-desk check-in sequence checklist.",
    prompt:
      "Lab: Walk through a standard check-in sequence for a leisure guest with a prepaid reservation: greet/verify identity, confirm reservation details and nights, collect/verify payment method if needed, issue key and Wi-Fi info, and set expectations (breakfast, parking, requests). List the steps in order.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "hospitality",
    minChars: 50,
    conceptHints: [
      "check-in",
      "front desk",
      "reservation",
      "guest service",
      "hospitality",
    ],
    misconceptionTargets: [
      "handing keys before verifying the guest matches the reservation",
      "skipping expectations (parking/breakfast) and creating avoidable callbacks",
    ],
    successLooksLike:
      "Orders greet/verify → reservation confirm → payment as needed → keys/info → expectations.",
    scaffolds: [
      hint(
        "Verify before keys",
        "Identity and reservation match come before room access.",
      ),
      step(
        "Close the loop",
        "End with location basics so the guest is not hunting for breakfast or parking.",
      ),
      checklist(
        "Check-in checklist",
        "Greet/verify · confirm stay · payment · keys/Wi-Fi · expectations",
      ),
    ],
    criteria: [
      {
        id: "verify",
        label: "Greet / verify",
        mustIncludeAny: ["greet", "verify", "id", "identity", "name", "welcome"],
      },
      {
        id: "reservation",
        label: "Reservation confirm",
        mustIncludeAny: [
          "reservation",
          "nights",
          "dates",
          "room type",
          "confirm",
          "prepaid",
        ],
      },
      {
        id: "keys",
        label: "Keys / info",
        mustIncludeAny: ["key", "wifi", "wi-fi", "room number", "access"],
      },
      {
        id: "expect",
        label: "Expectations",
        mustIncludeAny: [
          "breakfast",
          "parking",
          "request",
          "expect",
          "hours",
          "amenit",
        ],
      },
    ],
  },
  {
    id: "sim-hospitality-inventory-par",
    kind: "simulation",
    title: "F&B par stock and 86'd item",
    objective:
      "Apply par-stock judgment when a menu item is 86'd mid-service.",
    prompt:
      "Apply: Dinner service — the kitchen 86's the salmon special with 90 minutes left. Current walk-in count is below par for a backup protein. Decide what you tell servers, one guest-facing substitution approach, and one inventory action before tomorrow's order (par vs actual). Educational F&B ops only.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "hospitality",
    minChars: 50,
    conceptHints: [
      "par stock",
      "86",
      "inventory",
      "F&B",
      "hospitality",
    ],
    misconceptionTargets: [
      "letting servers keep selling an 86'd item until tickets bounce",
      "ignoring par levels until the next stockout repeats",
    ],
    successLooksLike:
      "Updates floor staff, offers a guest substitution path, and ties reorder to par vs actual.",
    scaffolds: [
      hint(
        "86 means stop",
        "Once 86'd, selling paths must change immediately on the floor.",
      ),
      step(
        "Par thinking",
        "Compare what you should have on hand (par) to what you actually counted.",
      ),
      checklist(
        "86 checklist",
        "Server message · guest substitution · par/reorder action",
      ),
    ],
    criteria: [
      {
        id: "floor",
        label: "Server communication",
        mustIncludeAny: [
          "86",
          "tell servers",
          "stop selling",
          "update",
          "floor",
          "menu",
        ],
      },
      {
        id: "guest",
        label: "Guest substitution",
        mustIncludeAny: [
          "substitut",
          "offer",
          "alternative",
          "another",
          "recommend",
          "guest",
        ],
      },
      {
        id: "par",
        label: "Par / inventory action",
        mustIncludeAny: [
          "par",
          "reorder",
          "inventory",
          "count",
          "order",
          "stock",
          "actual",
        ],
      },
    ],
  },
  {
    id: "sim-hospitality-channel-choose",
    kind: "simulation",
    title: "Choose guest communication channel",
    objective:
      "Apply channel choice for a guest issue based on urgency and privacy.",
    prompt:
      "Apply: Three guest issues hit at once — (A) noisy neighbors at 1 a.m., (B) a billing question about an incidental hold, (C) a compliment about housekeeper service. Choose the best channel for each (in-person/phone/app message/email) and justify with urgency and sensitivity. Educational guest-comms practice.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "hospitality",
    minChars: 52,
    conceptHints: [
      "communication channel",
      "guest issue",
      "urgency",
      "privacy",
      "hospitality",
    ],
    misconceptionTargets: [
      "emailing an overnight noise complaint that needs immediate response",
      "discussing billing details loudly at a crowded front desk",
    ],
    successLooksLike:
      "Matches noise to immediate voice/in-person response, billing to private channel, compliment to async note — with brief justifications.",
    scaffolds: [
      hint(
        "Urgency filter",
        "Safety/comfort right now → synchronous; paperwork → private or async.",
      ),
      step(
        "Privacy for money",
        "Billing details deserve a channel that is not a lobby performance.",
      ),
      checklist(
        "Channel checklist",
        "Noise channel · billing channel · compliment channel",
      ),
    ],
    criteria: [
      {
        id: "noise",
        label: "Noise channel",
        mustIncludeAny: [
          "phone",
          "call",
          "in-person",
          "visit",
          "immediate",
          "night",
        ],
      },
      {
        id: "billing",
        label: "Billing channel",
        mustIncludeAny: [
          "private",
          "phone",
          "email",
          "desk",
          "secure",
          "billing",
          "hold",
        ],
      },
      {
        id: "compliment",
        label: "Compliment channel",
        mustIncludeAny: [
          "email",
          "app",
          "message",
          "note",
          "pass along",
          "async",
          "log",
        ],
      },
    ],
  },
  {
    id: "write-hospitality-recovery-retain",
    kind: "writing",
    title: "Service recovery sequence recall",
    objective:
      "Retain and retrieve a service-recovery sequence from memory.",
    prompt:
      "Retain: Without rereading a prior complaint scenario, retrieve a service-recovery sequence in order (acknowledge → apologize → fix/offer → follow-up). Write one short phrase for each step as you would coach a new associate.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "RETAIN",
    asPerform: false,
    domainTag: "hospitality",
    minChars: 45,
    conceptHints: [
      "service recovery",
      "acknowledge",
      "apologize",
      "follow-up",
      "hospitality",
    ],
    misconceptionTargets: [
      "jumping to discounts before acknowledging the guest's experience",
      "skipping follow-up after a make-good is offered",
    ],
    successLooksLike:
      "Recalls acknowledge, apologize, fix/offer, and follow-up in sequence with coachable phrases.",
    scaffolds: [
      hint(
        "Four beats",
        "Hear it → own it → solve it → confirm it landed.",
      ),
      checklist(
        "Recovery recall",
        "Acknowledge · apologize · fix/offer · follow-up",
      ),
    ],
    criteria: [
      {
        id: "ack",
        label: "Acknowledge",
        mustIncludeAny: ["acknowledge", "hear", "understand", "listen"],
      },
      {
        id: "apologize",
        label: "Apologize",
        mustIncludeAny: ["apolog", "sorry", "regret"],
      },
      {
        id: "fix",
        label: "Fix / offer",
        mustIncludeAny: [
          "fix",
          "offer",
          "comp",
          "solve",
          "replace",
          "make-good",
          "solution",
        ],
      },
      {
        id: "follow",
        label: "Follow-up",
        mustIncludeAny: [
          "follow",
          "check back",
          "confirm",
          "later",
          "satisfied",
        ],
      },
    ],
  },

  // —— Finance (educational only; not investment advice) ——
  {
    id: "lab-finance-budget-50-30-20",
    kind: "lab",
    title: "50/30/20 budget allocation",
    objective:
      "Perform an educational budget allocation into needs, wants, and savings.",
    prompt:
      "Lab (fake-money OK, not personal advice): Monthly take-home is $3,000. Using a 50/30/20 educational frame, allocate dollars to needs, wants, and savings/debt payoff. List one example expense in each bucket and show the three dollar amounts.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "finance",
    minChars: 48,
    conceptHints: [
      "budget",
      "50/30/20",
      "needs",
      "wants",
      "savings",
      "finance",
    ],
    misconceptionTargets: [
      "putting discretionary streaming in needs because it 'feels necessary'",
      "skipping the savings bucket when income feels tight in a practice problem",
    ],
    successLooksLike:
      "Allocates $1,500 / $900 / $600 (or clear 50/30/20 math) with one example per bucket.",
    scaffolds: [
      hint(
        "Percent map",
        "50% needs, 30% wants, 20% savings/debt payoff on take-home pay.",
      ),
      step(
        "Example each",
        "Needs = rent/food essentials; wants = fun; savings = future buffer or debt payoff practice.",
      ),
      checklist(
        "Budget checklist",
        "Needs $ · wants $ · savings $ · example each",
      ),
    ],
    criteria: [
      {
        id: "needs",
        label: "Needs allocation",
        mustIncludeAny: ["1500", "1,500", "50%", "needs", "rent", "grocer"],
      },
      {
        id: "wants",
        label: "Wants allocation",
        mustIncludeAny: ["900", "30%", "wants", "entertainment", "fun", "dining"],
      },
      {
        id: "savings",
        label: "Savings allocation",
        mustIncludeAny: [
          "600",
          "20%",
          "saving",
          "debt",
          "emergency",
          "payoff",
        ],
      },
    ],
  },
  {
    id: "write-finance-interest-simple-vs-compound",
    kind: "writing",
    title: "Simple vs compound interest",
    objective:
      "Explain simple interest versus compound interest in educational terms.",
    prompt:
      "Explain (educational only, not advice): Using a fake $1,000 example, contrast simple interest (interest on principal only) with compound interest (interest on principal plus accumulated interest). State which grows faster over many periods when rates and time match, and why.",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "finance",
    minChars: 50,
    conceptHints: [
      "simple interest",
      "compound interest",
      "principal",
      "finance education",
    ],
    misconceptionTargets: [
      "thinking simple and compound always produce the same total at the same rate",
      "confusing compounding with a guaranteed investment return",
    ],
    successLooksLike:
      "Defines both, notes compound grows on prior interest, and states compound grows faster over repeated periods.",
    scaffolds: [
      hint(
        "On what base?",
        "Ask whether each period's interest is calculated only on the original principal.",
      ),
      step(
        "Time matters",
        "Compare the same rate and principal across multiple periods in your explanation.",
      ),
      checklist(
        "Interest checklist",
        "Simple defined · compound defined · which grows faster + why",
      ),
    ],
    criteria: [
      {
        id: "simple",
        label: "Simple interest",
        mustIncludeAny: [
          "simple",
          "principal only",
          "original",
          "not on interest",
        ],
      },
      {
        id: "compound",
        label: "Compound interest",
        mustIncludeAny: [
          "compound",
          "interest on interest",
          "accumulated",
          "prior interest",
          "grows on",
        ],
      },
      {
        id: "faster",
        label: "Growth comparison",
        mustIncludeAny: [
          "faster",
          "more",
          "greater",
          "grows quicker",
          "compound grows",
        ],
      },
    ],
  },
  {
    id: "sim-finance-credit-utilization",
    kind: "simulation",
    title: "Credit utilization scenario",
    objective:
      "Apply educational reasoning about credit utilization in a fake-card scenario.",
    prompt:
      "Apply (educational, not credit advice): A practice card has a $2,000 limit. Balance is $1,600 (80% utilization). The learner can pay $1,200 before the statement closes or buy $400 more gear. Explain what utilization means, which choice lowers utilization more, and one reason lenders may care about high utilization — educational framing only.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "finance",
    minChars: 52,
    conceptHints: [
      "credit utilization",
      "credit limit",
      "balance",
      "finance education",
    ],
    misconceptionTargets: [
      "assuming paying after the statement never affects reported utilization",
      "thinking maxing a card looks identical to using a small share of the limit",
    ],
    successLooksLike:
      "Defines balance÷limit utilization, chooses the large payment path, and names a risk/score or capacity signal.",
    scaffolds: [
      hint(
        "Utilization math",
        "Utilization is roughly balance divided by credit limit.",
      ),
      step(
        "Compare choices",
        "Paying down balance lowers the ratio; adding purchases raises it.",
      ),
      checklist(
        "Utilization checklist",
        "Definition · better choice · why it matters educationally",
      ),
    ],
    criteria: [
      {
        id: "define",
        label: "Utilization defined",
        mustIncludeAny: [
          "utilization",
          "balance",
          "limit",
          "percent",
          "ratio",
          "80%",
        ],
      },
      {
        id: "choice",
        label: "Lowering choice",
        mustIncludeAny: [
          "pay",
          "1200",
          "1,200",
          "payment",
          "reduce",
          "lower",
          "not buy",
        ],
      },
      {
        id: "why",
        label: "Why it matters",
        mustIncludeAny: [
          "score",
          "risk",
          "lender",
          "capacity",
          "credit",
          "high utilization",
        ],
      },
    ],
  },
  {
    id: "lab-finance-loan-payment-intuition",
    kind: "lab",
    title: "Which loan costs more interest",
    objective:
      "Perform an educational comparison of two loan scenarios by interest cost intuition.",
    prompt:
      "Lab (fake numbers, not lending advice): Compare two educational loans of $5,000. Loan A: 6% APR for 2 years. Loan B: 10% APR for 1 year. Without needing a full amortization table, reason which is likely to cost more in total interest and why (rate vs time). State one extra factor (fees/payment size) you would still check.",
    learningObjectType: "LAB",
    skillFacet: "PERFORM",
    asPerform: true,
    domainTag: "finance",
    minChars: 50,
    conceptHints: [
      "loan interest",
      "APR",
      "term length",
      "finance education",
      "comparison",
    ],
    misconceptionTargets: [
      "assuming the shorter loan always costs less interest regardless of rate",
      "comparing only monthly payment size and ignoring total interest",
    ],
    successLooksLike:
      "Weighs higher rate vs longer term, picks a reasoned higher-interest candidate, and names fees or payment structure as a check.",
    scaffolds: [
      hint(
        "Two levers",
        "Interest cost depends on rate and how long the balance hangs around.",
      ),
      step(
        "Rough compare",
        "Higher APR for less time can still beat or lose to lower APR for longer — explain your call.",
      ),
      checklist(
        "Loan compare checklist",
        "Chosen higher-interest case · rate/time reason · extra factor",
      ),
    ],
    criteria: [
      {
        id: "compare",
        label: "Comparison stated",
        mustIncludeAny: [
          "loan a",
          "loan b",
          "6%",
          "10%",
          "higher",
          "more interest",
          "costs more",
        ],
      },
      {
        id: "reason",
        label: "Rate vs time reason",
        mustIncludeAny: [
          "rate",
          "apr",
          "term",
          "year",
          "longer",
          "shorter",
          "time",
        ],
      },
      {
        id: "extra",
        label: "Extra factor",
        mustIncludeAny: [
          "fee",
          "payment",
          "monthly",
          "origination",
          "amortiz",
          "schedule",
        ],
      },
    ],
  },
  {
    id: "write-finance-cashflow-vs-profit",
    kind: "writing",
    title: "Cash flow vs profit",
    objective:
      "Explain why cash flow and profit are not the same concept.",
    prompt:
      "Explain (educational small-business literacy — not advice): A shop shows a profit on paper this month but cannot pay suppliers on Friday. Explain profit vs cash flow in plain language and give one reason profit can look fine while cash is tight (e.g., receivables, inventory, timing).",
    learningObjectType: "WRITING_EXERCISE",
    skillFacet: "EXPLAIN",
    asPerform: false,
    domainTag: "finance",
    minChars: 50,
    conceptHints: [
      "cash flow",
      "profit",
      "receivables",
      "timing",
      "finance education",
    ],
    misconceptionTargets: [
      "equating a profitable month with having cash in the register",
      "thinking cash in the bank is the same as accounting profit",
    ],
    successLooksLike:
      "Defines profit as revenue minus expenses on paper and cash flow as money in/out timing, with a receivables or inventory example.",
    scaffolds: [
      hint(
        "Paper vs wallet",
        "Profit is an accounting result; cash flow is whether money is available when bills hit.",
      ),
      step(
        "Timing example",
        "Sales on credit can count as revenue before cash arrives.",
      ),
      checklist(
        "Cash vs profit",
        "Profit defined · cash flow defined · timing example",
      ),
    ],
    criteria: [
      {
        id: "profit",
        label: "Profit",
        mustIncludeAny: [
          "profit",
          "revenue",
          "expense",
          "income",
          "on paper",
          "accounting",
        ],
      },
      {
        id: "cash",
        label: "Cash flow",
        mustIncludeAny: [
          "cash flow",
          "cash",
          "money in",
          "money out",
          "pay",
          "liquidity",
        ],
      },
      {
        id: "timing",
        label: "Timing gap",
        mustIncludeAny: [
          "receivable",
          "inventory",
          "timing",
          "credit",
          "later",
          "supplier",
          "invoice",
        ],
      },
    ],
  },
  {
    id: "sim-finance-emergency-fund-transfer",
    kind: "simulation",
    title: "Emergency fund for gig work",
    objective:
      "Transfer emergency-fund thinking to a gig-worker cash buffer (not market tickers).",
    prompt:
      "Transfer (educational, not advice): A delivery gig worker's weekly pay swings between $280 and $620. Rent is due monthly. Explain why an emergency / buffer fund matters in this income pattern, suggest a practice savings target idea (e.g., weeks of essential costs), and name one non-investment place the buffer might sit in a beginner educational example.",
    learningObjectType: "SIMULATION",
    skillFacet: "APPLY",
    asPerform: false,
    domainTag: "finance",
    minChars: 52,
    conceptHints: [
      "emergency fund",
      "gig work",
      "income volatility",
      "buffer",
      "finance education",
    ],
    misconceptionTargets: [
      "treating volatile gig income like a fixed salary with no buffer need",
      "pointing beginners first to speculative market tickers instead of a cash buffer concept",
    ],
    successLooksLike:
      "Links swingy gig pay to buffer need, names a weeks-of-expenses style target, and keeps the store of value educational/cash-like.",
    scaffolds: [
      hint(
        "Transfer surface",
        "Same buffer idea as salaried emergency funds — different income pattern (gigs, not tickers).",
      ),
      step(
        "Size in essentials",
        "Think in weeks/months of rent and must-pay costs, not market forecasts.",
      ),
      checklist(
        "Gig buffer checklist",
        "Why buffer · target idea · where it sits (educational)",
      ),
    ],
    criteria: [
      {
        id: "why",
        label: "Why buffer",
        mustIncludeAny: [
          "swing",
          "volatil",
          "variable",
          "unstable",
          "gig",
          "low week",
          "rent",
        ],
      },
      {
        id: "target",
        label: "Target idea",
        mustIncludeAny: [
          "week",
          "month",
          "essential",
          "rent",
          "buffer",
          "emergency",
          "saving",
        ],
      },
      {
        id: "place",
        label: "Where it sits",
        mustIncludeAny: [
          "savings account",
          "checking",
          "cash",
          "bank",
          "deposit",
          "not invest",
        ],
      },
    ],
  },
];
