import { db } from "@/lib/db";

import { getSessionUser } from "@/lib/auth/session";

const DEFAULT_USER_EMAIL = "student@csl.local";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export async function getCurrentUser() {
  return getSessionUser();
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

/** Signed-in user, or a local dev fallback when no session exists. */
export async function getOrCreateDefaultUser() {
  const sessionUser = await getSessionUser();
  if (sessionUser) return sessionUser;

  if (process.env.NODE_ENV === "development") {
    return db.user.upsert({
      where: { email: DEFAULT_USER_EMAIL },
      update: {},
      create: {
        email: DEFAULT_USER_EMAIL,
        name: "Study Haul Student",
      },
    });
  }

  throw new UnauthorizedError();
}

export async function findOrCreateUserByEmail(email: string, name?: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) {
    throw new Error("Enter a valid email address.");
  }

  return db.user.upsert({
    where: { email: normalized },
    update: name?.trim() ? { name: name.trim() } : {},
    create: {
      email: normalized,
      name: name?.trim() || normalized.split("@")[0],
    },
  });
}
