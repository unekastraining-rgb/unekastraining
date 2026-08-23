"use client";

import { useState } from "react";
import { Loader2, LogIn, Mail } from "lucide-react";

import { StudyHaulLoginHero } from "@/components/auth/StudyHaulLoginHero";
import { StudyHaulLoginTruck } from "@/components/auth/StudyHaulLoginTruck";
import { StudyHaulBrandHeader } from "@/components/brand/StudyHaulBrandHeader";

export function LoginPageClient({
  error: initialError = null,
  next: nextParam = null,
}: {
  error?: string | null;
  next?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  const googleStartHref = `/api/auth/google/start${
    nextParam ? `?next=${encodeURIComponent(nextParam)}` : ""
  }`;
  const safeNext =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/dashboard";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const email = new FormData(form).get("email")?.toString().trim() ?? "";

    if (!email) {
      event.preventDefault();
      setError("Email is required.");
      return;
    }

    setError(null);
    setLoading(true);
  }

  return (
    <div className="relative grid min-h-[100dvh] lg:grid-cols-2 lg:overflow-hidden">
      <StudyHaulLoginHero />
      <div className="relative bg-[#fff8f1]">
        <div className="relative flex min-h-[100dvh] flex-col justify-center overflow-y-auto px-6 py-10 sm:px-10 lg:min-h-full lg:overflow-hidden lg:px-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 top-12 h-56 w-56 rounded-full bg-orange-100/70 blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-10 bottom-16 h-44 w-44 rounded-full bg-teal-100/60 blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full border border-orange-100/80"
          />

          <div className="relative z-10 mb-8 lg:hidden">
            <StudyHaulBrandHeader variant="compact" />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-md pb-8">
            <form
              method="POST"
              action="/api/auth/login"
              onSubmit={handleSubmit}
              className="relative space-y-5 rounded-3xl border border-orange-100 bg-white/95 p-8 shadow-[0_20px_60px_-24px_rgba(234,88,12,0.25)] ring-1 ring-orange-50 backdrop-blur-sm"
            >
              <input type="hidden" name="redirect" value="1" />
              <input type="hidden" name="next" value={safeNext} />

              <div
                aria-hidden
                className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full border border-teal-100 bg-teal-50/40"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-8 -left-6 h-28 w-28 rounded-full border border-orange-100 bg-orange-50/50"
              />

              <div className="relative">
                <h1 className="text-2xl font-black text-stone-900">Welcome to Study Haul</h1>
                <p className="mt-1 text-sm text-stone-500">Sign up or sign in to your account.</p>
              </div>

              <a
                href={googleStartHref}
                className="relative inline-flex w-full items-center justify-center gap-3 rounded-xl border border-orange-200 bg-white px-5 py-3.5 text-sm font-semibold text-stone-800 transition hover:border-orange-300 hover:bg-orange-50/60"
              >
                <GoogleIcon />
                Continue with Google
              </a>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-orange-100" />
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  or email
                </span>
                <div className="h-px flex-1 bg-orange-100" />
              </div>

              <div className="relative">
                <label
                  htmlFor="login-email"
                  className="text-xs font-bold uppercase tracking-wider text-stone-500"
                >
                  Email
                </label>
                <div className="relative mt-1">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    inputMode="email"
                    enterKeyHint="go"
                    placeholder="name@school-email.edu"
                    className="w-full rounded-xl border border-orange-200 px-4 py-3.5 pl-11 text-base outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-name"
                  className="text-xs font-bold uppercase tracking-wider text-stone-500"
                >
                  Display name (optional)
                </label>
                <input
                  id="login-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Yesenia"
                  className="mt-1 w-full rounded-xl border border-orange-200 px-4 py-3.5 text-base outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              {error ? (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 enabled:bg-orange-500 enabled:text-white enabled:hover:bg-orange-600"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                Continue with email
              </button>

              <p className="text-center text-xs text-stone-500">
                Email sign-in works without a password for local development.
              </p>
            </form>

            <p className="mt-6 text-center text-xs leading-relaxed text-stone-400">
              By proceeding, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
      <StudyHaulLoginTruck />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
