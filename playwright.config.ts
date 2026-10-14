import { defineConfig, devices } from "@playwright/test";
import path from "path";

import { E2E_SESSION_SECRET } from "./e2e/helpers/session";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const E2E_DB = path.join(process.cwd(), "e2e", "data.db").replace(/\\/g, "/");

// Align test-worker env with webServer (cookie encoding + Prisma helpers).
process.env.SESSION_SECRET = E2E_SESSION_SECRET;
process.env.DATABASE_URL = `file:${E2E_DB}`;
process.env.E2E_MODE = "1";

/**
 * 2P-24 — Browser E2E for Universal Learning Engine learner journeys.
 * Isolated SQLite file under e2e/ — never points at production or dev.db.
 *
 * Always start a dedicated Next server: reuseExistingServer can attach to a
 * non-E2E instance on the same port (wrong DB / SESSION_SECRET → login wall).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      // Chromium iPad viewport — not physical Safari/WebKit (hardware unverified).
      name: "tablet",
      use: {
        ...devices["Desktop Chrome"],
        viewport: devices["iPad Mini"].viewport,
        deviceScaleFactor: devices["iPad Mini"].deviceScaleFactor,
        isMobile: devices["iPad Mini"].isMobile,
        hasTouch: devices["iPad Mini"].hasTouch,
      },
      testMatch: /responsive|canonical-adaptive|growth-center/,
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
      testMatch: /responsive|canonical-adaptive/,
    },
  ],
  webServer: {
    command: `npx next dev --hostname 127.0.0.1 --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      ...process.env,
      NODE_ENV: "development",
      DATABASE_URL: `file:${E2E_DB}`,
      SESSION_SECRET: E2E_SESSION_SECRET,
      NEXT_PUBLIC_APP_URL: BASE_URL,
      E2E_MODE: "1",
      STUDY_HAUL_CORE_KNOWLEDGE_BRIDGE: "1",
    },
  },
});
