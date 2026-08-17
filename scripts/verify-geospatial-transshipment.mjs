import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const extension = read("src/components/GeospatialFunctionalExtensions.astro");
const source = read("src/scripts/geospatial-transshipment.js");

const fail = (message) => {
  throw new Error(`[geospatial-transshipment] ${message}`);
};
const requireText = (token, label = token) => {
  if (!source.includes(token)) fail(`Missing ${label}`);
};

if (!extension.includes("geospatial-transshipment.js")) fail("Transshipment extension is not mounted");
for (const [token, label] of [
  ["solveTwoEchelon", "two-echelon min-cost flow solver"],
  ["wi0", "warehouse-in node set"],
  ["wo0", "warehouse-out node set"],
  ["warehouseCapacity, 0, { stage: \"throughput\"", "strict warehouse throughput arc"],
  ["factoryCapacity", "factory supply capacity"],
  ["graphOdMatrix", "current OSM road-cost matrix"],
  ["scenarioParams: scenarioParams()", "active road scenario parameters"],
  ["result.scenario", "scenario returned by the road matrix"],
  ["reconstructGraphPath", "scenario-consistent road geometry"],
  ["/table/v1/driving/", "OSRM matrix fallback"],
  ["/route/v1/driving/", "OSRM route fallback"],
  ["Factory → Warehouse", "first-echelon semantics"],
  ["Warehouse → Demand", "second-echelon semantics"],
  ["currently open warehouses", "main-model warehouse selection coupling"],
]) requireText(token, label);

const start = source.indexOf("function solveTwoEchelon");
const end = source.indexOf("\nfunction boot", start);
if (start < 0 || end <= start) fail("Unable to extract the browser transshipment solver for numerical acceptance");
const solverSource = source.slice(start, end);
const solveTwoEchelon = new Function(`${solverSource}; return solveTwoEchelon;`)();

const factories = [{ name: "F1" }, { name: "F2" }];
const warehouses = [{ name: "W1" }];
const demands = [{ demand: 4 }, { demand: 4 }];
const fwCosts = [[1], [2]];
const wdCosts = [[1, 3]];

const constrained = solveTwoEchelon({
  factories,
  warehouses,
  demands,
  fwCosts,
  wdCosts,
  factoryCapacity: 10,
  warehouseCapacity: 6,
});
if (constrained.feasible || Math.abs(constrained.flow - 6) > 1e-6) {
  fail("Warehouse node-split capacity must cap total throughput at 6 units");
}

const feasible = solveTwoEchelon({
  factories,
  warehouses,
  demands,
  fwCosts,
  wdCosts,
  factoryCapacity: 10,
  warehouseCapacity: 8,
});
if (!feasible.feasible || Math.abs(feasible.flow - 8) > 1e-6) {
  fail("Feasible two-echelon case did not satisfy all demand");
}
const fwFlow = feasible.fw.reduce((sum, arc) => sum + arc.flow, 0);
const wdFlow = feasible.wd.reduce((sum, arc) => sum + arc.flow, 0);
const throughput = feasible.throughput.reduce((sum, arc) => sum + arc.flow, 0);
if (Math.abs(fwFlow - 8) > 1e-6 || Math.abs(wdFlow - 8) > 1e-6 || Math.abs(throughput - 8) > 1e-6) {
  fail("Factory→Warehouse, warehouse throughput and Warehouse→Demand flow conservation failed");
}

console.log(
  "[geospatial-transshipment] PASS: strict node-split warehouse capacity, two-echelon flow conservation, current-road scenario coupling and route geometry checks passed.",
);