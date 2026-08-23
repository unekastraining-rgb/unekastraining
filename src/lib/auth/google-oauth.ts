import { getAppOrigin } from "@/lib/lms/oauth";

export function getGoogleAuthCallbackUrl() {
  return `${getAppOrigin()}/api/auth/google/callback`;
}

export function getGoogleSignInOAuthUrl(state: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured.");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleAuthCallbackUrl(),
    response_type: "code",
    scope: ["openid", "email", "profile"].join(" "),
    access_type: "online",
    prompt: "select_account",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleAuthCode(code: string): Promise<{
  access_token: string;
  id_token?: string;
}> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials are not configured.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getGoogleAuthCallbackUrl(),
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google sign-in failed (${response.status}): ${text}`);
  }

  return (await response.json()) as { access_token: string; id_token?: string };
}

export async function fetchGoogleUserProfile(accessToken: string): Promise<{
  email: string;
  name: string | null;
  picture: string | null;
}> {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to load Google profile (${response.status})`);
  }

  const data = (await response.json()) as {
    email?: string;
    name?: string;
    picture?: string;
  };

  if (!data.email) {
    throw new Error("Google account did not return an email address.");
  }

  return {
    email: data.email,
    name: data.name ?? null,
    picture: data.picture ?? null,
  };
}
