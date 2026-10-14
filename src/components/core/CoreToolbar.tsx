"use client";

import { CoreChromeAction } from "@/components/core/CoreChromeAction";
import { CoreToolbarFormattingPanel } from "@/components/core/toolbar/CoreToolbarFormattingPanel";
import { CoreToolbarPaperPanel } from "@/components/core/toolbar/CoreToolbarPaperPanel";
import { CoreToolbarPenPanel } from "@/components/core/toolbar/CoreToolbarPenPanel";
import { CoreToolbarAnchorProvider } from "@/components/core/toolbar/CoreToolbarShell";
import { TextFormatToolbar } from "@/components/core/TextFormatToolbar";
import { ClientIcon } from "@/components/ui/ClientIcon";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";
import { useCompactHubNav } from "@/hooks/useCompactHubNav";
import { type CoreGoBucketAction } from "@/lib/core/core-go-actions";
import { penModeToInkSize, penModeToInkTool } from "@/lib/core/core-toolbar-defaults";
import type { CoreToolbarActions, CoreToolbarState } from "@/lib/core/core-toolbar-types";
import type { NotebookChromeState } from "@/lib/core/note-types";
import type { NotebookCoverId, PageTemplateId } from "@/lib/core/page-templates";
import { isTouchChrome } from "@/lib/core/touch-chrome";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import {
  BookOpen,
  Eye,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  ScrollText,
  SlidersHorizontal,
} from "lucide-react";

type MainBucket = "readWrite" | "writing" | "formatting" | "paper" | null;

const MAIN_BUCKETS: {
  id: Exclude<MainBucket, null>;
  label: string;
  icon: typeof Pencil;
}[] = [
  { id: "readWrite", label: "Read / Write", icon: BookOpen },
  { id: "writing", label: "Writing", icon: Pencil },
  { id: "formatting", label: "Formatting", icon: SlidersHorizontal },
  { id: "paper", label: "Edit notebook", icon: ScrollText },
];

export function CoreToolbar({
  state,
  onChange,
  inkColor,
  onInkColorChange,
  inkSize,
  onInkSizeChange,
  fillPattern = "solid",
  onFillPatternChange,
  actions,
  selectActive = false,
  laserActive = false,
  textPlaceActive = false,
  pageTemplateId,
  customBackgroundAssetId,
  onSelectBuiltinTemplate,
  onSelectImportedTemplate,
  notesRailOpen = false,
  onToggleNotesRail,
  notebook,
  coverId,
  customCoverColor,
  customCoverAssetId,
  showCover,
  onCoverChange,
  onCustomCoverColorChange,
  onCustomCoverAssetChange,
  onShowCoverChange,
  onPageBackgroundChange,
  onRulingLineColorChange,
  onRulingSpacingChange,
  onLayerVisibilityChange,
  onApplySurface,
  activeSurface,
  showTextFormat = false,
  floating = false,
  onPageOrientationChange,
  launchBucket = null,
  sidePanel = null,
  onToggleSidePanel,
  onBucketOpenChange,
}: {
  state: CoreToolbarState;
  onChange: (patch: Partial<CoreToolbarState>) => void;
  inkColor: string;
  onInkColorChange: (color: string) => void;
  inkSize?: number;
  onInkSizeChange?: (size: number) => void;
  fillPattern?: import("@/lib/core/ink-engine").InkFillPattern;
  onFillPatternChange?: (pattern: import("@/lib/core/ink-engine").InkFillPattern) => void;
  actions: CoreToolbarActions;
  selectActive?: boolean;
  laserActive?: boolean;
  textPlaceActive?: boolean;
  pageTemplateId?: PageTemplateId;
  customBackgroundAssetId?: string | null;
  onSelectBuiltinTemplate?: (templateId: PageTemplateId) => void;
  onSelectImportedTemplate?: (assetId: string) => void;
  notesRailOpen?: boolean;
  onToggleNotesRail?: () => void;
  notebook?: NotebookChromeState;
  coverId?: NotebookCoverId | string;
  customCoverColor?: string | null;
  customCoverAssetId?: string | null;
  showCover?: boolean;
  onCoverChange?: (id: NotebookCoverId) => void;
  onCustomCoverColorChange?: (color: string | null) => void;
  onCustomCoverAssetChange?: (assetId: string | null) => void;
  onShowCoverChange?: (show: boolean) => void;
  onPageBackgroundChange?: (color: string) => void;
  onPageOrientationChange?: (orientation: "portrait" | "landscape") => void;
  onRulingLineColorChange?: (color: string) => void;
  onRulingSpacingChange?: (px: number) => void;
  onLayerVisibilityChange?: (patch: NonNullable<NotebookChromeState["layerVisibility"]>) => void;
  onApplySurface?: (surface: import("@/components/core/toolbar/CoreToolbarPaperPanel").PaperSurfaceId) => void;
  activeSurface?: import("@/components/core/toolbar/CoreToolbarPaperPanel").PaperSurfaceId;
  showTextFormat?: boolean;
  floating?: boolean;
  /** From /core/go/writing etc. — opens the bucket on SSR. */
  launchBucket?: CoreGoBucketAction | null;
  sidePanel?: "tools" | "sources" | "assist" | "desk" | null;
  onToggleSidePanel?: (id: "tools" | "sources" | "assist" | "desk") => void;
  /** Parent locks canvas while a Writing/Formatting/Paper sheet is open. */
  onBucketOpenChange?: (open: boolean) => void;
}) {
  const [openBucket, setOpenBucket] = useState<MainBucket>(() => {
    if (!launchBucket || launchBucket === "readWrite") return null;
    return launchBucket;
  });
  const [panelAnchor, setPanelAnchor] = useState<CSSProperties | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const bucketOpenedAt = useRef(0);
  const coarsePointer = useCoarsePointer();
  const compactNav = useCompactHubNav();
  // Phone/iPad: always use bottom sheet placement (same panels, reliable hit targets).
  // Does not change chrome visuals — only floating vs anchored layout.
  const [touchChrome, setTouchChrome] = useState(() =>
    typeof window !== "undefined" ? isTouchChrome() : false,
  );
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    setTouchChrome(isTouchChrome());
  }, []);
  const useMobileToolbarSheet = touchChrome || coarsePointer || compactNav;
  const launchHandled = useRef(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!launchBucket || launchHandled.current) return;
    launchHandled.current = true;
    if (launchBucket === "readWrite") {
      actions.onToggleReadOnly();
      return;
    }
    bucketOpenedAt.current = Date.now();
    if (launchBucket === "writing") {
      actions.onSetInkTool(penModeToInkTool(state.activePenMode));
      onChange({
        activePenMode: state.activePenMode,
        inkTool: penModeToInkTool(state.activePenMode),
      });
      actions.onSelectPenMode(state.activePenMode);
      const size = penModeToInkSize(state.activePenMode, state);
      onInkSizeChange?.(size);
    }
    if (launchBucket === "formatting") {
      actions.onSelectTool();
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
    setOpenBucket(launchBucket);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [launchBucket]);

  useLayoutEffect(() => {
    if (!openBucket || openBucket === "readWrite" || useMobileToolbarSheet) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI state to props or external subscription
      setPanelAnchor(null);
      return;
    }

    function measure() {
      const el = toolbarRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const width = Math.min(352, window.innerWidth - 16);
      let left = Math.max(8, rect.left + 4);
      if (left + width > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - width - 8);
      }
      const top = Math.min(rect.bottom + 6, window.innerHeight - 140);
      setPanelAnchor({
        top,
        left,
        width,
        maxHeight: Math.max(160, window.innerHeight - top - 12),
      });
    }

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [openBucket, useMobileToolbarSheet]);

  const clearBucket = () => {
    setOpenBucket(null);
    if (
      launchBucket &&
      launchBucket !== "readWrite" &&
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/core/go/")
    ) {
      window.history.replaceState(null, "", "/core");
    }
  };

  useEffect(() => {
    onBucketOpenChange?.(Boolean(openBucket));
  }, [openBucket, onBucketOpenChange]);

  useEffect(() => {
    if (!openBucket) return;

    function onClickOutside(event: MouseEvent) {
      if (Date.now() - bucketOpenedAt.current < 400) return;
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (toolbarRef.current?.contains(target)) return;
      if (target.closest?.("[data-core-toolbar-panel]")) return;
      if (target.closest?.("[data-core-toolbar-backdrop]")) return;
      if (target.closest?.("[data-core-header]")) return;
      if (target.closest?.("[data-core-hub-bar]")) return;
      if (target.closest?.("[data-core-side-panel]")) return;
      clearBucket();
    }

    const timer = window.setTimeout(() => {
      document.addEventListener("click", onClickOutside, true);
    }, 400);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("click", onClickOutside, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openBucket]);

  function selectPenMode(mode: CoreToolbarState["activePenMode"]) {
    onChange({ activePenMode: mode, inkTool: penModeToInkTool(mode) });
    actions.onSelectPenMode(mode);
    actions.onSetInkTool(penModeToInkTool(mode));
    const size = penModeToInkSize(mode, { ...state, activePenMode: mode });
    onInkSizeChange?.(size);
    if (mode === "highlighter") actions.onSetInkTool("highlighter");
  }

  const panel =
    openBucket === "writing" ? (
      <CoreToolbarPenPanel
        state={state}
        inkColor={inkColor}
        inkSize={inkSize}
        onInkColorChange={onInkColorChange}
        onInkSizeChange={onInkSizeChange}
        fillPattern={fillPattern}
        onFillPatternChange={onFillPatternChange}
        onChange={onChange}
        onSelectPenMode={selectPenMode}
        onClose={clearBucket}
      />
    ) : openBucket === "formatting" ? (
      <CoreToolbarFormattingPanel
        state={state}
        onChange={onChange}
        actions={actions}
        inkSize={inkSize}
        onInkSizeChange={onInkSizeChange}
        selectActive={selectActive}
        lassoActive={state.inkTool === "lasso"}
        eraserActive={state.inkTool === "eraser"}
        textPlaceActive={textPlaceActive}
        shapeActive={state.inkTool === "shape"}
        laserActive={laserActive}
        onClose={clearBucket}
      />
    ) : openBucket === "paper" ? (
      <CoreToolbarPaperPanel
        notebook={notebook}
        coverId={coverId}
        customCoverColor={customCoverColor}
        customCoverAssetId={customCoverAssetId}
        showCover={showCover}
        pageTemplateId={pageTemplateId}
        customBackgroundAssetId={customBackgroundAssetId}
        activeSurface={activeSurface}
        onCoverChange={(id) => onCoverChange?.(id)}
        onCustomCoverColorChange={(color) => onCustomCoverColorChange?.(color)}
        onCustomCoverAssetChange={(assetId) => onCustomCoverAssetChange?.(assetId)}
        onShowCoverChange={(show) => onShowCoverChange?.(show)}
        onPageBackgroundChange={onPageBackgroundChange}
        onPageOrientationChange={onPageOrientationChange}
        onRulingLineColorChange={onRulingLineColorChange}
        onRulingSpacingChange={onRulingSpacingChange}
        onLayerVisibilityChange={onLayerVisibilityChange}
        onSelectBuiltinTemplate={(id) => onSelectBuiltinTemplate?.(id)}
        onSelectImportedTemplate={(id) => onSelectImportedTemplate?.(id)}
        onApplySurface={onApplySurface}
        onClose={clearBucket}
      />
    ) : null;

  return (
    <div
      ref={toolbarRef}
      data-core-toolbar
      data-core-chrome
      data-core-desktop-hub
      className={
        floating
          ? "core-desktop-hub pointer-events-none absolute inset-x-0 top-0 z-[220] border-b border-orange-100/40 bg-white/90 shadow-sm backdrop-blur-md"
          : "core-desktop-hub relative z-[200] shrink-0 border-b border-orange-100/80 bg-white"
      }
      suppressHydrationWarning
    >
      <div className="pointer-events-auto flex min-h-8 items-center gap-1 overflow-x-auto px-1.5 py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex shrink-0 items-center justify-center gap-0.5">
          {onToggleNotesRail ? (
            <CoreChromeAction
              onActivate={() => onToggleNotesRail()}
              pressed={notesRailOpen}
              aria-label={notesRailOpen ? "Hide notebooks" : "Show notebooks"}
              title={notesRailOpen ? "Hide notebooks" : "Show notebooks"}
              className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 transition touch-manipulation ${
                notesRailOpen
                  ? "bg-stone-900 text-white shadow-sm"
                  : "text-stone-600 hover:bg-orange-50 hover:text-stone-900"
              }`}
            >
              {notesRailOpen ? (
                <ClientIcon icon={PanelLeftClose} className="h-4 w-4" />
              ) : (
                <ClientIcon icon={PanelLeftOpen} className="h-4 w-4" />
              )}
            </CoreChromeAction>
          ) : null}
          {MAIN_BUCKETS.map((bucket) => {
            const Icon =
              bucket.id === "readWrite"
                ? state.readOnly
                  ? Eye
                  : BookOpen
                : bucket.icon;
            const label =
              bucket.id === "readWrite"
                ? state.readOnly
                  ? "Read (tap to write)"
                  : "Write (tap for read-only)"
                : bucket.label;
            const bucketOpen = openBucket === bucket.id;
            const pressed =
              bucketOpen || (bucket.id === "readWrite" && state.readOnly);

            const className = `inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg p-2 transition touch-manipulation ${
              pressed
                ? "bg-stone-900 text-white shadow-sm"
                : "text-stone-600 hover:bg-orange-50 hover:text-stone-900"
            }`;

            return (
              <CoreChromeAction
                key={bucket.id}
                pressed={pressed}
                aria-label={label}
                title={label}
                className={className}
                onActivate={() => {
                  if (bucket.id === "readWrite") {
                    actions.onToggleReadOnly();
                    return;
                  }
                  if (openBucket === bucket.id) {
                    clearBucket();
                    return;
                  }
                  bucketOpenedAt.current = Date.now();
                  if (bucket.id === "writing") {
                    actions.onSetInkTool(penModeToInkTool(state.activePenMode));
                    onChange({
                      activePenMode: state.activePenMode,
                      inkTool: penModeToInkTool(state.activePenMode),
                    });
                    actions.onSelectPenMode(state.activePenMode);
                    const size = penModeToInkSize(state.activePenMode, state);
                    onInkSizeChange?.(size);
                  }
                  if (bucket.id === "formatting") {
                    actions.onSelectTool();
                  }
                  setOpenBucket(bucket.id);
                }}
              >
                <ClientIcon icon={Icon} className="h-4 w-4" />
              </CoreChromeAction>
            );
          })}
        </div>

        {showTextFormat && !state.readOnly ? (
          <>
            <span className="mx-0.5 h-5 w-px shrink-0 bg-stone-200" aria-hidden />
            <TextFormatToolbar compact className="min-w-0" />
          </>
        ) : null}

        {onToggleSidePanel ? (
          <div className="ml-auto flex shrink-0 items-center gap-1 pl-1">
            {(
              [
                { id: "tools" as const, label: "Inserts" },
                { id: "sources" as const, label: "Assist" },
                { id: "assist" as const, label: "Format" },
                { id: "desk" as const, label: "Desk" },
              ] as const
            ).map((item) => (
              <CoreChromeAction
                key={item.id}
                onActivate={() => onToggleSidePanel(item.id)}
                pressed={sidePanel === item.id}
                className={`shrink-0 rounded-lg border px-2 py-1 text-[10px] font-semibold touch-manipulation sm:px-2.5 sm:text-[11px] ${
                  sidePanel === item.id
                    ? "border-stone-900 bg-stone-900 text-white"
                    : "border-brand text-stone-700"
                }`}
              >
                {item.label}
              </CoreChromeAction>
            ))}
          </div>
        ) : null}
      </div>

      {state.readOnly ? (
        <div className="pointer-events-auto border-t border-amber-100 bg-amber-50/90 px-2 py-0.5 text-center text-[9px] font-semibold text-amber-800">
          Read-only — tap eye icon to edit
        </div>
      ) : null}

      {/* Same React panels on all devices — portal so overflow never eats taps. */}
      {panel ? (
        portalReady ? (
          <>
            {useMobileToolbarSheet
              ? createPortal(
                  <button
                    type="button"
                    data-core-toolbar-backdrop
                    data-core-chrome-action="1"
                    className="fixed inset-0 z-[5090] cursor-default bg-stone-900/25 lg:hidden"
                    aria-label="Close toolbar panel"
                    style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
                    onClick={clearBucket}
                    onTouchEnd={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      clearBucket();
                    }}
                  />,
                  document.body,
                )
              : null}
            {createPortal(
              <CoreToolbarAnchorProvider anchor={panelAnchor}>
                {panel}
              </CoreToolbarAnchorProvider>,
              document.body,
            )}
          </>
        ) : (
          <>
            <button
              type="button"
              data-core-toolbar-backdrop
              data-core-chrome-action="1"
              className="fixed inset-0 z-[5090] cursor-default bg-stone-900/25"
              aria-label="Close toolbar panel"
              style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
              onClick={clearBucket}
              onTouchEnd={(event) => {
                event.preventDefault();
                event.stopPropagation();
                clearBucket();
              }}
            />
            <div
              data-core-toolbar-panel
              className="pointer-events-auto fixed inset-x-0 bottom-0 z-[5100] max-h-[min(82vh,40rem)] overflow-auto rounded-t-2xl border border-brand bg-white shadow-2xl"
            >
              {panel}
            </div>
          </>
        )
      ) : null}
    </div>
  );
}
