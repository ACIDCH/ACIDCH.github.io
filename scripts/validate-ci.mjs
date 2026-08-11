import { spawnSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const outputRoot = path.join(process.cwd(), "dist");
const allowedFirstPersonUiPhrases = ["关于我", "II 型错误", "I 型错误"];
const forbiddenFirstPersonTerms = [
  /\b(?:I|Me|me|My|my|Mine|mine|We|we|Our|our|Ours|ours)\b/,
  /我|我们|本人|作者|笔者/,
];
const restrictedTermDiagnostics = [
  { label: "AI", pattern: /(?<![A-Za-z])AI(?![A-Za-z])/ },
  { label: "Artificial Intelligence", pattern: /Artificial Intelligence/i },
  { label: "Generative AI", pattern: /Generative AI/i },
  { label: "ChatGPT", pattern: /ChatGPT/i },
  { label: "OpenAI", pattern: /OpenAI/i },
  { label: "LLM", pattern: /(?<![A-Za-z])LLMs?(?![A-Za-z])/ },
  { label: "人工智能", pattern: /人工智能/ },
  { label: "生成式人工智能", pattern: /生成式人工智能/ },
  { label: "大语言模型/大模型", pattern: /大语言模型|大模型/ },
  { label: "机器生成", pattern: /机器生成/ },
  { label: "AI 生成/辅助", pattern: /AI[\s-]*(?:生成|辅助|assisted)/i },
  { label: "machine-generated", pattern: /machine-generated/i },
];

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? collectFiles(target) : [target];
    }),
  );
  return files.flat();
}

function routeForFile(file) {
  const relative = path.relative(outputRoot, file).replaceAll(path.sep, "/");
  if (relative === "index.html") return "/";
  if (relative.endsWith("/index.html")) {
    return `/${relative.slice(0, -"index.html".length)}`;
  }
  return `/${relative}`;
}

function stripAllowedUiPhrases(content) {
  return allowedFirstPersonUiPhrases.reduce(
    (result, phrase) => result.replaceAll(phrase, ""),
    content,
  );
}

function compactContext(content, index, length) {
  const start = Math.max(0, index - 70);
  const end = Math.min(content.length, index + length + 70);
  return content.slice(start, end).replace(/\s+/g, " ").trim();
}

async function reportRestrictedTermMatches() {
  const htmlFiles = (await collectFiles(outputRoot)).filter((file) =>
    file.endsWith(".html"),
  );
  const diagnostics = [];

  for (const file of htmlFiles) {
    const html = await readFile(file, "utf8");
    for (const check of restrictedTermDiagnostics) {
      const match = check.pattern.exec(html);
      if (!match) continue;
      diagnostics.push(
        `${routeForFile(file)}: ${check.label} → ${compactContext(html, match.index, match[0].length)}`,
      );
      break;
    }
  }

  if (diagnostics.length > 0) {
    console.error("Restricted-term diagnostics:");
    for (const diagnostic of diagnostics.slice(0, 20)) {
      console.error(`- ${diagnostic}`);
    }
  }
}

async function runLegacyValidation() {
  const result = spawnSync(process.execPath, ["scripts/validate-build.mjs"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  const combined = `${result.stdout || ""}\n${result.stderr || ""}`.trim();

  if (result.status === 0) {
    if (combined) console.log(combined);
    return;
  }

  const lines = combined.split(/\r?\n/).filter(Boolean);
  const remainingFailures = lines.filter(
    (line) =>
      !/^Built-site validation failed \(\d+ issue\(s\)\)\.$/.test(line) &&
      !/^- \/.*: contains first-person public wording$/.test(line),
  );

  if (remainingFailures.length > 0) {
    console.error("Built-site validation found non-exempt failures:");
    for (const line of remainingFailures) console.error(line);
    if (remainingFailures.some((line) => line.includes("restricted public terminology"))) {
      await reportRestrictedTermMatches();
    }
    process.exit(1);
  }

  console.log(
    "Legacy build validation passed after deferring first-person checks to the UI-aware validator.",
  );
}

async function validateFirstPersonCopy() {
  const htmlFiles = (await collectFiles(outputRoot)).filter((file) =>
    file.endsWith(".html"),
  );
  const failures = [];

  for (const file of htmlFiles) {
    const html = await readFile(file, "utf8");
    const isStaticRedirect = /<meta\b[^>]*http-equiv=["']refresh["']/i.test(html);
    if (isStaticRedirect) continue;

    const copyForCheck = stripAllowedUiPhrases(html);
    if (forbiddenFirstPersonTerms.some((pattern) => pattern.test(copyForCheck))) {
      failures.push(`${routeForFile(file)}: contains first-person public wording`);
    }
  }

  if (failures.length > 0) {
    console.error(
      `UI-aware first-person validation failed (${failures.length} issue(s)).`,
    );
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log(
    "UI-aware first-person validation passed; only approved navigation and statistical labels are exempt.",
  );
}

await runLegacyValidation();
await validateFirstPersonCopy();
console.log("Built-site validation passed.");
