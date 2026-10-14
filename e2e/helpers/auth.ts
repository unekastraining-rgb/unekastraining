import type { APIRequestContext, BrowserContext, Page } from "@playwright/test";

import { E2E_USER_EMAIL } from "./db";

/**
 * Sign in through the real `/api/auth/login` path.
 * The server attaches `sh_session` with its SESSION_SECRET — matches proxy.ts.
 */
export async function loginViaApi(
  request: APIRequestContext,
  email: string = E2E_USER_EMAIL,
  name = "E2E Learner",
) {
  const res = await request.post("/api/auth/login", {
    data: { email, name },
  });
  const text = await res.text();
  if (!res.ok()) {
    throw new Error(`E2E login failed (${res.status()}): ${text.slice(0, 400)}`);
  }
  try {
    return JSON.parse(text) as {
      success?: boolean;
      user?: { id: string; email: string };
    };
  } catch {
    return { success: true };
  }
}

export async function loginAsPage(page: Page, email?: string) {
  return loginViaApi(page.context().request, email);
}

export async function loginAsContext(context: BrowserContext, email?: string) {
  return loginViaApi(context.request, email);
}

/** Clear session so proxy redirects protected routes to /login. */
export async function logoutContext(context: BrowserContext) {
  await context.clearCookies();
  try {
    await context.request.post("/api/auth/logout");
  } catch {
    /* logout is best-effort when already signed out */
  }
}
