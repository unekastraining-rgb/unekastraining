import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildPerformEvidenceEnvelope,
  isPerformSkillFacet,
  performProductBridgeStatus,
} from "./perform-evidence-contract";

describe("PERFORM evidence contract (2P-45 EVIDENCE-CLOSED)", () => {
  it("builds PERFORM envelope with objective fields", () => {
    const result = buildPerformEvidenceEnvelope({
      learnerId: "u1",
      learningObjectId: "lo1",
      conceptId: "c1",
      outcome: "SUCCESS",
      score: 0.9,
      sourceRef: { kind: "coding_challenge_submit", id: "p1" },
      evidencePayload: { criterion: "opaque" },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.envelope.skillFacet).toBe("PERFORM");
    expect(result.envelope.conceptId).toBe("c1");
    expect(isPerformSkillFacet(result.envelope.skillFacet)).toBe(true);
  });

  it("rejects self-confidence as PERFORM criterion", () => {
    const result = buildPerformEvidenceEnvelope({
      learnerId: "u1",
      learningObjectId: "lo1",
      conceptId: "c1",
      outcome: "SUCCESS",
      sourceRef: { kind: "self", id: "x" },
      usedSelfConfidenceAsCriterion: true,
    });
    expect(result.ok).toBe(false);
  });

  it("status: EVIDENCE-CLOSED producers — no PERFORM_GAP", () => {
    const s = performProductBridgeStatus();
    expect(s.maturity).toBe("EVIDENCE-CLOSED");
    expect(s.realPerformProducerExists).toBe(true);
    expect(s.handsOnEqualsPerform).toBe(false);
    expect(s.orchestratorPerformGapAdded).toBe(false);
    expect(s.completionIsNotEvidence).toBe(true);

    const diagnose = readFileSync(
      join(process.cwd(), "src/lib/learning/orchestrator/diagnose.ts"),
      "utf8",
    );
    expect(diagnose).not.toContain("PERFORM_GAP");
  });
});
