import { describe, expect, it } from "vitest";

import {
  findOverlayTapControl,
  isTouchChromeInteractive,
} from "@/components/TouchChromeGuard";

/** Minimal HTMLElement mock: `closest` returns a hit when any marker appears in the selector list. */
function mockInteractive(markers: string[]): HTMLElement {
  return {
    closest(selectors: string) {
      for (const marker of markers) {
        if (selectors.includes(marker)) {
          return {} as Element;
        }
      }
      return null;
    },
  } as HTMLElement;
}

describe("isTouchChromeInteractive", () => {
  it("allows chrome inside the notebook desk (selection loop wins over canvas exclude)", () => {
    const button = mockInteractive(["data-core-selection-loop", "data-notebook-desk"]);
    expect(isTouchChromeInteractive(button)).toBe(true);
  });

  it("blocks plain canvas controls without chrome markers", () => {
    const button = mockInteractive(["data-page-canvas"]);
    expect(isTouchChromeInteractive(button)).toBe(false);
  });

  it("allows PDF annotate loop bar and canvas element inspector", () => {
    expect(isTouchChromeInteractive(mockInteractive(["data-pdf-loop-bar"]))).toBe(true);
    expect(isTouchChromeInteractive(mockInteractive(["data-canvas-inspector"]))).toBe(true);
  });

  it("allows core formatting and text toolbars on tablet", () => {
    expect(isTouchChromeInteractive(mockInteractive(["data-core-toolbar-panel"]))).toBe(true);
    expect(isTouchChromeInteractive(mockInteractive(["data-text-format-toolbar"]))).toBe(true);
  });
});

describe("findOverlayTapControl", () => {
  it("returns null for null / non-elements", () => {
    expect(findOverlayTapControl(null)).toBeNull();
  });

  it("returns null when hit is outside overlay roots", () => {
    const hit = {
      closest() {
        return null;
      },
    } as unknown as Element;
    expect(findOverlayTapControl(hit)).toBeNull();
  });

  it("returns a button nested under a side panel marker", () => {
    const button = {
      tagName: "BUTTON",
      type: "button",
      disabled: false,
      nodeType: 1,
      getAttribute: () => null,
      closest(sel: string) {
        if (sel.includes("data-core-side-panel")) return this;
        if (sel.includes("button")) return this;
        if (sel.includes("a[href]")) return null;
        return null;
      },
    } as unknown as Element;
    expect(findOverlayTapControl(button)).toBe(button);
  });

  it("skips submit controls but allows tap-handler buttons (overlay synthesizes click)", () => {
    const submit = {
      tagName: "BUTTON",
      type: "submit",
      disabled: false,
      nodeType: 1,
      getAttribute: () => null,
      closest(sel: string) {
        if (sel.includes("data-core-toolbar-panel")) return this;
        if (sel.includes("button")) return this;
        return null;
      },
    } as unknown as Element;
    expect(findOverlayTapControl(submit)).toBeNull();

    const tapped = {
      tagName: "BUTTON",
      type: "button",
      disabled: false,
      nodeType: 1,
      getAttribute(name: string) {
        return name === "data-tap-handler" ? "1" : null;
      },
      closest(sel: string) {
        if (sel.includes("data-core-toolbar-panel")) return this;
        if (sel.includes("button")) return this;
        return null;
      },
    } as unknown as Element;
    expect(findOverlayTapControl(tapped)).toBe(tapped);
  });
});
