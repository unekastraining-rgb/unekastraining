"use client";

import type { PageImage } from "@/lib/core/note-types";
import { resolvePageImageSrc } from "@/lib/core/clip-art-catalog";
import { createPageImage } from "@/lib/core/notebook-pages";

export { createPageImage };

export function PageImagesLayer({
  images,
  onChange,
}: {
  images: PageImage[];
  onChange: (images: PageImage[]) => void;
}) {
  return (
    <>
      {images.map((image) => (
        <div
          key={image.id}
          className="absolute z-[2]"
          style={{ left: image.x, top: image.y, width: image.width }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolvePageImageSrc(image.assetId)}
            alt=""
            className="max-w-full rounded-lg shadow-md"
            draggable={false}
          />
          <button
            type="button"
            onClick={() => onChange(images.filter((item) => item.id !== image.id))}
            className="absolute -right-2 -top-2 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-red-500 shadow"
          >
            ×
          </button>
        </div>
      ))}
    </>
  );
}
