/** Allowed inline formatting for Core note text boxes. */

const ALLOWED_TAGS = new Set([
  "B",
  "STRONG",
  "I",
  "EM",
  "U",
  "SPAN",
  "BR",
  "DIV",
  "P",
  "FONT",
]);

const ALLOWED_STYLE_PROPS = new Set([
  "color",
  "background-color",
  "font-weight",
  "font-style",
  "text-decoration",
  "text-decoration-line",
]);

export const TEXT_HIGHLIGHT_COLORS = [
  { id: "yellow", value: "#fef08a", label: "Yellow" },
  { id: "lime", value: "#bef264", label: "Lime" },
  { id: "pink", value: "#f9a8d4", label: "Pink" },
  { id: "orange", value: "#fdba74", label: "Orange" },
  { id: "sky", value: "#7dd3fc", label: "Sky" },
  { id: "lavender", value: "#d8b4fe", label: "Lavender" },
] as const;

export const TEXT_INK_COLORS = [
  { id: "stone", value: "#44403c", label: "Stone" },
  { id: "black", value: "#1c1917", label: "Black" },
  { id: "blue", value: "#0369a1", label: "Blue" },
  { id: "red", value: "#e11d48", label: "Red" },
  { id: "orange", value: "#ea580c", label: "Orange" },
  { id: "green", value: "#15803d", label: "Green" },
  { id: "purple", value: "#7e22ce", label: "Purple" },
] as const;

function sanitizeStyle(style: string): string {
  return style
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const colon = part.indexOf(":");
      if (colon < 0) return null;
      const prop = part.slice(0, colon).trim().toLowerCase();
      const value = part.slice(colon + 1).trim();
      if (!ALLOWED_STYLE_PROPS.has(prop)) return null;
      if (/url\s*\(|expression\s*\(|javascript:/i.test(value)) return null;
      return `${prop}: ${value}`;
    })
    .filter(Boolean)
    .join("; ");
}

export function plainTextFromHtml(html: string): string {
  if (typeof document === "undefined") {
    return html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(div|p)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim();
  }
  const template = document.createElement("template");
  template.innerHTML = html;
  return (template.content.textContent ?? "").replace(/\u00a0/g, " ");
}

export function sanitizeRichHtml(html: string): string {
  if (typeof document === "undefined") {
    return html.replace(/<(?!\/?(?:b|strong|i|em|u|span|br|div|p|font)\b)[^>]*>/gi, "");
  }

  const template = document.createElement("template");
  template.innerHTML = html;

  function walk(node: Node) {
    const children = [...node.childNodes];
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        if (!ALLOWED_TAGS.has(el.tagName)) {
          const parent = el.parentNode;
          if (!parent) continue;
          while (el.firstChild) parent.insertBefore(el.firstChild, el);
          parent.removeChild(el);
          continue;
        }

        for (const attr of [...el.attributes]) {
          const name = attr.name.toLowerCase();
          if (name === "style") {
            const cleaned = sanitizeStyle(attr.value);
            if (cleaned) el.setAttribute("style", cleaned);
            else el.removeAttribute("style");
          } else if (name === "color" && el.tagName === "FONT") {
            // keep
          } else {
            el.removeAttribute(attr.name);
          }
        }

        walk(el);
      } else if (child.nodeType === Node.COMMENT_NODE) {
        child.parentNode?.removeChild(child);
      }
    }
  }

  walk(template.content);
  return template.innerHTML;
}

export function htmlFromPlainText(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

export function resolveTextBoxHtml(box: { text: string; html?: string | null }): string {
  if (box.html?.trim()) return box.html;
  return htmlFromPlainText(box.text ?? "");
}

export type RichTextCommand =
  | "bold"
  | "italic"
  | "underline"
  | "foreColor"
  | "hiliteColor"
  | "removeFormat";

export function applyRichTextCommand(
  command: RichTextCommand,
  value?: string,
): boolean {
  if (typeof document === "undefined") return false;
  try {
    if (command === "foreColor" || command === "hiliteColor") {
      return document.execCommand(command, false, value ?? "");
    }
    if (command === "removeFormat") {
      return document.execCommand("removeFormat", false);
    }
    return document.execCommand(command, false);
  } catch {
    return false;
  }
}

export function queryRichTextState(command: "bold" | "italic" | "underline"): boolean {
  if (typeof document === "undefined") return false;
  try {
    return document.queryCommandState(command);
  } catch {
    return false;
  }
}
