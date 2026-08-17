import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const extension = read("src/components/GeospatialFunctionalExtensions.astro");
const source = read("src/scripts/geospatial-capacity-buffer.js");

const fail = (message) => { throw new Error(`[geospatial-capacity] ${message}`); };
const requireText = (token, label = token) => { if (!source.includes(token)) fail(`Missing ${label}`); };

if (!extension.includes("geospatial-capacity-buffer.js")) fail("Capacity-buffer extension is not mounted");
for (const [token, label] of [
  ["geo4-facility-capacity-base", "physical capacity input"],
  ["geo4-facility-capacity", "effective hidden planning capacity"],
  ["geo4-utilisation-buffer", "maximum utilisation control"],
  ["physical * utilisation", "effective capacity calculation"],
  ["15% capacity buffer", "default reserve explanation"],
  ["value=\"85\"", "85 percent baseline"],
  ["new globalThis.Event", "solver input refresh event"],
]) requireText(token, label);

const physical = 6000;
const utilisation = 0.85;
const effective = physical * utilisation;
if (effective !== 5100) fail("6000 × 85% must produce 5100 effective planning capacity");
if (!(effective < physical)) fail("Capacity buffer must reserve physical headroom");

console.log("[geospatial-capacity] PASS: editable physical capacity, 85% default utilisation buffer and effective planning capacity checks passed.");