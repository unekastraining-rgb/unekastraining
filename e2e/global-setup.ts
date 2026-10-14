import fs from "node:fs";
import path from "node:path";

import { resetAndSeedE2eDatabase } from "./helpers/db";

/**
 * Playwright globalSetup — isolated e2e.db + knowledge seed (no mastery/evidence).
 */
export default async function globalSetup() {
  const seed = await resetAndSeedE2eDatabase();
  const out = path.join(process.cwd(), "e2e", ".seed.json");
  fs.writeFileSync(out, JSON.stringify(seed, null, 2), "utf8");
  console.log("[e2e] seeded", seed);
}
