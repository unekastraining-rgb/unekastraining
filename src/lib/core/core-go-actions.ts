/** Path actions under /core/go/[action] — same activation model as /core/shelf. */
export const CORE_GO_PANEL_ACTIONS = ["tools", "sources", "assist", "desk"] as const;
export const CORE_GO_BUCKET_ACTIONS = ["writing", "formatting", "paper", "readWrite"] as const;

/** Touch-only oneshots from CoreToolbarTouchPanels native forms. */
export const CORE_GO_INK_ACTIONS = [
  "ink-pencil",
  "ink-colorPencil",
  "ink-fountain",
  "ink-ball",
  "ink-brush",
  "ink-marker",
  "ink-highlighter",
  "ink-crayon",
  "ink-chalk",
  "ink-tape",
] as const;

export const CORE_GO_FMT_ACTIONS = [
  "fmt-select",
  "fmt-lasso",
  "fmt-eraser",
  "fmt-shapes",
  "fmt-text",
  "fmt-undo",
  "fmt-redo",
] as const;

export const CORE_GO_SURFACE_ACTIONS = [
  "surface-notebook",
  "surface-whiteboard",
  "surface-chalkboard",
] as const;

export const CORE_GO_INSERT_ACTIONS = [
  "insert-sticky",
  "insert-textbox",
  "insert-sticker",
  "insert-elements",
  "insert-image",
] as const;

export const CORE_GO_ONESHOT_ACTIONS = [
  "pages",
  "split",
  "dark",
  "save",
  "rail",
  "close",
  "new",
  "newWhiteboard",
  "import",
  ...CORE_GO_INK_ACTIONS,
  ...CORE_GO_FMT_ACTIONS,
  ...CORE_GO_SURFACE_ACTIONS,
  ...CORE_GO_INSERT_ACTIONS,
] as const;

export type CoreGoPanelAction = (typeof CORE_GO_PANEL_ACTIONS)[number];
export type CoreGoBucketAction = (typeof CORE_GO_BUCKET_ACTIONS)[number];
export type CoreGoInkAction = (typeof CORE_GO_INK_ACTIONS)[number];
export type CoreGoFmtAction = (typeof CORE_GO_FMT_ACTIONS)[number];
export type CoreGoSurfaceAction = (typeof CORE_GO_SURFACE_ACTIONS)[number];
export type CoreGoInsertAction = (typeof CORE_GO_INSERT_ACTIONS)[number];
export type CoreGoOneshotAction = (typeof CORE_GO_ONESHOT_ACTIONS)[number];
export type CoreGoAction =
  | CoreGoPanelAction
  | CoreGoBucketAction
  | CoreGoOneshotAction;

export function isCoreGoAction(value: string): value is CoreGoAction {
  return (
    (CORE_GO_PANEL_ACTIONS as readonly string[]).includes(value) ||
    (CORE_GO_BUCKET_ACTIONS as readonly string[]).includes(value) ||
    (CORE_GO_ONESHOT_ACTIONS as readonly string[]).includes(value)
  );
}

export function isCoreGoPanelAction(value: string): value is CoreGoPanelAction {
  return (CORE_GO_PANEL_ACTIONS as readonly string[]).includes(value);
}

export function isCoreGoBucketAction(value: string): value is CoreGoBucketAction {
  return (CORE_GO_BUCKET_ACTIONS as readonly string[]).includes(value);
}

export function isCoreGoInkAction(value: string): value is CoreGoInkAction {
  return (CORE_GO_INK_ACTIONS as readonly string[]).includes(value);
}

export function isCoreGoFmtAction(value: string): value is CoreGoFmtAction {
  return (CORE_GO_FMT_ACTIONS as readonly string[]).includes(value);
}

export function isCoreGoSurfaceAction(value: string): value is CoreGoSurfaceAction {
  return (CORE_GO_SURFACE_ACTIONS as readonly string[]).includes(value);
}

export function isCoreGoInsertAction(value: string): value is CoreGoInsertAction {
  return (CORE_GO_INSERT_ACTIONS as readonly string[]).includes(value);
}

/** Plain path — Safari activates these like Shelf even when client JS is sick. */
export function coreGoPath(action: CoreGoAction): string {
  return `/core/go/${action}`;
}

/** Map ink-* go action → pen mode id. */
export function inkActionToPenMode(
  action: CoreGoInkAction,
):
  | "pencil"
  | "colorPencil"
  | "fountain"
  | "ball"
  | "brush"
  | "marker"
  | "highlighter"
  | "crayon"
  | "chalk"
  | "tape" {
  return action.slice("ink-".length) as ReturnType<typeof inkActionToPenMode>;
}
