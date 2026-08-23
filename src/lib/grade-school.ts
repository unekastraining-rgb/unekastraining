import { getOrCreateUserPreferences } from "@/lib/preferences";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function requireGradeSchoolMode() {
  const user = await getOrCreateDefaultUser();
  const preferences = await getOrCreateUserPreferences(user.id);

  if (!preferences.elementaryMode) {
    throw new Error(
      "Turn on Grade school planner in Settings to use this feature.",
    );
  }

  return { user, preferences };
}
