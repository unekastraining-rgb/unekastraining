"use client";

import { Camera } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ProfilePhotoCropModal } from "./ProfilePhotoCropModal";
import { useIsClientMounted } from "@/hooks/useClientSnapshot";

export function ProfileAvatarUpload({
  avatarUrl,
  fallbackLabel,
  size = "lg",
  onUploaded,
}: {
  avatarUrl: string | null;
  fallbackLabel: string;
  size?: "md" | "lg" | "xl";
  onUploaded?: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const mounted = useIsClientMounted();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    setUrl(avatarUrl);
  }, [avatarUrl]);

  const dim =
    size === "xl"
      ? "h-28 w-28 sm:h-32 sm:w-32"
      : size === "lg"
        ? "h-14 w-14"
        : "h-12 w-12";
  const fallbackText = size === "xl" ? "text-3xl sm:text-4xl" : "text-xl";
  const cameraIcon = size === "xl" ? "h-6 w-6" : "h-5 w-5";
  const radius = size === "xl" ? "rounded-3xl" : "rounded-2xl";

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/user/avatar", { method: "POST", body: form });
      const data = (await res.json()) as { success?: boolean; avatarUrl?: string; error?: string };
      if (!data.success || !data.avatarUrl) {
        throw new Error(data.error ?? "Upload failed");
      }
      setUrl(data.avatarUrl);
      onUploaded?.(data.avatarUrl);
    } finally {
      setUploading(false);
    }
  }

  function onFileSelected(file: File) {
    setPendingFile(file);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`group relative ${dim} shrink-0 overflow-hidden ${radius} ring-2 ring-white shadow-sm`}
        style={{
          background:
            "linear-gradient(to bottom right, color-mix(in srgb, var(--sh-primary) 35%, white), color-mix(in srgb, var(--sh-primary) 20%, white))",
        }}
        title="Upload profile photo"
      >
        {mounted && url ? (
          // Native img avoids Next/Image SSR wrapper mismatches on user uploads.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            className="h-full w-full object-cover object-center"
            onError={() => setUrl(null)}
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center font-black text-stone-800 ${fallbackText}`}
          >
            {fallbackLabel.slice(0, 1).toUpperCase()}
          </div>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-stone-900/40 opacity-0 transition group-hover:opacity-100">
          <Camera className={`${cameraIcon} text-white`} />
        </span>
        {uploading ? (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-[10px] font-bold text-stone-600">
            …
          </span>
        ) : null}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onFileSelected(file);
        }}
      />

      {pendingFile ? (
        <ProfilePhotoCropModal
          file={pendingFile}
          onCancel={() => setPendingFile(null)}
          onComplete={async (croppedFile) => {
            setPendingFile(null);
            await uploadFile(croppedFile);
          }}
        />
      ) : null}
    </>
  );
}
