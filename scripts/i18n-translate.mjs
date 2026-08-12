import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import process from "node:process";
import { setTimeout as sleep } from "node:timers/promises";
import YAML from "yaml";
import { parseContentFile } from "./lib/i18n-sync.mjs";

/* global fetch */

const values = new Map();
process.argv.slice(2).forEach((argument) => {
  const match = argument.match(/^--([^=]+)=(.*)$/u);
  if (match) values.set(match[1], match[2]);
});
const sourcePath = values.get("source");
const targetPath = values.get("target");
const provider = values.get("provider") ?? "google-draft";
if (!sourcePath || !targetPath) {
  console.error(
    "Usage: node scripts/i18n-translate.mjs --source=<zh.md> --target=<en.md> [--provider=google-draft]",
  );
  process.exit(2);
}
if (provider !== "google-draft") {
  console.error(`Unsupported translation provider: ${provider}`);
  process.exit(2);
}

const source = parseContentFile(sourcePath);
async function translateText(text) {
  if (!text.trim() || !/[\u3400-\u9fff]/u.test(text)) return text;
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "zh-CN");
  url.searchParams.set("tl", "en");
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", text);
  let lastError;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { accept: "application/json" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      return payload[0].map((segment) => segment[0]).join("");
    } catch (error) {
      lastError = error;
      if (attempt < 5) await sleep(attempt * 600);
    }
  }
  throw new Error(`Translation failed after retries: ${lastError?.message}`);
}

function freeze(text) {
  const protectedValues = [];
  const patterns = [
    /`+[^`\n]+?`+/gu,
    /\$(?!\s)[^$\n]+?\$/gu,
    /https?:\/\/[^\s)>"']+/gu,
    /<\/?[A-Z][^>]*>/gu,
    /\{#[\w-]+\}/gu,
    /data-[\w-]+=["'][^"']+["']/gu,
    /(?<![\p{L}\p{N}_])[-+]?(?:\d+(?:,\d{3})*(?:\.\d+)?|\.\d+)(?:e[-+]?\d+)?%?(?![\p{L}\p{N}_])/giu,
  ];
  let frozen = text;
  patterns.forEach((pattern) => {
    frozen = frozen.replace(pattern, (value) => {
      const token = `__I18N_PROTECTED_${String(protectedValues.length).padStart(4, "0")}__`;
      protectedValues.push(value);
      return token;
    });
  });
  return {
    frozen,
    restore(translated) {
      let restored = translated;
      protectedValues.forEach((value, index) => {
        const token = `__I18N_PROTECTED_${String(index).padStart(4, "0")}__`;
        restored = restored.replaceAll(token, value);
      });
      const unresolved = restored.match(/__I18N_PROTECTED_\d+__/gu);
      if (unresolved)
        throw new Error(`Unresolved protected tokens: ${unresolved.join(", ")}`);
      return restored;
    },
  };
}

async function translateProtected(text) {
  const protection = freeze(text);
  return protection.restore(await translateText(protection.frozen));
}

function isFence(line) {
  return line.match(/^\s*(```+|~~~+)/u)?.[1] ?? null;
}

async function translateTableRow(line) {
  if (/^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*$/u.test(line)) return line;
  const cells = line.split("|");
  const translated = await Promise.all(cells.map((cell) => translateProtected(cell)));
  return translated.join("|");
}

async function translateBody(body) {
  const lines = body.replace(/\r\n?/gu, "\n").split("\n");
  const units = [];
  let paragraph = [];
  let fence = null;
  let mathEnd = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    units.push({ type: "translate", value: paragraph.join(" ") });
    paragraph = [];
  };

  lines.forEach((line) => {
    if (fence) {
      units.push({ type: "protected", value: line });
      if (line.trimStart().startsWith(fence)) fence = null;
      return;
    }
    if (mathEnd) {
      units.push({ type: "protected", value: line });
      if (line.trimEnd().endsWith(mathEnd)) mathEnd = null;
      return;
    }
    const fenceMarker = isFence(line);
    if (fenceMarker) {
      flushParagraph();
      fence = fenceMarker;
      units.push({ type: "protected", value: line });
      return;
    }
    const trimmed = line.trim();
    if (trimmed.startsWith("$$") || trimmed.startsWith("\\[")) {
      flushParagraph();
      const end = trimmed.startsWith("$$") ? "$$" : "\\]";
      if (!(trimmed.length > 2 && trimmed.endsWith(end))) mathEnd = end;
      units.push({ type: "protected", value: line });
      return;
    }
    if (!trimmed) {
      flushParagraph();
      units.push({ type: "blank", value: "" });
      return;
    }
    if (/^\s*<[A-Z][\w.-]*\b/u.test(line)) {
      flushParagraph();
      units.push({ type: "protected", value: line });
      return;
    }
    const heading = line.match(/^(#{1,6}\s+)(.*)$/u);
    if (heading) {
      flushParagraph();
      units.push({ type: "prefixed", prefix: heading[1], value: heading[2] });
      return;
    }
    const list = line.match(/^(\s*(?:[-*+]|\d+[.)]|>)\s+)(.*)$/u);
    if (list) {
      flushParagraph();
      units.push({ type: "prefixed", prefix: list[1], value: list[2] });
      return;
    }
    if (trimmed.includes("|") && /^\s*\|/u.test(line)) {
      flushParagraph();
      units.push({ type: "table", value: line });
      return;
    }
    paragraph.push(trimmed);
  });
  flushParagraph();

  const results = new Array(units.length);
  let cursor = 0;
  const workers = Array.from({ length: 6 }, async () => {
    while (cursor < units.length) {
      const index = cursor;
      cursor += 1;
      const unit = units[index];
      if (["protected", "blank"].includes(unit.type)) results[index] = unit.value;
      else if (unit.type === "table")
        results[index] = await translateTableRow(unit.value);
      else {
        const translated = await translateProtected(unit.value);
        results[index] = `${unit.prefix ?? ""}${translated}`;
      }
    }
  });
  await Promise.all(workers);
  return results
    .join("\n")
    .replace(/\n{3,}/gu, "\n\n")
    .trimEnd();
}

async function translateMetadata(frontmatter) {
  const translated = { ...frontmatter };
  translated.locale = "en";
  translated.slug = frontmatter.slug;
  translated.isPlaceholder = false;
  for (const field of ["title", "summary", "series"]) {
    if (typeof frontmatter[field] === "string") {
      translated[field] = await translateProtected(frontmatter[field]);
    }
  }
  for (const field of ["tags", "topics"]) {
    if (Array.isArray(frontmatter[field])) {
      translated[field] = await Promise.all(
        frontmatter[field].map((value) => translateProtected(String(value))),
      );
    }
  }
  return translated;
}

const [frontmatter, body] = await Promise.all([
  translateMetadata(source.frontmatter),
  translateBody(source.body),
]);
const output = `---\n${YAML.stringify(frontmatter, { lineWidth: 0 }).trimEnd()}\n---\n\n${body}\n`;
mkdirSync(dirname(targetPath), { recursive: true });
writeFileSync(targetPath, output);
console.log(`Drafted ${targetPath} from ${sourcePath} using ${provider}.`);
