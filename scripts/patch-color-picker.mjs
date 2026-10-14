import fs from "node:fs";
import path from "node:path";

const filePath = path.resolve(
  import.meta.dirname,
  "../src/components/customization/ColorPicker.tsx",
);
let content = fs.readFileSync(filePath, "utf8");
if (content.includes("function ColorSwatchRow")) {
  console.log("ColorSwatchRow already present");
  process.exit(0);
}

const insert = `function ColorSwatchRow({
  colors,
  value,
  removable,
  onRemove,
  onPick,
}: {
  colors: string[];
  value: string;
  removable?: boolean;
  onRemove?: (color: string) => void;
  onPick: (color: string, parsedHsl: Hsl | null) => void;
}) {
  if (colors.length === 0) {
    return <p className="text-xs text-stone-400">No colors yet.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((color) => (
        <div key={color} className="relative">
          <button
            type="button"
            title={color}
            onClick={() => onPick(color, hexToHsl(color))}
            className={\`h-8 w-8 rounded-full border-2 transition hover:scale-105 \${
              value === color ? "border-stone-900" : "border-white shadow"
            }\`}
            style={{ backgroundColor: color }}
          />
          {removable && onRemove ? (
            <button
              type="button"
              onClick={() => onRemove(color)}
              className="absolute -right-1 -top-1 rounded-full bg-white p-0.5 shadow"
              aria-label="Remove"
            >
              <X className="h-2.5 w-2.5 text-stone-500" />
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

`;

content = content.replace(
  'type Tab = "picker" | "recent" | "favorites";\n\nexport function ColorPicker',
  `type Tab = "picker" | "recent" | "favorites";\n\n${insert}export function ColorPicker`,
);

fs.writeFileSync(filePath, content);
console.log("patched ColorPicker");
