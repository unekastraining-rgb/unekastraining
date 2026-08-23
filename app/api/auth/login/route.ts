import { NextResponse } from "next/server";

import {
  attachSessionCookie,
  safeLoginRedirectPath,
} from "@/lib/auth/session-cookie";
import { findOrCreateUserByEmail } from "@/lib/user";

type LoginBody = {
  email?: string;
  name?: string;
  next?: string;
  redirect?: string | boolean;
};

async function readLoginBody(request: Request): Promise<LoginBody> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as LoginBody;
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const form = await request.formData();
    return {
      email: String(form.get("email") ?? ""),
      name: String(form.get("name") ?? ""),
      next: String(form.get("next") ?? ""),
      redirect: String(form.get("redirect") ?? ""),
    };
  }

  return {};
}

function wantsRedirect(body: LoginBody) {
  return body.redirect === true || body.redirect === "1" || body.redirect === "true";
}

function loginErrorResponse(
  request: Request,
  message: string,
  body: LoginBody,
  status = 400,
) {
  if (wantsRedirect(body)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", message);
    const next = body.next?.trim();
    if (next && next.startsWith("/") && !next.startsWith("//")) {
      loginUrl.searchParams.set("next", next);
    }
    return NextResponse.redirect(loginUrl, 303);
  }

  return NextResponse.json({ success: false, error: message }, { status });
}

export async function POST(request: Request) {
  let body: LoginBody = {};

  try {
    body = await readLoginBody(request);
    const email = body.email?.trim() ?? "";
    const name = body.name?.trim() ?? "";
    const next = safeLoginRedirectPath(body.next);
    const redirect = wantsRedirect(body);

    if (!email) {
      return loginErrorResponse(request, "Email is required.", body);
    }

    const user = await findOrCreateUserByEmail(email, name);

    if (redirect) {
      const response = NextResponse.redirect(new URL(next, request.url), 303);
      attachSessionCookie(response, request, { userId: user.id });
      return response;
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
    attachSessionCookie(response, request, { userId: user.id });
    return response;
  } catch (error) {
    console.error("Login failed:", error);
    const message = error instanceof Error ? error.message : "Login failed.";
    return loginErrorResponse(request, message, body);
  }
}
