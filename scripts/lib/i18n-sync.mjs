import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { extname, join, relative } from "node:path";
import process from "node:process";
import YAML from "yaml";

const CONTENT_ROOTS = {
  notes: "src/content/notes",
  projects: "src/content/projects",
};

const METADATA_FIELDS = {
  notes: [
    "translationKey",
    "locale",
    "slug",
    "title",
    "summary",
    "tags",
    "topics",
    "tools",
    "series",
    "seriesSlug",
    "order",
    "status",
    "draft",
    "isPlaceholder",
    "relatedProjects",
    "relatedNotes",
  ],
  projects: [
    "translationKey",
    "locale",
    "slug",
    "title",
    "summary",
    "tools",
    "topic",
    "status",
    "featured",
    "tags",
    "isPlaceholder",
    "isDemo",
    "noindex",
  ],
};

const HARD_METADATA_FIELDS = ["translationKey", "seriesSlug", "order"];

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stable(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function parseContentFile(path) {
  const source = readFileSync(path, "utf8").replace(/^\uFEFF/u, "");
  if (!source.startsWith("---\n") && !source.startsWith("---\r\n")) {
    throw new Error(`${path} is missing YAML frontmatter`);
  }
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/u);
  if (!match) throw new Error(`${path} has malformed YAML frontmatter`);
  const frontmatter = YAML.parse(match[1]) ?? {};
  return {
    path: path.replaceAll("\\", "/"),
    source,
    frontmatter,
    body: source.slice(match[0].length),
    rawFrontmatter: match[1],
  };
}

function walkContent(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    if (entry.isDirectory()) return walkContent(path);
    return [".md", ".mdx"].includes(extname(entry.name)) ? [path] : [];
  });
}

export function inventoryContent(cwd = process.cwd()) {
  return Object.entries(CONTENT_ROOTS).flatMap(([collection, root]) =>
    walkContent(join(cwd, root)).map((path) => ({
      collection,
      ...parseContentFile(path),
      path: relative(cwd, path).replaceAll("\\", "/"),
    })),
  );
}

function normaliseCosmetic(value) {
  return value
    .replace(/\r\n?/gu, "\n")
    .replace(/[ \t]+$/gmu, "")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
}

function scanMarkdown(body) {
  const lines = body.replace(/\r\n?/gu, "\n").split("\n");
  const blocks = [];
  let paragraph = [];
  let fence = null;
  let fenceLines = [];
  let math = null;
  let mathLines = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push({ type: "prose", value: paragraph.join("\n") });
    paragraph = [];
  };

  lines.forEach((line) => {
    if (fence) {
      fenceLines.push(line);
      if (line.startsWith(fence.marker)) {
        blocks.push({
          type: "code",
          language: fence.language,
          value: fenceLines.join("\n"),
        });
        fence = null;
        fenceLines = [];
      }
      return;
    }
    const fenceMatch = line.match(/^\s*(```+|~~~+)\s*([^\s]*)?.*$/u);
    if (fenceMatch) {
      flushParagraph();
      fence = { marker: fenceMatch[1], language: fenceMatch[2] ?? "" };
      fenceLines = [line];
      return;
    }
    if (math) {
      mathLines.push(line);
      if (line.trim().endsWith(math.end)) {
        blocks.push({ type: "math", value: mathLines.join("\n") });
        math = null;
        mathLines = [];
      }
      return;
    }
    const trimmed = line.trim();
    if (trimmed.startsWith("$$") || trimmed.startsWith("\\[")) {
      flushParagraph();
      const end = trimmed.startsWith("$$") ? "$$" : "\\]";
      if (trimmed.length > 2 && trimmed.endsWith(end)) {
        blocks.push({ type: "math", value: line });
      } else {
        math = { end };
        mathLines = [line];
      }
      return;
    }
    if (!trimmed) {
      flushParagraph();
      return;
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/u);
    if (heading) {
      flushParagraph();
      blocks.push({ type: "heading", level: heading[1].length, value: heading[2] });
      return;
    }
    if (/^\s*(?:[-*+] |\d+[.)] |> |\|)/u.test(line)) {
      flushParagraph();
      blocks.push({ type: "structured-prose", value: line });
      return;
    }
    if (/^\s*<[A-Z][\w.-]*\b/u.test(line)) {
      flushParagraph();
      blocks.push({ type: "component", value: line });
      return;
    }
    paragraph.push(line);
  });
  flushParagraph();
  if (fence) blocks.push({ type: "code-unclosed", value: fenceLines.join("\n") });
  if (math) blocks.push({ type: "math-unclosed", value: mathLines.join("\n") });
  return blocks;
}

function matches(value, pattern) {
  return [...value.matchAll(pattern)].map((match) => match[1] ?? match[0]);
}

export function protectedTokens(body) {
  const blocks = scanMarkdown(body);
  const prose = blocks
    .filter((block) => !["code", "math"].includes(block.type))
    .map((block) => block.value)
    .join("\n");
  const all = blocks.map((block) => block.value).join("\n");
  return {
    code: blocks.filter((block) => block.type === "code").map((block) => block.value),
    codeLanguages: blocks
      .filter((block) => block.type === "code")
      .map((block) => block.language),
    math: [
      ...blocks.filter((block) => block.type === "math").map((block) => block.value),
      ...matches(prose, /(?<!\\)(\$(?!\s)[^$\n]+?\$)/gu),
    ],
    inlineCode: matches(prose, /(`+[^`\n]+?`+)/gu),
    urls: [
      ...matches(all, /!?(?:\[[^\]]*\])\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/gu),
      ...matches(all, /(?:href|src)=["']([^"']+)["']/gu),
      ...matches(all, /(https?:\/\/[^\s)>"']+)/gu),
    ],
    images: matches(all, /!\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/gu),
    slots: matches(all, /data-learning-(?:slot|block)=["']([^"']+)["']/gu),
    dataAttributes: matches(all, /(data-[\w-]+=["'][^"']+["'])/gu),
    ids: matches(all, /\bid=["']([^"']+)["']/gu),
    components: matches(all, /<([A-Z][\w.-]*)\b/gu),
    numbers: matches(
      prose.replace(/\b(?:h[1-6]|utf-?8)\b/giu, ""),
      /(?<![\p{L}\p{N}_])([-+]?(?:\d+(?:,\d{3})*(?:\.\d+)?|\.\d+)(?:e[-+]?\d+)?%?)(?![\p{L}\p{N}_])/giu,
    ),
  };
}

export function structuralSignature(body) {
  return scanMarkdown(body).flatMap((block) => {
    if (block.type === "heading") return [`heading:${block.level}`];
    if (block.type === "code") return [`code:${block.language}`];
    if (block.type === "math") return ["math"];
    if (block.type === "component") {
      return [`component:${matches(block.value, /<([A-Z][\w.-]*)\b/gu).join(",")}`];
    }
    return [];
  });
}

function translatableContent(body) {
  return scanMarkdown(body)
    .filter((block) => !["code", "math", "component"].includes(block.type))
    .map((block) => block.value)
    .join("\n")
    .replace(/`+[^`\n]+?`+/gu, "<INLINE_CODE>")
    .replace(/https?:\/\/[^\s)>"']+/gu, "<URL>")
    .replace(/[ \t]+/gu, " ")
    .replace(/\n+/gu, "\n")
    .trim();
}

export function contentHashes(file) {
  const metadata = Object.fromEntries(
    (METADATA_FIELDS[file.collection] ?? [])
      .filter((key) => key !== "locale" && key !== "title" && key !== "summary")
      .map((key) => [key, file.frontmatter[key] ?? null]),
  );
  return {
    content: digest(translatableContent(file.body)),
    structure: digest(stable(structuralSignature(file.body))),
    metadata: digest(stable(metadata)),
    protected: digest(stable(protectedTokens(file.body))),
    file: digest(normaliseCosmetic(file.source)),
  };
}

export function classifyChange(previous, current) {
  if (!previous) return "CONTENT_CHANGE";
  if (previous.structure !== current.structure) return "STRUCTURAL_CHANGE";
  if (previous.content !== current.content) return "CONTENT_CHANGE";
  if (previous.metadata !== current.metadata) return "METADATA_CHANGE";
  if (previous.file !== current.file) return "COSMETIC_CHANGE";
  return null;
}

function multisetDifferences(sourceValues, targetValues) {
  const targetCounts = new Map();
  targetValues.forEach((value) =>
    targetCounts.set(value, (targetCounts.get(value) ?? 0) + 1),
  );
  return sourceValues.filter((value) => {
    const count = targetCounts.get(value) ?? 0;
    if (count > 0) {
      targetCounts.set(value, count - 1);
      return false;
    }
    return true;
  });
}

export function validateProtectedPair(source, target) {
  const issues = [];
  HARD_METADATA_FIELDS.forEach((field) => {
    if ((source.frontmatter[field] ?? null) !== (target.frontmatter[field] ?? null)) {
      issues.push({ type: "METADATA_DRIFT", field });
    }
  });
  const sourceTokens = protectedTokens(source.body);
  const targetTokens = protectedTokens(target.body);
  Object.keys(sourceTokens).forEach((type) => {
    const missing = multisetDifferences(sourceTokens[type], targetTokens[type]);
    const added = multisetDifferences(targetTokens[type], sourceTokens[type]);
    if (missing.length || added.length) {
      issues.push({
        type: "PROTECTED_TOKEN_MISMATCH",
        tokenType: type,
        missing,
        added,
      });
    }
  });
  const sourceStructure = structuralSignature(source.body);
  const targetStructure = structuralSignature(target.body);
  if (stable(sourceStructure) !== stable(targetStructure)) {
    issues.push({
      type: "STRUCTURE_MISMATCH",
      source: sourceStructure,
      target: targetStructure,
    });
  }
  return issues;
}

export function pairInventory(files) {
  const pairs = new Map();
  files.forEach((file) => {
    const key = `${file.collection}:${file.frontmatter.translationKey ?? file.path}`;
    if (!pairs.has(key)) pairs.set(key, { key, collection: file.collection });
    const pair = pairs.get(key);
    const locale = file.frontmatter.locale;
    if (!locale) return;
    if (pair[locale]) {
      pair.duplicates = [...(pair.duplicates ?? []), pair[locale].path, file.path];
    }
    pair[locale] = file;
  });
  return [...pairs.values()].sort((left, right) => left.key.localeCompare(right.key));
}

/**
 * @param {any[]} files
 * @param {any} [previousManifest]
 * @param {Set<string>} [acceptedKeys]
 */
export function buildManifest(
  files,
  previousManifest = null,
  acceptedKeys = new Set(),
) {
  const previousByKey = new Map(
    (previousManifest?.entries ?? []).map((entry) => [entry.key, entry]),
  );
  const entries = pairInventory(files).map((pair) => {
    const previous = previousByKey.get(pair.key);
    const source = pair.zh;
    const target = pair.en;
    const currentHashes = source ? contentHashes(source) : null;
    const accepted = acceptedKeys.has(pair.key);
    const baseline =
      !previous || !target || accepted
        ? currentHashes
        : (previous.sourceHashes ?? currentHashes);
    const change = source && baseline ? classifyChange(baseline, currentHashes) : null;
    const integrityIssues =
      source && target ? validateProtectedPair(source, target) : [];
    let status = "SYNCED";
    if (pair.duplicates?.length) status = "DUPLICATE_KEY";
    else if (!source) status = "ORPHAN";
    else if (source.frontmatter.draft || source.frontmatter.status === "draft")
      status = "DRAFT_ONLY";
    else if (!target) status = "MISSING";
    else if (target.frontmatter.isPlaceholder) status = "PLACEHOLDER";
    else if (integrityIssues.some((issue) => issue.type === "METADATA_DRIFT")) {
      status = "METADATA_DRIFT";
    } else if (integrityIssues.some((issue) => issue.type === "STRUCTURE_MISMATCH")) {
      status = "STRUCTURE_MISMATCH";
    } else if (
      integrityIssues.some((issue) => issue.type === "PROTECTED_TOKEN_MISMATCH")
    ) {
      status = "PROTECTED_TOKEN_MISMATCH";
    } else if (change === "STRUCTURAL_CHANGE") status = "STALE_STRUCTURE";
    else if (change === "CONTENT_CHANGE") status = "STALE_CONTENT";
    else if (change === "METADATA_CHANGE") status = "METADATA_DRIFT";

    return {
      key: pair.key,
      collection: pair.collection,
      translationKey:
        source?.frontmatter.translationKey ?? target?.frontmatter.translationKey,
      status,
      change,
      sourcePath: source?.path ?? null,
      targetPath: target?.path ?? null,
      sourceHashes: baseline,
      currentSourceHashes: currentHashes,
      targetHashes: target ? contentHashes(target) : null,
      integrityIssues,
    };
  });
  const counts = Object.fromEntries(
    [...new Set(entries.map((entry) => entry.status))]
      .sort()
      .map((status) => [
        status,
        entries.filter((entry) => entry.status === status).length,
      ]),
  );
  return {
    version: 1,
    sourceLocale: "zh",
    targetLocale: "en",
    mode: "warning",
    generatedAt: new Date().toISOString(),
    counts,
    entries,
  };
}
