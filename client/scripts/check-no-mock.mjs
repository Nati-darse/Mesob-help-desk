import fs from "fs";
import path from "path";

const ROOT = path.resolve(process.cwd(), "..");
const TARGETS = [
  path.join(ROOT, "client", "src"),
  path.join(ROOT, "server", "src"),
];

const PATTERNS = [
  /mock/gi,
  /demo/gi,
  /sample/gi,
  /dummy/gi,
  /fake/gi,
  /lorem/gi,
  /ipsum/gi,
  /hardcoded/gi,
  /placeholder/gi,
];

const TEXT_EXT = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".json",
  ".md",
  ".css",
  ".scss",
  ".yml",
  ".yaml",
]);

const IGNORE_DIRS = new Set(["node_modules", "dist", "build", ".git"]);

function isTextFile(filePath) {
  return TEXT_EXT.has(path.extname(filePath).toLowerCase());
}

function walk(dir, onFile) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) walk(fullPath, onFile);
      continue;
    }
    if (entry.isFile() && isTextFile(fullPath)) onFile(fullPath);
  }
}

function shouldIgnoreLine(line, pattern) {
  if (pattern.source === "placeholder" && /placeholder\s*=/.test(line)) {
    return true;
  }
  return false;
}

const hits = [];

for (const target of TARGETS) {
  if (!fs.existsSync(target)) continue;
  walk(target, (filePath) => {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const pattern of PATTERNS) {
        pattern.lastIndex = 0;
        if (pattern.test(line) && !shouldIgnoreLine(line, pattern)) {
          hits.push({
            file: filePath,
            line: index + 1,
            text: line.trim(),
            match: pattern.source,
          });
        }
      }
    });
  });
}

if (hits.length) {
  console.error("Mock/data placeholders found:");
  for (const hit of hits) {
    console.error(
      `${hit.file}:${hit.line} [${hit.match}] ${hit.text}`
    );
  }
  process.exit(1);
} else {
  console.log("OK: No mock/demo/sample/fake placeholders found.");
}
