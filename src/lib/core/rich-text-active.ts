import {
  applyRichTextCommand,
  queryRichTextState,
  type RichTextCommand,
} from "@/lib/core/rich-text";

export type ActiveRichTextHost = {
  id: string;
  focus: () => void;
  emit: () => void;
};

let activeHost: ActiveRichTextHost | null = null;
const listeners = new Set<() => void>();

export function setActiveRichTextHost(host: ActiveRichTextHost | null) {
  activeHost = host;
  for (const listener of listeners) listener();
}

export function getActiveRichTextHost() {
  return activeHost;
}

export function subscribeActiveRichTextHost(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function runActiveRichTextCommand(command: RichTextCommand, value?: string) {
  const host = activeHost;
  if (!host) return false;
  host.focus();
  const ok = applyRichTextCommand(command, value);
  host.emit();
  for (const listener of listeners) listener();
  return ok;
}

export function readActiveRichTextState() {
  return {
    bold: queryRichTextState("bold"),
    italic: queryRichTextState("italic"),
    underline: queryRichTextState("underline"),
  };
}
