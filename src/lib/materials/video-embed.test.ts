import { describe, expect, it } from "vitest";

import {
  isDirectVideoUrl,
  isVideoFilePath,
  isVideoMaterial,
  toVideoEmbedUrl,
} from "@/lib/materials/video-embed";

describe("video-embed", () => {
  it("embeds YouTube watch, shorts, and youtu.be links", () => {
    expect(toVideoEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
    expect(toVideoEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
    expect(toVideoEmbedUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
  });

  it("detects uploaded video files vs PDFs", () => {
    expect(isVideoFilePath("/uploads/lecture.mp4")).toBe(true);
    expect(isVideoFilePath("/uploads/chapter.pdf")).toBe(false);
    expect(isDirectVideoUrl("https://cdn.example.com/a.webm")).toBe(true);
    expect(
      isVideoMaterial({ type: "VIDEO", url: null, filePath: "x.mp4" }),
    ).toBe(true);
    expect(
      isVideoMaterial({
        type: "DOCUMENT",
        url: "https://youtube.com/watch?v=dQw4w9WgXcQ",
        filePath: null,
      }),
    ).toBe(true);
  });
});
