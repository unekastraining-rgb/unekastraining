import type { Page } from "@playwright/test";

/**
 * Dev overlay (nextjs-portal) can intercept pointer events in mobile/tablet E2E.
 * Remove it when present — production builds have no nextjs-portal.
 */
export async function dismissDevOverlay(page: Page) {
  await page
    .evaluate(() => {
      document.querySelectorAll("nextjs-portal").forEach((el) => el.remove());
    })
    .catch(() => {});
  await page.keyboard.press("Escape").catch(() => {});
}
