import { redirect } from "next/navigation";

/**
 * 2P-21 — Conceptual alias for Learner Growth Center.
 * Canonical product route remains /study/learner-model (one progress page).
 */
export default function LearnerGrowthAliasPage() {
  redirect("/study/learner-model");
}
