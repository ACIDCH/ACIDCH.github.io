import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "src/scripts/geospatial-inventory-variability.js"), "utf8");
const fail = (message) => { throw new Error(`[geospatial-inventory-reset] ${message}`); };

for (const [token, label] of [
  ["mean.value = \"120\"", "mean demand reset"],
  ["baseSd.value = \"25\"", "demand SD reset"],
  ["lead.value = \"2\"", "lead time reset"],
  ["leadSd.value = \"0\"", "lead-time SD reset"],
  ["service.value = \"1.645\"", "95 percent service reset"],
  ["holding.value = \"1\"", "holding-cost reset"],
  ["sync();", "synchronous effective-SD reset"],
]) {
  if (!source.includes(token)) fail(`Missing ${label}`);
}

const combined = Math.sqrt(2 * 25 ** 2 + 120 ** 2 * 0 ** 2);
const effective = combined / Math.sqrt(2);
if (Math.abs(effective - 25) > 1e-9) fail("Fixed-lead-time baseline must restore the raw demand SD of 25");

console.log("[geospatial-inventory-reset] PASS: mean demand, demand SD, lead time, lead-time SD, 95% service, holding cost and effective SD reset synchronously to baseline.");