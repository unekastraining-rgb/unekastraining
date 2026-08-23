export const AVATAR_CROP_VIEWPORT = 280;
export const AVATAR_EXPORT_SIZE = 512;
export const AVATAR_CROP_MIN_ZOOM = 0.65;
export const AVATAR_CROP_MAX_ZOOM = 3;

export type AvatarCropTransform = {
  baseScale: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
};

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      // Keep the blob URL alive for preview rendering; revoke with releaseLoadedImage().
      image.dataset.objectUrl = url;
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image"));
    };
    image.src = url;
  });
}

export function releaseLoadedImage(image: HTMLImageElement | null | undefined) {
  const url = image?.dataset.objectUrl;
  if (!url) return;
  URL.revokeObjectURL(url);
  delete image.dataset.objectUrl;
}

export function coverBaseScale(
  imageWidth: number,
  imageHeight: number,
  viewport = AVATAR_CROP_VIEWPORT,
): number {
  return Math.max(viewport / imageWidth, viewport / imageHeight);
}

/** Fit the whole image inside the crop circle — default for the adjust step. */
export function containBaseScale(
  imageWidth: number,
  imageHeight: number,
  viewport = AVATAR_CROP_VIEWPORT,
): number {
  return Math.min(viewport / imageWidth, viewport / imageHeight);
}

export function createDefaultCropTransform(
  imageWidth: number,
  imageHeight: number,
  viewport = AVATAR_CROP_VIEWPORT,
): AvatarCropTransform {
  return {
    baseScale: containBaseScale(imageWidth, imageHeight, viewport),
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
  };
}

export function clampCropZoom(zoom: number): number {
  return Math.min(AVATAR_CROP_MAX_ZOOM, Math.max(AVATAR_CROP_MIN_ZOOM, zoom));
}

export function clampCropOffset(
  offset: number,
  viewport: number,
  scaledDimension: number,
): number {
  const min = viewport / 2 - scaledDimension / 2;
  const max = scaledDimension / 2 - viewport / 2;
  if (min > max) return 0;
  return Math.min(max, Math.max(min, offset));
}

export function clampCropTransform(
  imageWidth: number,
  imageHeight: number,
  transform: AvatarCropTransform,
  viewport = AVATAR_CROP_VIEWPORT,
): AvatarCropTransform {
  const zoom = clampCropZoom(transform.zoom);
  const scale = transform.baseScale * zoom;
  const scaledWidth = imageWidth * scale;
  const scaledHeight = imageHeight * scale;

  return {
    ...transform,
    zoom,
    offsetX: clampCropOffset(transform.offsetX, viewport, scaledWidth),
    offsetY: clampCropOffset(transform.offsetY, viewport, scaledHeight),
  };
}

export function renderAvatarCropBlob(
  image: HTMLImageElement,
  transform: AvatarCropTransform,
  viewport = AVATAR_CROP_VIEWPORT,
  outputSize = AVATAR_EXPORT_SIZE,
): Promise<Blob> {
  const clamped = clampCropTransform(image.width, image.height, transform, viewport);
  const scale = clamped.baseScale * clamped.zoom;
  const scaledWidth = image.width * scale;
  const scaledHeight = image.height * scale;
  const imageLeft = viewport / 2 - scaledWidth / 2 + clamped.offsetX;
  const imageTop = viewport / 2 - scaledHeight / 2 + clamped.offsetY;
  const ratio = outputSize / viewport;

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return Promise.reject(new Error("Canvas unavailable"));
  }

  ctx.beginPath();
  ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, outputSize, outputSize);

  ctx.drawImage(
    image,
    0,
    0,
    image.width,
    image.height,
    imageLeft * ratio,
    imageTop * ratio,
    scaledWidth * ratio,
    scaledHeight * ratio,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not export image"));
          return;
        }
        resolve(blob);
      },
      "image/png",
    );
  });
}
