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

function runLegacyValidation() {
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

runLegacyValidation();
await validateFirstPersonCopy();
console.log("Built-site validation passed.");
