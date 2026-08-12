import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { inventoryContent, translatableContent } from "./lib/i18n-sync.mjs";

const failures = [];
const manifestPath = ".i18n/manifest.json";
const auditPath = "tmp/i18n-audit.json";

if (!existsSync("dist") || !existsSync("dist/sitemap-0.xml")) {
  failures.push("static build and sitemap must exist before the final audit");
}

mkdirSync("tmp", { recursive: true });
execFileSync(process.execPath, ["scripts/i18n-audit.mjs", "--json"], {
  stdio: "ignore",
});

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const architecture = JSON.parse(readFileSync(auditPath, "utf8"));
const acceptance = architecture.acceptance;
const requiredZero = [
  "missingEnNotes",
  "englishPlaceholderNotes",
  "missingEnProjects",
  "englishPlaceholderProjects",
  "missingEnSeriesRoutes",
  "layoutParityDefects",
  "componentsRequiringLocaleExtraction",
  "falseAlternateCases",
  "anchorRisks",
];

for (const metric of requiredZero) {
  if (acceptance[metric] !== 0) {
    failures.push(`${metric} is ${acceptance[metric]}, expected 0`);
  }
}
if (acceptance.publishedZhNotes !== acceptance.publishedEnNotes) {
  failures.push("published Note locale counts differ");
}
if (acceptance.publishedZhProjects !== acceptance.publishedEnProjects) {
  failures.push("published Project locale counts differ");
}
if (architecture.content.notes.counts.missingZh !== 0) {
  failures.push("published English Notes are missing Chinese counterparts");
}
if (architecture.content.projects.counts.missingZh !== 0) {
  failures.push("published English Projects are missing Chinese counterparts");
}
if (architecture.search.issues.length) {
  failures.push(`search parity: ${architecture.search.issues.join("; ")}`);
}

const strictBlockers = manifest.entries.filter((entry) => entry.strictBlocking);
if (strictBlockers.length) {
  failures.push(
    `strict manifest contains public blockers: ${strictBlockers
      .map((entry) => `${entry.key}:${entry.status}`)
      .join(", ")}`,
  );
}
const orphanTranslations = manifest.entries.filter((entry) =>
  /ORPHAN|DUPLICATE/u.test(entry.status),
);
if (orphanTranslations.length) failures.push("orphan or duplicate translations remain");
const protectedMismatches = manifest.entries.filter((entry) =>
  entry.integrityIssues.some((issue) => issue.type === "PROTECTED_TOKEN_MISMATCH"),
);
if (protectedMismatches.length) failures.push("protected-token mismatches remain");

const englishPublicContent = inventoryContent().filter((entry) => {
  if (entry.frontmatter.locale !== "en") return false;
  if (entry.collection === "notes") {
    return (
      entry.frontmatter.status === "published" &&
      !entry.frontmatter.draft &&
      !entry.frontmatter.isPlaceholder
    );
  }
  return (
    entry.frontmatter.status === "completed" &&
    !entry.frontmatter.isPlaceholder &&
    !entry.frontmatter.noindex
  );
});
const englishContentLeaks = englishPublicContent.filter((entry) =>
  /[\u3400-\u9fff]/u.test(translatableContent(entry.body)),
);
if (englishContentLeaks.length) {
  failures.push(
    `English content prose contains Han text: ${englishContentLeaks
      .map((entry) => entry.path)
      .join(", ")}`,
  );
}

const sharedEnglishPages = [
  "dist/index.html",
  "dist/about/index.html",
  "dist/productivity/index.html",
  "dist/projects/index.html",
  "dist/projects/page/2/index.html",
  "dist/notes/index.html",
  "dist/notes/page/2/index.html",
  "dist/notes/page/3/index.html",
  "dist/notes/series/r-statistics/index.html",
  "dist/notes/series/regression/index.html",
  "dist/notes/series/sql/index.html",
  "dist/notes/series/python/index.html",
  "dist/notes/series/decision-models/index.html",
];
for (const file of sharedEnglishPages) {
  const visibleCopy = readFileSync(file, "utf8")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, "")
    .replace(/<!--([\s\S]*?)-->/gu, "")
    .replace(/<[^>]+>/gu, " ")
    .replaceAll("中文", "");
  if (/[\u3400-\u9fff]/u.test(visibleCopy)) {
    failures.push(`${file} contains an English shared-UI language leak`);
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  mode: manifest.mode,
  published: {
    notes: {
      zh: acceptance.publishedZhNotes,
      en: acceptance.publishedEnNotes,
      parityPercent: 100,
    },
    projects: {
      zh: acceptance.publishedZhProjects,
      en: acceptance.publishedEnProjects,
      parityPercent: 100,
    },
  },
  explicitNonPublicEntries: manifest.entries
    .filter((entry) => !entry.strictBlocking && entry.status !== "SYNCED")
    .map((entry) => ({ key: entry.key, status: entry.status })),
  targets: {
    publishedEnglishPlaceholders: 0,
    orphanTranslations: orphanTranslations.length,
    stalePublishedTranslations: strictBlockers.length,
    layoutParityDefects: acceptance.layoutParityDefects,
    protectedTokenMismatches: protectedMismatches.length,
    falseHreflangLinks: acceptance.falseAlternateCases,
    brokenBilingualRoutes:
      acceptance.missingEnNotes +
      acceptance.missingEnProjects +
      architecture.content.notes.counts.missingZh +
      architecture.content.projects.counts.missingZh,
    publishedComponentLocaleLeaks:
      acceptance.componentsRequiringLocaleExtraction + englishContentLeaks.length,
    searchParityIssues: architecture.search.issues.length,
    anchorRisks: acceptance.anchorRisks,
  },
  passed: failures.length === 0,
  failures,
};

writeFileSync("tmp/i18n-final-audit.json", `${JSON.stringify(report, null, 2)}\n`);

if (failures.length) {
  console.error(`Final bilingual audit failed (${failures.length} issue(s)).`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
console.log("Final bilingual audit passed.");
