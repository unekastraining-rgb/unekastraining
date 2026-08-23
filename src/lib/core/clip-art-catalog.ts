export type ClipArtGroup =
  | "stickers"
  | "decorative"
  | "expressive"
  | "math"
  | "science"
  | "anatomy"
  | "history"
  | "language"
  | "arts"
  | "study"
  | "tech"
  | "animated";

/** @deprecated Use ClipArtGroup */
export type ClipArtCategory = "stickers" | "clip-art" | "gifs";

export interface SiteClipArtItem {
  id: string;
  label: string;
  group: ClipArtGroup;
  /** Path under /public, e.g. clip-art/star.svg */
  src: string;
  tags?: string[];
}

export const CLIP_ART_GROUP_LABELS: Record<ClipArtGroup, string> = {
  stickers: "Stickers",
  decorative: "Decorative",
  expressive: "Expressive",
  math: "Math",
  science: "Science",
  anatomy: "Anatomy",
  history: "History",
  language: "Language",
  arts: "Arts",
  study: "Study",
  tech: "Tech",
  animated: "Animated",
};

/** @deprecated Use CLIP_ART_GROUP_LABELS */
export const CLIP_ART_CATEGORY_LABELS: Record<ClipArtCategory, string> = {
  stickers: "Stickers",
  "clip-art": "Clip art",
  gifs: "GIFs",
};

function t(id: string, label: string, group: ClipArtGroup, tags?: string[]): SiteClipArtItem {
  return { id, label, group, src: `clip-art/topics/${id}.svg`, tags };
}

/** Built-in site clip art, stickers, and animated elements shipped with Study Haul. */
export const SITE_CLIP_ART: SiteClipArtItem[] = [
  // Stickers
  { id: "star", label: "Star", group: "stickers", src: "clip-art/star.svg", tags: ["sparkle"] },
  { id: "heart", label: "Heart", group: "stickers", src: "clip-art/heart.svg", tags: ["love"] },
  { id: "check", label: "Check", group: "stickers", src: "clip-art/check.svg", tags: ["done"] },
  { id: "coffee", label: "Coffee", group: "stickers", src: "clip-art/coffee.svg", tags: ["break"] },
  { id: "trophy", label: "Trophy", group: "stickers", src: "clip-art/trophy.svg", tags: ["win"] },
  { id: "smiley", label: "Smiley", group: "stickers", src: "clip-art/smiley.svg", tags: ["happy"] },
  { id: "fire", label: "Fire", group: "stickers", src: "clip-art/fire.svg", tags: ["streak"] },
  { id: "thumbs-up", label: "Thumbs up", group: "stickers", src: "clip-art/thumbs-up.svg" },
  { id: "rainbow", label: "Rainbow", group: "stickers", src: "clip-art/rainbow.svg" },
  { id: "moon", label: "Moon", group: "stickers", src: "clip-art/moon.svg" },
  { id: "sun", label: "Sun", group: "stickers", src: "clip-art/sun.svg" },
  { id: "bookmark", label: "Bookmark", group: "stickers", src: "clip-art/bookmark.svg" },
  { id: "pushpin", label: "Push pin", group: "stickers", src: "clip-art/pushpin.svg" },
  { id: "clock", label: "Clock", group: "stickers", src: "clip-art/clock.svg" },
  { id: "exclamation", label: "Important", group: "stickers", src: "clip-art/exclamation.svg" },
  { id: "question", label: "Question", group: "stickers", src: "clip-art/question.svg" },
  { id: "cupcake", label: "Cupcake", group: "stickers", src: "clip-art/cupcake.svg" },
  { id: "flag", label: "Flag", group: "stickers", src: "clip-art/flag.svg" },

  // Decorative
  t("flower", "Flower", "decorative"),
  t("butterfly", "Butterfly", "decorative"),
  t("cloud-deco", "Cloud", "decorative"),
  t("snowflake", "Snowflake", "decorative"),
  t("diamond", "Diamond", "decorative"),
  t("star-burst", "Star burst", "decorative"),
  { id: "rainbow-deco", label: "Rainbow arc", group: "decorative", src: "clip-art/rainbow.svg" },

  // Expressive
  t("cool", "Cool", "expressive"),
  t("cry", "Cry", "expressive"),
  t("laugh", "Laugh", "expressive"),
  t("wow", "Wow", "expressive"),
  t("nervous", "Nervous", "expressive"),
  t("love-eyes", "Love", "expressive"),
  t("sleepy", "Sleepy", "expressive"),
  t("angry", "Angry", "expressive"),

  // Math
  t("pi", "Pi", "math"),
  t("sigma", "Sigma", "math"),
  t("plus-minus", "Plus/minus", "math"),
  t("divide", "Divide", "math"),
  t("equals", "Equals", "math"),
  t("percent", "Percent", "math"),
  t("infinity", "Infinity", "math"),
  t("graph", "Graph", "math"),
  t("triangle", "Triangle", "math"),
  t("cube", "Cube", "math"),
  { id: "calculator", label: "Calculator", group: "math", src: "clip-art/calculator.svg" },
  { id: "ruler", label: "Ruler", group: "math", src: "clip-art/ruler.svg" },

  // Science
  t("atom", "Atom", "science"),
  t("dna", "DNA", "science"),
  t("flask", "Flask", "science"),
  t("magnet", "Magnet", "science"),
  t("beaker", "Beaker", "science"),
  t("telescope", "Telescope", "science"),
  t("planet", "Planet", "science"),
  t("leaf", "Leaf", "science"),
  { id: "microscope", label: "Microscope", group: "science", src: "clip-art/microscope.svg" },
  { id: "globe", label: "Globe", group: "science", src: "clip-art/globe.svg" },
  { id: "lightbulb", label: "Idea", group: "science", src: "clip-art/lightbulb.svg" },

  // Anatomy
  t("heart-organ", "Heart", "anatomy"),
  t("brain", "Brain", "anatomy"),
  t("bone", "Bone", "anatomy"),
  t("lung", "Lungs", "anatomy"),
  t("eye", "Eye", "anatomy"),
  t("ear", "Ear", "anatomy"),
  t("tooth", "Tooth", "anatomy"),
  t("hand", "Hand", "anatomy"),

  // History
  t("scroll", "Scroll", "history"),
  t("pillar", "Column", "history"),
  t("compass", "Compass", "history"),
  t("hourglass", "Hourglass", "history"),
  t("crown", "Crown", "history"),
  t("shield", "Shield", "history"),
  t("quill", "Quill", "history"),
  { id: "flag-history", label: "Flag", group: "history", src: "clip-art/flag.svg" },

  // Language
  t("abc", "ABC", "language"),
  t("translate", "Translate", "language"),
  t("quotes", "Quotes", "language"),
  t("dictionary", "Dictionary", "language"),
  t("paragraph", "Paragraph", "language"),
  t("dialogue", "Dialogue", "language"),
  { id: "book-lang", label: "Book", group: "language", src: "clip-art/book.svg" },
  { id: "speech-bubble", label: "Speech", group: "language", src: "clip-art/speech-bubble.svg" },

  // Arts
  t("palette-art", "Palette", "arts"),
  t("paintbrush", "Brush", "arts"),
  t("camera", "Camera", "arts"),
  t("masks", "Theater", "arts"),
  t("violin", "Violin", "arts"),
  t("film", "Film", "arts"),
  { id: "pencil-art", label: "Pencil", group: "arts", src: "clip-art/pencil.svg" },

  // Study
  t("desk-lamp", "Desk lamp", "study"),
  t("highlighter", "Highlighter", "study"),
  t("checklist", "Checklist", "study"),
  t("school-bell", "School bell", "study"),
  t("eraser", "Eraser", "study"),
  t("index-card", "Index card", "study"),
  { id: "book", label: "Book", group: "study", src: "clip-art/book.svg" },
  { id: "notebook", label: "Notebook", group: "study", src: "clip-art/notebook.svg" },
  { id: "grad-cap", label: "Grad cap", group: "study", src: "clip-art/grad-cap.svg" },
  { id: "backpack", label: "Backpack", group: "study", src: "clip-art/backpack.svg" },
  { id: "chart", label: "Chart", group: "study", src: "clip-art/chart.svg" },
  { id: "calendar-study", label: "Calendar", group: "study", src: "clip-art/calendar.svg" },

  // Tech
  t("code", "Code", "tech"),
  t("chip", "Chip", "tech"),
  t("wifi", "Wi‑Fi", "tech"),
  t("keyboard", "Keyboard", "tech"),
  { id: "laptop", label: "Laptop", group: "tech", src: "clip-art/laptop.svg" },
  { id: "link", label: "Link", group: "tech", src: "clip-art/link.svg" },
  { id: "folder", label: "Folder", group: "tech", src: "clip-art/folder.svg" },
  { id: "envelope", label: "Email", group: "tech", src: "clip-art/envelope.svg" },
  { id: "lock", label: "Lock", group: "tech", src: "clip-art/lock.svg" },
  { id: "stopwatch", label: "Stopwatch", group: "tech", src: "clip-art/stopwatch.svg" },
  { id: "magnifier", label: "Search", group: "tech", src: "clip-art/magnifier.svg" },
  { id: "arrow", label: "Arrow", group: "tech", src: "clip-art/arrow.svg" },

  // Planning & reminders (Elements)
  t("alarm-clock", "Alarm clock", "study", ["alarm", "timer", "reminder", "wake"]),
  t("callout-burst", "Callout burst", "study", ["burst", "emphasis", "highlight", "callout"]),
  t("megaphone", "Megaphone", "study", ["alert", "announce", "loud"]),
  t("target", "Target", "study", ["goal", "aim", "focus", "planning"]),
  t("clipboard", "Clipboard", "study", ["checklist", "tasks", "planning"]),
  t("puzzle-piece", "Puzzle piece", "study", ["psychology", "mind", "cognitive"]),

  // Animated
  { id: "sparkle", label: "Sparkle", group: "animated", src: "clip-art/sparkle.svg" },
  { id: "music", label: "Music", group: "animated", src: "clip-art/music.svg" },
  { id: "pulse-heart", label: "Pulse heart", group: "animated", src: "clip-art/pulse-heart.svg" },
  { id: "loading-dots", label: "Loading", group: "animated", src: "clip-art/loading-dots.svg" },
  { id: "spinner", label: "Spinner", group: "animated", src: "clip-art/spinner.svg" },
  { id: "bell", label: "Bell", group: "animated", src: "clip-art/bell.svg" },
  { id: "bounce-arrow", label: "Play arrow", group: "animated", src: "clip-art/bounce-arrow.svg" },
  { id: "typing", label: "Typing", group: "animated", src: "clip-art/typing.svg" },
  { id: "confetti", label: "Confetti", group: "animated", src: "clip-art/confetti.svg" },
  { id: "wiggle-star", label: "Wiggle star", group: "animated", src: "clip-art/wiggle-star.svg" },
  { id: "glow-star", label: "Glow star", group: "animated", src: "clip-art/glow-star.svg" },
  { id: "check-pop", label: "Check pop", group: "animated", src: "clip-art/check-pop.svg" },
];

export const CLIP_ART_GROUPS: ClipArtGroup[] = [
  "stickers",
  "decorative",
  "expressive",
  "math",
  "science",
  "anatomy",
  "history",
  "language",
  "arts",
  "study",
  "tech",
  "animated",
];

export function siteClipArtSrc(item: SiteClipArtItem): string {
  return `/${item.src}`;
}

export function isSiteAssetId(assetId: string): boolean {
  return assetId.startsWith("site/");
}

export function resolvePageImageSrc(assetId: string): string {
  if (isSiteAssetId(assetId)) {
    return `/${assetId.slice("site/".length)}`;
  }
  return `/api/customization/templates/${assetId}`;
}

export function toSiteAssetId(item: SiteClipArtItem): string {
  return `site/${item.src}`;
}
