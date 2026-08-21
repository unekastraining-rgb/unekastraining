"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, LogOut } from "lucide-react";

import { ProfileAvatarUpload } from "@/components/hub/ProfileAvatarUpload";

export function AccountPanel() {
  const router = useRouter();
  const [user, setUser] = useState<{
    email: string;
    name: string | null;
    avatarUrl: string | null;
    isDefaultAccount: boolean;
  } | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setUser(data.user);
          setName(data.user.name ?? "");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function saveName() {
    setSavingName(true);
    setNameMessage(null);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Could not save name");
      }
      setUser((current) => (current ? { ...current, name: data.user.name } : current));
      setName(data.user.name ?? "");
      setNameMessage("Display name saved.");
      router.refresh();
    } catch (error) {
      setNameMessage(error instanceof Error ? error.message : "Could not save name");
    } finally {
      setSavingName(false);
    }
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  if (loading) {
    return <p className="text-sm text-stone-500">Loading account…</p>;
  }

  return (
    <section className="card-soft p-6">
      <div className="flex items-center gap-3">
        <ProfileAvatarUpload
          avatarUrl={user?.avatarUrl ?? null}
          fallbackLabel={user?.name ?? user?.email ?? "?"}
          size="md"
        />
        <div>
          <h3 className="text-heading text-xl font-bold">Account</h3>
          <p className="text-body text-sm">
            Your display name, photo, and sign-in details.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="text-sm font-semibold text-stone-700">Display name</span>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="What should we call you?"
              maxLength={80}
              className="min-w-0 flex-1 rounded-xl border border-brand bg-white px-4 py-2.5 text-sm text-stone-900 outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--sh-primary)_25%,transparent)]"
            />
            <button
              type="button"
              onClick={() => void saveName()}
              disabled={savingName}
              className="btn-primary inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm disabled:opacity-60"
            >
              {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save name
            </button>
          </div>
          {nameMessage ? (
            <p
              className={`mt-2 text-sm ${nameMessage.includes("saved") ? "text-emerald-700" : "text-rose-700"}`}
            >
              {nameMessage}
            </p>
          ) : null}
        </label>

        <div className="rounded-2xl border border-brand bg-brand-soft/40 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Email</p>
          <p className="mt-1 text-sm text-stone-700">{user?.email}</p>
          {user?.isDefaultAccount ? (
            <p className="mt-2 text-xs text-amber-700">
              You&apos;re on the shared default profile. Sign in with your email to keep a
              private workspace.
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/login"
          className="rounded-xl border border-brand px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-brand-soft"
        >
          Switch account
        </Link>
        <button
          type="button"
          onClick={() => void signOut()}
          className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </section>
  );
}
