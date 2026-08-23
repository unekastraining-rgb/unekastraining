import { LMSProvider } from "@/generated/prisma";

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, "");
}

export function getAppOrigin() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function getOAuthCallbackUrl() {
  return `${getAppOrigin()}/api/lms/oauth/callback`;
}

export function getCanvasOAuthUrl(baseUrl: string, state: string) {
  const clientId = process.env.CANVAS_CLIENT_ID;
  if (!clientId) {
    throw new Error("CANVAS_CLIENT_ID is not configured.");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: getOAuthCallbackUrl(),
    state,
  });

  return `${normalizeBaseUrl(baseUrl)}/login/oauth2/auth?${params.toString()}`;
}

export async function exchangeCanvasCode(
  baseUrl: string,
  code: string,
): Promise<{ access_token: string; refresh_token?: string }> {
  const clientId = process.env.CANVAS_CLIENT_ID;
  const clientSecret = process.env.CANVAS_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Canvas OAuth credentials are not configured.");
  }

  const response = await fetch(
    `${normalizeBaseUrl(baseUrl)}/login/oauth2/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: getOAuthCallbackUrl(),
        code,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Canvas token exchange failed (${response.status})`);
  }

  return (await response.json()) as { access_token: string; refresh_token?: string };
}

export function getGoogleClassroomOAuthUrl(state: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured.");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getOAuthCallbackUrl(),
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/classroom.courses.readonly",
      "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
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
      redirect_uri: getOAuthCallbackUrl(),
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    throw new Error(`Google token exchange failed (${response.status})`);
  }

  return (await response.json()) as { access_token: string; refresh_token?: string };
}

export function getBlackboardOAuthUrl(baseUrl: string, state: string) {
  const clientId = process.env.BLACKBOARD_CLIENT_ID;
  if (!clientId) {
    throw new Error("BLACKBOARD_CLIENT_ID is not configured.");
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: getOAuthCallbackUrl(),
    state,
  });

  return `${normalizeBaseUrl(baseUrl)}/learn/api/public/v1/oauth2/authorizationcode?${params.toString()}`;
}

export async function exchangeBlackboardCode(
  baseUrl: string,
  code: string,
): Promise<{ access_token: string; refresh_token?: string }> {
  const clientId = process.env.BLACKBOARD_CLIENT_ID;
  const clientSecret = process.env.BLACKBOARD_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Blackboard OAuth credentials are not configured.");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(
    `${normalizeBaseUrl(baseUrl)}/learn/api/public/v1/oauth2/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: getOAuthCallbackUrl(),
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Blackboard token exchange failed (${response.status})`);
  }

  return (await response.json()) as { access_token: string; refresh_token?: string };
}

export function providerFromState(provider: string): LMSProvider {
  switch (provider) {
    case "BLACKBOARD":
      return LMSProvider.BLACKBOARD;
    case "MOODLE":
      return LMSProvider.MOODLE;
    case "GOOGLE_CLASSROOM":
      return LMSProvider.GOOGLE_CLASSROOM;
    default:
      return LMSProvider.CANVAS;
  }
}
