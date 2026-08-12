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

if (write) {
  mkdirSync(".i18n", { recursive: true });
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

console.log(
  JSON.stringify({ mode: strict ? "strict" : "warning", ...manifest.counts }, null, 2),
);
const blocking = manifest.entries.filter((entry) => entry.status !== "SYNCED");
if (blocking.length) {
  console.warn(
    `Bilingual sync found ${blocking.length} non-synced entries. ${strict ? "Strict mode blocks this run." : "Warning mode remains non-blocking during backfill."}`,
  );
  blocking.slice(0, 12).forEach((entry) => {
    console.warn(
      `- ${entry.key}: ${entry.status}${entry.change ? ` (${entry.change})` : ""}`,
    );
  });
}
if (strict && blocking.length) process.exitCode = 1;
