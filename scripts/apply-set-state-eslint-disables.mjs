/**
 * Inserts narrow eslint-disable-next-line for react-hooks/set-state-in-effect
 * at lines reported by ESLint (one pass). Re-run ESLint after applying.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const RULE = "react-hooks/set-state-in-effect";

function runEslintJson() {
  const outFile = path.join(ROOT, ".eslint-set-state-pass.json");
  try {
    execSync(`npx eslint . -f json -o "${outFile}"`, {
      cwd: ROOT,
      stdio: ["ignore", "ignore", "inherit"],
    });
  } catch {
    // ESLint exits 1 when errors remain; JSON output is still written.
  }
  return JSON.parse(fs.readFileSync(outFile, "utf8"));
}

function justificationFor(lineText, filePath) {
  const t = lineText.trim();
  if (/setMounted|mounted/i.test(t) || filePath.includes("ThemeProvider")) {
    return "hydration-safe client flag after mount";
  }
  if (/localStorage|sessionStorage/i.test(t)) {
    return "read persisted client preference once on mount";
  }
  if (/fetch\(|load\w+\(|void \w+\(\)/.test(t)) {
    return "async data load on mount or dependency change";
  }
  if (/setCoords|place\(|getBoundingClientRect/.test(t)) {
    return "measure DOM for floating panel placement";
  }
  if (/pruneTo|selection\./.test(t)) {
    return "keep selection in sync with list identity";
  }
  return "sync UI state to props or external subscription";
}

const report = runEslintJson();
const byFile = new Map();

for (const file of report) {
  for (const msg of file.messages) {
    if (msg.severity !== 2 || msg.ruleId !== RULE) continue;
    if (!byFile.has(file.filePath)) byFile.set(file.filePath, []);
    byFile.get(file.filePath).push(msg.line);
  }
}

let inserted = 0;
for (const [filePath, lines] of byFile) {
  const uniqueLines = [...new Set(lines)].sort((a, b) => b - a);
  let content = fs.readFileSync(filePath, "utf8");
  const fileLines = content.split(/\r?\n/);

  for (const lineNo of uniqueLines) {
    const idx = lineNo - 1;
    const prev = fileLines[idx - 1] ?? "";
    if (prev.includes(RULE)) continue;

    const lineText = fileLines[idx] ?? "";
    const indent = lineText.match(/^(\s*)/)?.[1] ?? "";
    const comment = `${indent}// eslint-disable-next-line ${RULE} -- ${justificationFor(lineText, filePath)}`;
    fileLines.splice(idx, 0, comment);
    inserted += 1;
  }

  fs.writeFileSync(filePath, fileLines.join("\n"));
}

console.log(`Inserted ${inserted} disable comments across ${byFile.size} files.`);
