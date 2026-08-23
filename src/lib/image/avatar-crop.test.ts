import { describe, expect, it } from "vitest";

import {
  AVATAR_CROP_VIEWPORT,
  clampCropOffset,
  clampCropTransform,
  clampCropZoom,
  containBaseScale,
  coverBaseScale,
  createDefaultCropTransform,
} from "./avatar-crop";

describe("avatar-crop", () => {
  it("uses cover scale so the viewport is filled", () => {
    expect(coverBaseScale(800, 1200)).toBeCloseTo(AVATAR_CROP_VIEWPORT / 800, 5);
    expect(coverBaseScale(1600, 900)).toBeCloseTo(AVATAR_CROP_VIEWPORT / 900, 5);
  });

  it("uses contain scale so the whole image fits in the viewport", () => {
    expect(containBaseScale(800, 1200)).toBeCloseTo(AVATAR_CROP_VIEWPORT / 1200, 5);
    expect(containBaseScale(1600, 900)).toBeCloseTo(AVATAR_CROP_VIEWPORT / 1600, 5);
  });

  it("defaults to contain fit at zoom 1", () => {
    const transform = createDefaultCropTransform(800, 1200);
    expect(transform.baseScale).toBe(containBaseScale(800, 1200));
    expect(transform.zoom).toBe(1);
  });

  it("clamps zoom below and above configured bounds", () => {
    expect(clampCropZoom(0.1)).toBeGreaterThan(0.1);
    expect(clampCropZoom(10)).toBeLessThan(10);
  });

  it("clamps panning so the crop area stays covered", () => {
    const baseScale = coverBaseScale(800, 1200);
    const zoom = 1;
    const scale = baseScale * zoom;
    const scaledWidth = 800 * scale;

    expect(clampCropOffset(999, AVATAR_CROP_VIEWPORT, scaledWidth)).toBeCloseTo(
      scaledWidth / 2 - AVATAR_CROP_VIEWPORT / 2,
      5,
    );
    expect(clampCropOffset(-999, AVATAR_CROP_VIEWPORT, scaledWidth)).toBeCloseTo(
      AVATAR_CROP_VIEWPORT / 2 - scaledWidth / 2,
      5,
    );
  });

  it("keeps zoom and offsets inside bounds", () => {
    const transform = clampCropTransform(800, 1200, {
      baseScale: coverBaseScale(800, 1200),
      zoom: 2,
      offsetX: 500,
      offsetY: -500,
    });

    expect(transform.offsetX).toBeLessThan(500);
    expect(transform.offsetY).toBeGreaterThan(-500);
  });
});
