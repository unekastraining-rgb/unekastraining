"use client";

import { ProfileAvatarUpload } from "@/components/hub/ProfileAvatarUpload";
import type { HubUser } from "@/components/hub/types";

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function displayFirstName(user: Pick<HubUser, "name" | "email">) {
  return user.name?.split(" ")[0] ?? user.email.split("@")[0];
}

export function HubWelcomeHeader({
  user,
  subtitle = "Welcome back to Study Haul! Let's conquer your goals.",
  eyebrow,
  children,
}: {
  user: Pick<HubUser, "name" | "email" | "avatarUrl">;
  subtitle?: string;
  eyebrow?: string;
  children?: React.ReactNode;
}) {
  const displayName = displayFirstName(user);

  return (
    <header className="card-soft relative overflow-hidden p-5">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(circle at 10% 20%, var(--sh-primary-soft), transparent 42%), radial-gradient(circle at 90% 10%, var(--sh-accent-soft), transparent 38%), linear-gradient(135deg, var(--sh-background) 0%, var(--sh-surface) 55%, #ffffff 100%)",
        }}
      />
      <div className="relative flex flex-wrap items-center gap-5">
        <ProfileAvatarUpload
          avatarUrl={user.avatarUrl}
          fallbackLabel={displayName}
          size="xl"
        />
        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">{eyebrow}</p>
          ) : null}
          <h1
            suppressHydrationWarning
            className={`text-heading ${eyebrow ? "mt-1" : ""} text-2xl font-bold sm:text-3xl`}
          >
            {timeGreeting()}, {displayName}
          </h1>
          <p className="text-body mt-1 text-sm">{subtitle}</p>
        </div>
        {children}
      </div>
    </header>
  );
}
