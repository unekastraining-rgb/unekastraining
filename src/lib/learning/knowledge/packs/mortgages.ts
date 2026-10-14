/**
 * Instructional pack: mortgages (Learn Something New — no syllabus required).
 */

import type { InstructionalKnowledgePack } from "@/lib/learning/knowledge/instructional-library";
import { registerInstructionalPack } from "@/lib/learning/knowledge/instructional-library";

export const MORTGAGES_PACK: InstructionalKnowledgePack = {
  id: "business-mortgages",
  match: [
    "how do mortgages work",
    "mortgage",
    "mortgages",
    "home loan",
    "amortization",
  ],
  domain: "business",
  subject: "finance",
  displayTitle: "How mortgages work",
  learningFrame:
    "You're learning how mortgages work — why people borrow for homes → principal & interest → amortization → payment tradeoffs → common pitfalls.",
  cheatSheet:
    "NEED (home cost) → LOAN (principal) → INTEREST → AMORTIZATION (pay down over time) → PAYMENT SIZE ↔ TERM ↔ RATE → equity builds",
  concepts: [
    {
      id: "why-mortgage",
      title: "Why mortgages exist",
      role: "context",
      explanation:
        "Most people cannot pay cash for a home. A mortgage is a loan secured by the property: the lender provides money now; the borrower repays over years with interest. If the borrower stops paying, the lender can take the home (foreclosure). That collateral is why mortgage rates differ from unsecured debt.",
      example:
        "A $400,000 home with 20% down means borrowing $320,000 — the mortgage principal — and paying it back monthly for 15 or 30 years.",
      checkPrompt: "What makes a mortgage “secured”?",
    },
    {
      id: "principal-interest",
      title: "Principal and interest",
      role: "concept",
      explanation:
        "Principal is the amount you still owe. Interest is the cost of borrowing that amount. Early in a fixed-rate loan, more of each payment goes to interest; later, more goes to principal. That split changes over the life of the loan.",
      example:
        "Payment = interest portion + principal portion. Interest portion ≈ rate × remaining principal (for the period).",
      misconception:
        "Your whole payment does not immediately shrink the balance by the full payment amount — interest takes a cut first.",
      checkPrompt: "If principal falls, what happens to the interest portion of a fixed payment?",
    },
    {
      id: "amortization",
      title: "Amortization — paying it down",
      role: "explain",
      explanation:
        "Amortization is the schedule that pays the loan to zero over the term with level payments (typical fixed-rate mortgage). Each month: compute interest on the remaining balance, subtract that from the payment, apply the rest to principal, repeat.",
      representation:
        "Balance₀\n→ pay: interest₁ + principal₁\n→ Balance₁ = Balance₀ − principal₁\n→ … → Balanceₙ ≈ 0",
      example:
        "Same monthly payment every month; the mix of interest vs principal shifts toward principal as the balance shrinks.",
      breakdown:
        "1) Start with principal\n2) Accrue interest for the period\n3) Apply payment\n4) New lower principal",
    },
    {
      id: "rate-term-tradeoff",
      title: "Rate, term, and payment tradeoffs",
      role: "worked",
      explanation:
        "Higher rate → higher payment (or longer to pay off). Longer term (30 vs 15) → lower monthly payment but more total interest. Extra principal payments shorten the schedule and cut total interest.",
      example:
        "Compare: $320k at 6% for 30 years vs 15 years — monthly payment differs a lot; total interest differs even more.",
      checkPrompt: "Name one benefit and one cost of choosing a longer term.",
    },
    {
      id: "pitfalls",
      title: "Common misconceptions",
      role: "clarify",
      explanation:
        "People confuse the home’s price with the loan amount (ignoring down payment), assume early payments mostly build equity (they often do not), or ignore taxes/insurance escrowed with the payment (PITI).",
      misconception:
        "“I’m paying $2,000/month so my equity rises $2,000/month” — usually false early on.",
      example: "PITI = Principal + Interest + Taxes + Insurance (when escrowed).",
    },
    {
      id: "apply-mortgage",
      title: "Apply — choose a scenario",
      role: "apply",
      explanation:
        "Pick a price, down payment, rate, and term. State the principal. Explain qualitatively whether lengthening the term lowers the payment and raises total interest.",
      example: "Price $350k, 10% down, 6.5%, 30-year — what is principal? What happens if term becomes 15 years?",
      practiceForms: ["calculation", "scenario", "decision"],
      assessmentForms: ["quiz", "scenario", "calculation"],
      checkPrompt: "What single change would reduce total interest the most, all else equal?",
    },
  ],
};

registerInstructionalPack(MORTGAGES_PACK);
