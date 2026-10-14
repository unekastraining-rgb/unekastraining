import { describe, expect, it } from "vitest";

import { runHealthCheck } from "./health";

describe("runHealthCheck", () => {
  it("reports app + database without exposing secrets", async () => {
    const report = await runHealthCheck();
    expect(report.checks.app).toBe(true);
    expect(report.checks.database).toBe(true);
    expect(report.version).toMatch(/beta|0\./);
    expect(report.checkedAt).toEqual(expect.any(String));
    const serialized = JSON.stringify(report);
    // Boolean config flags may include the word "Secret" in key names — values must not appear
    expect(serialized).not.toMatch(/file:\/|Bearer |enc:v1:|sk-|AIza/);
    expect(report.checks).toHaveProperty("sessionSecretConfigured");
    expect(report.checks).toHaveProperty("databaseUrlConfigured");
    expect(typeof report.checks.sessionSecretConfigured).toBe("boolean");
    expect(typeof report.checks.databaseUrlConfigured).toBe("boolean");
  });
});
