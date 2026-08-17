import { db } from "@/lib/db";

const DEFAULT_USER_EMAIL = "student@csl.local";

export async function getOrCreateDefaultUser() {
  return db.user.upsert({
    where: { email: DEFAULT_USER_EMAIL },
    update: {},
    create: {
      email: DEFAULT_USER_EMAIL,
      name: "CSL Student",
    },
  });
}
