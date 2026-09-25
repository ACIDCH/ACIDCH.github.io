import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

// Reuse the existing required-copy contracts before deployment, so a translated
// heading cannot first fail after Pages is already live. This reads only trusted
// repository scripts; it does not execute their network or deployment routines.
const verifiers = [
  "verify-production.mjs",
  "verify-sql08-production.mjs",
  "verify-sql09-production.mjs",
  "verify-decision-models-production.mjs",
  "verify-regression-production.mjs",
  "verify-data-science-production.mjs",
  "verify-statistics-production.mjs",
];
let checked = 0;
const failures = [];
for (const file of verifiers) {
  const source = readFileSync(new URL(file, import.meta.url), "utf8");
  const declaration = source.match(/const (checks|pageChecks) = \[/);
  if (!declaration) throw new Error(`${file}: missing content contract array`);
  const end = source.indexOf("\n];", declaration.index);
  if (end < 0) throw new Error(`${file}: unterminated content contract array`);
  const prefix =
    file === "verify-production.mjs"
      ? source.slice(
          source.indexOf("const archivedChurnRasterMarkers"),
          declaration.index,
        )
      : "";
  const checks = runInNewContext(
    prefix + source.slice(declaration.index, end + 3) + `; ${declaration[1]}`,
    Object.create(null),
    { timeout: 1000 },
  );
  for (const { path, markers } of checks) {
    const html = readFileSync(
      new URL(`../dist/${path}index.html`, import.meta.url),
      "utf8",
    );
    for (const marker of markers) {
      checked += 1;
      if (!html.includes(marker)) failures.push(`${file}: ${path} missing ${marker}`);
    }
  }
}
if (failures.length) throw new Error(failures.join("\n"));
console.log(`Production required-content contracts passed (${checked} markers).`);
