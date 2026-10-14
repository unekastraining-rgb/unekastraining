import { describe, expect, it } from "vitest";
import { getSqlChallenge, isSafeEducationalSelect } from "./challenges";
import { evaluateSqlChallenge } from "./evaluate";

describe("sql challenge evaluation", () => {
  it("rejects destructive SQL", () => {
    expect(isSafeEducationalSelect("DROP TABLE students").ok).toBe(false);
    expect(isSafeEducationalSelect("DELETE FROM students").ok).toBe(false);
    expect(isSafeEducationalSelect("SELECT * FROM students; DROP TABLE x").ok).toBe(
      false,
    );
  });

  it("evaluates correct SELECT against educational dataset", async () => {
    const challenge = getSqlChallenge("sql-select-students")!;
    const result = await evaluateSqlChallenge(
      challenge,
      "SELECT * FROM students",
    );
    expect(result.serverAuthoritative).toBe(true);
    expect(result.outcome).toBe("SUCCESS");
    expect(result.skillFacet).toBe("PERFORM");
  });

  it("fails wrong SELECT", async () => {
    const challenge = getSqlChallenge("sql-high-grades")!;
    const result = await evaluateSqlChallenge(
      challenge,
      "SELECT * FROM students",
    );
    expect(result.outcome).toBe("FAIL");
  });
});
