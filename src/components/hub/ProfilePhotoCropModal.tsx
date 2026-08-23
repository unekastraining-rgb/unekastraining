"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, ZoomIn } from "lucide-react";

import {
  AVATAR_CROP_MAX_ZOOM,
  AVATAR_CROP_MIN_ZOOM,
  AVATAR_CROP_VIEWPORT,
  clampCropTransform,
  clampCropZoom,
  createDefaultCropTransform,
  loadImageFromFile,
  releaseLoadedImage,
  renderAvatarCropBlob,
  type AvatarCropTransform,
} from "@/lib/image/avatar-crop";

export function ProfilePhotoCropModal({
  file,
  onCancel,
  onComplete,
}: {
  file: File;
  onCancel: () => void;
  onComplete: (croppedFile: File) => Promise<void>;
}) {
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(
    null,
  );
  const loadedImageRef = useRef<HTMLImageElement | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [transform, setTransform] = useState<AvatarCropTransform | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadImageFromFile(file)
      .then((loaded) => {
        if (cancelled) {
          releaseLoadedImage(loaded);
          return;
        }
        loadedImageRef.current = loaded;
        setImage(loaded);
        setTransform(createDefaultCropTransform(loaded.width, loaded.height));
      })
      .catch(() => {
        if (!cancelled) setError("Could not load that image.");
      });
    return () => {
      cancelled = true;
      releaseLoadedImage(loadedImageRef.current);
      loadedImageRef.current = null;
    };
  }, [file]);

  const updateTransform = useCallback(
    (patch: Partial<AvatarCropTransform>) => {
      setTransform((current) => {
        if (!current || !image) return current;
        return clampCropTransform(image.width, image.height, { ...current, ...patch });
      });
    },
    [image],
  );

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!transform) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: transform.offsetX,
      originY: transform.offsetY,
    };
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    updateTransform({
      offsetX: drag.originX + (event.clientX - drag.startX),
      offsetY: drag.originY + (event.clientY - drag.startY),
    });
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function onWheel(event: React.WheelEvent<HTMLDivElement>) {
    if (!transform) return;
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.08 : 0.08;
    updateTransform({ zoom: clampCropZoom(transform.zoom + delta) });
  }

  async function saveCrop() {
    if (!image || !transform) return;
    setSaving(true);
    setError(null);
    try {
      const blob = await renderAvatarCropBlob(image, transform);
      const croppedFile = new File([blob], file.name.replace(/\.\w+$/, "") + "-avatar.png", {
        type: "image/png",
      });
      await onComplete(croppedFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save photo");
    } finally {
      setSaving(false);
    }
  }

  const scale = transform ? transform.baseScale * transform.zoom : 1;
  const imageWidth = image ? image.width * scale : 0;
  const imageHeight = image ? image.height * scale : 0;
  const imageLeft = AVATAR_CROP_VIEWPORT / 2 - imageWidth / 2 + (transform?.offsetX ?? 0);
  const imageTop = AVATAR_CROP_VIEWPORT / 2 - imageHeight / 2 + (transform?.offsetY ?? 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-3xl border border-brand bg-white p-5 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-crop-title"
      >
        <h2 id="profile-crop-title" className="text-lg font-bold text-stone-900">
          Adjust your photo
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Your full photo starts visible. Zoom in and drag to frame your face in the circle.
        </p>

        <div className="mt-5 flex justify-center">
          <div
            className="relative touch-none overflow-hidden rounded-full bg-stone-900 shadow-lg ring-4 ring-white"
            style={{ width: AVATAR_CROP_VIEWPORT, height: AVATAR_CROP_VIEWPORT }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
          >
            {!image || !transform ? (
              <div className="flex h-full w-full items-center justify-center text-sm text-stone-400">
                Loading…
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image.dataset.objectUrl ?? image.src}
                alt="Crop preview"
                draggable={false}
                className="absolute max-w-none select-none"
                style={{
                  width: imageWidth,
                  height: imageHeight,
                  left: imageLeft,
                  top: imageTop,
                }}
              />
            )}
          </div>
        </div>

        <label className="mt-5 block">
          <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-stone-700">
            <ZoomIn className="h-4 w-4 text-brand" />
            Zoom
          </span>
          <input
            type="range"
            min={AVATAR_CROP_MIN_ZOOM}
            max={AVATAR_CROP_MAX_ZOOM}
            step={0.01}
            value={transform?.zoom ?? 1}
            disabled={!transform}
            onChange={(event) => updateTransform({ zoom: Number(event.target.value) })}
            className="w-full accent-[var(--sh-primary,#ea580c)]"
          />
        </label>

        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-xl border border-brand px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-brand-soft disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void saveCrop()}
            disabled={saving || !transform || !image}
            className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save photo
          </button>
        </div>
      </div>
    </div>
  );
}
