import type { BuiltinPalette, PaletteCategory } from "./types";

function bp(
  id: string,
  name: string,
  categoryId: string,
  colors: string[],
): BuiltinPalette {
  return { id, name, colors, categoryId, builtin: true };
}

export const PALETTE_CATEGORIES: PaletteCategory[] = [
  { id: "seasonal-autumn", name: "Autumn", group: "seasonal" },
  { id: "seasonal-winter", name: "Winter", group: "seasonal" },
  { id: "seasonal-spring", name: "Spring", group: "seasonal" },
  { id: "seasonal-summer", name: "Summer", group: "seasonal" },
  { id: "mood-soft", name: "Soft & Cozy", group: "mood" },
  { id: "mood-academia", name: "Academia", group: "mood" },
  { id: "mood-playful", name: "Playful", group: "mood" },
  { id: "mood-elegant", name: "Elegant", group: "mood" },
  { id: "family-pink", name: "Pink", group: "family" },
  { id: "family-purple", name: "Purple", group: "family" },
  { id: "family-blue", name: "Blue", group: "family" },
  { id: "family-green", name: "Green", group: "family" },
  { id: "family-warm", name: "Warm tones", group: "family" },
  { id: "family-neutral", name: "Neutral", group: "family" },
  { id: "academic-study", name: "Study", group: "academic" },
  { id: "academic-subjects", name: "Subjects", group: "academic" },
  { id: "special-neon", name: "Neon & Vibrant", group: "special" },
  { id: "special-pastel", name: "Pastel", group: "special" },
  { id: "special-jewel", name: "Jewel tones", group: "special" },
  { id: "special-mono", name: "Monochrome", group: "special" },
];

export const BUILTIN_PALETTES: BuiltinPalette[] = [
  // Autumn
  bp("fall-classic", "Fall Classic", "seasonal-autumn", ["#8B4513", "#D2691E", "#CD853F", "#F4A460", "#2F1B0C"]),
  bp("cozy-autumn", "Cozy Autumn", "seasonal-autumn", ["#6B3E26", "#A0522D", "#C67B4E", "#E8C4A0", "#3D2314"]),
  bp("pumpkin-spice", "Pumpkin Spice", "seasonal-autumn", ["#E67E22", "#D35400", "#F39C12", "#F5CBA7", "#5D4037"]),
  bp("autumn-leaves", "Autumn Leaves", "seasonal-autumn", ["#C0392B", "#E74C3C", "#F39C12", "#F1C40F", "#7D6608"]),
  bp("dark-fall", "Dark Fall", "seasonal-autumn", ["#1A120B", "#3E2723", "#5D4037", "#8D6E63", "#BCAAA4"]),
  bp("warm-harvest", "Warm Harvest", "seasonal-autumn", ["#BF360C", "#E65100", "#FF8F00", "#FFB74D", "#4E342E"]),
  bp("september", "September", "seasonal-autumn", ["#5D4E37", "#8B7355", "#C4A77D", "#E8D5B7", "#2C2416"]),
  bp("october", "October", "seasonal-autumn", ["#B7410E", "#D84315", "#FF6F00", "#FFAB40", "#3E2723"]),
  bp("november", "November", "seasonal-autumn", ["#4A3728", "#6D4C41", "#A1887F", "#D7CCC8", "#1B0F0A"]),
  bp("cinnamon-coffee", "Cinnamon & Coffee", "seasonal-autumn", ["#3E2723", "#5D4037", "#8D6E63", "#D7CCC8", "#A1887F"]),
  // Winter
  bp("winter-frost", "Winter Frost", "seasonal-winter", ["#E3F2FD", "#BBDEFB", "#90CAF9", "#64B5F6", "#1A237E"]),
  bp("snow-day", "Snow Day", "seasonal-winter", ["#FAFAFA", "#ECEFF1", "#CFD8DC", "#90A4AE", "#37474F"]),
  bp("cozy-winter", "Cozy Winter", "seasonal-winter", ["#263238", "#455A64", "#78909C", "#B0BEC5", "#ECEFF1"]),
  bp("midnight-winter", "Midnight Winter", "seasonal-winter", ["#0D1B2A", "#1B263B", "#415A77", "#778DA9", "#E0E1DD"]),
  bp("ice-blue", "Ice Blue", "seasonal-winter", ["#E0F7FA", "#B2EBF2", "#4DD0E1", "#0097A7", "#006064"]),
  bp("winter-forest", "Winter Forest", "seasonal-winter", ["#1B4332", "#2D6A4F", "#40916C", "#95D5B2", "#D8F3DC"]),
  bp("holiday-lights", "Holiday Lights", "seasonal-winter", ["#C62828", "#2E7D32", "#F9A825", "#1565C0", "#F5F5F5"]),
  bp("december", "December", "seasonal-winter", ["#1A237E", "#283593", "#3949AB", "#7986CB", "#C5CAE9"]),
  bp("january", "January", "seasonal-winter", ["#ECEFF1", "#B0BEC5", "#78909C", "#546E7A", "#263238"]),
  bp("february", "February", "seasonal-winter", ["#F8BBD0", "#F48FB1", "#EC407A", "#AD1457", "#880E4F"]),
  // Spring
  bp("fresh-spring", "Fresh Spring", "seasonal-spring", ["#C8E6C9", "#A5D6A7", "#66BB6A", "#43A047", "#1B5E20"]),
  bp("cherry-blossom", "Cherry Blossom", "seasonal-spring", ["#FCE4EC", "#F8BBD0", "#F48FB1", "#EC407A", "#880E4F"]),
  bp("april-showers", "April Showers", "seasonal-spring", ["#E1F5FE", "#B3E5FC", "#4FC3F7", "#0288D1", "#01579B"]),
  bp("garden-party", "Garden Party", "seasonal-spring", ["#FFF9C4", "#F0F4C3", "#C5E1A5", "#AED581", "#689F38"]),
  bp("pastel-spring", "Pastel Spring", "seasonal-spring", ["#FFF3E0", "#F3E5F5", "#E8F5E9", "#E3F2FD", "#FCE4EC"]),
  // Summer
  bp("beach-day", "Beach Day", "seasonal-summer", ["#FFF8E1", "#FFECB3", "#FFD54F", "#4FC3F7", "#0277BD"]),
  bp("sunset-glow", "Sunset Glow", "seasonal-summer", ["#FF6F00", "#FF8F00", "#FFAB40", "#E65100", "#4A148C"]),
  bp("tropical", "Tropical", "seasonal-summer", ["#00BFA5", "#00E676", "#FFEA00", "#FF6D00", "#D500F9"]),
  bp("poolside", "Poolside", "seasonal-summer", ["#E0F7FA", "#00BCD4", "#0097A7", "#FF7043", "#FBE9E7"]),
  bp("summer-berry", "Summer Berry", "seasonal-summer", ["#F48FB1", "#EC407A", "#AB47BC", "#7B1FA2", "#4A148C"]),
  // Mood
  bp("soft-blush", "Soft Blush", "mood-soft", ["#FFF5F5", "#FED7D7", "#FEB2B2", "#FC8181", "#9B2C2C"]),
  bp("cozy-cabin", "Cozy Cabin", "mood-soft", ["#3E2723", "#5D4037", "#8D6E63", "#D7CCC8", "#EFEBE9"]),
  bp("calm-mist", "Calm Mist", "mood-soft", ["#ECEFF1", "#CFD8DC", "#B0BEC5", "#78909C", "#455A64"]),
  bp("dreamy-lavender", "Dreamy Lavender", "mood-soft", ["#F3E5F5", "#E1BEE7", "#CE93D8", "#AB47BC", "#6A1B9A"]),
  bp("romantic-rose", "Romantic Rose", "mood-soft", ["#FCE4EC", "#F8BBD0", "#F06292", "#C2185B", "#880E4F"]),
  bp("dark-academia", "Dark Academia", "mood-academia", ["#1C1917", "#292524", "#44403C", "#78716C", "#D6D3D1"]),
  bp("light-academia", "Light Academia", "mood-academia", ["#FFFBEB", "#FEF3C7", "#D6D3D1", "#A8A29E", "#57534E"]),
  bp("library-study", "Library Study", "mood-academia", ["#3E2723", "#5D4037", "#8D6E63", "#FFF8E1", "#F5F5DC"]),
  bp("whimsical", "Whimsical", "mood-playful", ["#FDE68A", "#F9A8D4", "#A5F3FC", "#C4B5FD", "#86EFAC"]),
  bp("retro-pop", "Retro Pop", "mood-playful", ["#FF6B6B", "#FFE66D", "#4ECDC4", "#45B7D1", "#96CEB4"]),
  bp("y2k", "Y2K", "mood-playful", ["#FF00FF", "#00FFFF", "#FFFF00", "#FF69B4", "#7B68EE"]),
  bp("cottagecore", "Cottagecore", "mood-elegant", ["#F5F0E8", "#D4C4A8", "#8B7355", "#6B8E23", "#556B2F"]),
  bp("celestial", "Celestial", "mood-elegant", ["#0F0C29", "#302B63", "#24243E", "#C9B1FF", "#E0E7FF"]),
  bp("botanical", "Botanical", "mood-elegant", ["#1B4332", "#40916C", "#95D5B2", "#F4F1DE", "#E07A5F"]),
  bp("minimal-clean", "Minimal Clean", "mood-elegant", ["#FFFFFF", "#F5F5F5", "#E5E5E5", "#A3A3A3", "#171717"]),
  // Color families
  bp("pink-dream", "Pink Dream", "family-pink", ["#FCE4EC", "#F48FB1", "#EC407A", "#C2185B", "#880E4F"]),
  bp("blush-rose", "Blush Rose", "family-pink", ["#FFF0F3", "#FFB3C1", "#FF8FAB", "#FB6F92", "#C9184A"]),
  bp("purple-haze", "Purple Haze", "family-purple", ["#F3E5F5", "#CE93D8", "#AB47BC", "#7B1FA2", "#4A148C"]),
  bp("violet-night", "Violet Night", "family-purple", ["#1A0A2E", "#3D1A78", "#6B2FA0", "#9B59B6", "#D7BDE2"]),
  bp("ocean-blue", "Ocean Blue", "family-blue", ["#E3F2FD", "#64B5F6", "#1976D2", "#0D47A1", "#01579B"]),
  bp("sky-azure", "Sky Azure", "family-blue", ["#E0F7FA", "#4DD0E1", "#00ACC1", "#00838F", "#006064"]),
  bp("forest-green", "Forest Green", "family-green", ["#E8F5E9", "#66BB6A", "#2E7D32", "#1B5E20", "#0D3B1E"]),
  bp("sage-mint", "Sage Mint", "family-green", ["#F1F8E9", "#AED581", "#7CB342", "#558B2F", "#33691E"]),
  bp("sunset-warm", "Sunset Warm", "family-warm", ["#FF6B35", "#F7931E", "#FDC830", "#F37335", "#C73E1D"]),
  bp("earth-tones", "Earth Tones", "family-warm", ["#8D6E63", "#A1887F", "#BCAAA4", "#D7CCC8", "#5D4037"]),
  bp("stone-neutral", "Stone Neutral", "family-neutral", ["#FAFAF9", "#E7E5E4", "#A8A29E", "#78716C", "#44403C"]),
  bp("warm-gray", "Warm Gray", "family-neutral", ["#F5F5F4", "#D6D3D1", "#A8A29E", "#57534E", "#292524"]),
  // Academic
  bp("focus-mode", "Focus Mode", "academic-study", ["#1E293B", "#334155", "#64748B", "#94A3B8", "#F8FAFC"]),
  bp("high-contrast", "High Contrast", "academic-study", ["#000000", "#FFFFFF", "#FF0000", "#0000FF", "#FFFF00"]),
  bp("minimal-academic", "Minimal Academic", "academic-study", ["#FFFFFF", "#F1F5F9", "#CBD5E1", "#475569", "#0F172A"]),
  bp("math-blue", "Mathematics", "academic-subjects", ["#1E3A8A", "#3B82F6", "#93C5FD", "#DBEAFE", "#1E40AF"]),
  bp("cs-terminal", "Computer Science", "academic-subjects", ["#0D1117", "#238636", "#58A6FF", "#F78166", "#C9D1D9"]),
  bp("psychology", "Psychology", "academic-subjects", ["#7C3AED", "#A78BFA", "#DDD6FE", "#F5F3FF", "#5B21B6"]),
  bp("biology", "Biology", "academic-subjects", ["#14532D", "#22C55E", "#86EFAC", "#DCFCE7", "#166534"]),
  bp("history", "History", "academic-subjects", ["#78350F", "#D97706", "#FDE68A", "#FFFBEB", "#92400E"]),
  bp("professional", "Professional", "academic-subjects", ["#1F2937", "#374151", "#6B7280", "#D1D5DB", "#F9FAFB"]),
  // Special
  bp("neon-nights", "Neon Nights", "special-neon", ["#FF00FF", "#00FFFF", "#FFFF00", "#FF0080", "#00FF80"]),
  bp("vibrant-pop", "Vibrant Pop", "special-neon", ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6"]),
  bp("pastel-candy", "Pastel Candy", "special-pastel", ["#FECDD3", "#FDE68A", "#BBF7D0", "#BFDBFE", "#E9D5FF"]),
  bp("pastel-cloud", "Pastel Cloud", "special-pastel", ["#FFF1F2", "#FFFBEB", "#F0FDF4", "#EFF6FF", "#FAF5FF"]),
  bp("jewel-emerald", "Emerald Jewel", "special-jewel", ["#064E3B", "#059669", "#34D399", "#A7F3D0", "#D1FAE5"]),
  bp("jewel-ruby", "Ruby Jewel", "special-jewel", ["#7F1D1D", "#DC2626", "#F87171", "#FECACA", "#FEE2E2"]),
  bp("jewel-sapphire", "Sapphire Jewel", "special-jewel", ["#1E3A8A", "#2563EB", "#60A5FA", "#BFDBFE", "#DBEAFE"]),
  bp("mono-charcoal", "Charcoal Mono", "special-mono", ["#000000", "#262626", "#525252", "#A3A3A3", "#FAFAFA"]),
  bp("mono-warm", "Warm Mono", "special-mono", ["#1C1917", "#44403C", "#78716C", "#D6D3D1", "#FAFAF9"]),
  bp("rainbow-bright", "Rainbow", "special-neon", ["#EF4444", "#F97316", "#EAB308", "#22C55E", "#3B82F6", "#A855F7"]),
];

export function getBuiltinPalette(id: string): BuiltinPalette | undefined {
  return BUILTIN_PALETTES.find((p) => p.id === id);
}

export function getPalettesByCategory(categoryId: string): BuiltinPalette[] {
  return BUILTIN_PALETTES.filter((p) => p.categoryId === categoryId);
}

export function getAllPalettes(userPalettes: BuiltinPalette[] | import("./types").UserPalette[] = []) {
  return [...BUILTIN_PALETTES, ...userPalettes.filter((p) => !("builtin" in p && p.builtin))];
}
