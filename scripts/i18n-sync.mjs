import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { buildManifest, inventoryContent } from "./lib/i18n-sync.mjs";

const argumentsSet = new Set(process.argv.slice(2));
const write = argumentsSet.has("--write");
const strict = argumentsSet.has("--strict");
const acceptedKeys = new Set(
  process.argv
    .slice(2)
    .filter((argument) => argument.startsWith("--accept="))
    .map((argument) => argument.slice("--accept=".length)),
);
const manifestPath = ".i18n/manifest.json";
const previous = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, "utf8"))
  : null;
const manifest = buildManifest(inventoryContent(), previous, acceptedKeys);
manifest.mode = strict || previous?.mode === "strict" ? "strict" : "warning";

if (write) {
  mkdirSync(".i18n", { recursive: true });
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

console.log(
  JSON.stringify({ mode: strict ? "strict" : "warning", ...manifest.counts }, null, 2),
);
const tracked = manifest.entries.filter((entry) => entry.status !== "SYNCED");
const blocking = tracked.filter((entry) => entry.strictBlocking);
if (tracked.length) {
  console.warn(
    `Bilingual sync found ${tracked.length} non-synced entries; ${blocking.length} affect published content. ${strict && blocking.length ? "Strict mode blocks this run." : "The published bilingual backlog is clear."}`,
  );
  tracked.slice(0, 12).forEach((entry) => {
    console.warn(
      `- ${entry.key}: ${entry.status}${entry.strictBlocking ? " [PUBLIC BLOCKER]" : " [NON-PUBLIC]"}${entry.change ? ` (${entry.change})` : ""}`,
    );
  });
}
if (strict && blocking.length) process.exitCode = 1;
