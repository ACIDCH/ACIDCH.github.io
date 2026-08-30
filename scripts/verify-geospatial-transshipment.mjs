import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { solveTwoEchelonNetwork } from "../src/lib/geospatial/decisionEngine.js";
import { createNetworkMatrix } from "../src/lib/geospatial/networkMatrix.js";

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

if (!extension.includes("geospatial-transshipment.js"))
  fail("Transshipment extension is not mounted");
for (const [token, label] of [
  ["getGeospatialStore", "central store"],
  ["snapshot.mainSolution", "structured integrated result"],
  ["solution.factoryAssignments", "factory-to-warehouse flow"],
  ["solution.assignments", "warehouse-to-demand flow"],
  ["inflow", "warehouse inflow check"],
  ["outflow", "warehouse outflow check"],
  ["reconstructGraphPath", "same-scenario graph route"],
  ["services.osrmRoute", "centralised route fallback"],
  ['store.begin("transshipment")', "stale-result token"],
])
  requireText(token, label);
if (source.includes("globalThis.fetch ="))
  fail("Transshipment must not monkey-patch fetch");
if (/querySelectorAll\([^\n]*geo4__open/.test(source))
  fail("Transshipment must not parse opened warehouses from DOM");

const matrix = (distanceKm) =>
  createNetworkMatrix({
    distanceKm,
    durationMin: distanceKm.map((row) => row.map((value) => value * 2)),
    costPerKm: 1,
    source: "acceptance",
    version: "1",
  });
const constrained = solveTwoEchelonNetwork({
  factoryWarehouseMatrix: matrix([[1], [2]]),
  warehouseDemandMatrix: matrix([[1, 3]]),
  demands: [4, 4],
  factoryCapacities: [10, 10],
  warehouseCapacities: [6],
  maxOpen: 1,
  serviceThreshold: 99,
  serviceMetric: "durationMin",
});
if (constrained !== null)
  fail(
    "Warehouse throughput capacity must make the 8-unit case infeasible at capacity 6",
  );
const feasible = solveTwoEchelonNetwork({
  factoryWarehouseMatrix: matrix([[1], [2]]),
  warehouseDemandMatrix: matrix([[1, 3]]),
  demands: [4, 4],
  factoryCapacities: [10, 10],
  warehouseCapacities: [8],
  maxOpen: 1,
  serviceThreshold: 99,
  serviceMetric: "durationMin",
});
if (!feasible?.feasible || Math.abs(feasible.allocatedDemand - 8) > 1e-6)
  fail("Feasible two-echelon case did not satisfy all demand");
const upstream = feasible.factoryWarehouseFlows.reduce((sum, arc) => sum + arc.flow, 0);
const downstream = feasible.warehouseDemandFlows.reduce(
  (sum, arc) => sum + arc.flow,
  0,
);
if (Math.abs(upstream - downstream) > 1e-6)
  fail("Two-echelon flow conservation failed");

console.log(
  "[geospatial-transshipment] PASS: unified two-echelon model, warehouse throughput capacity, structured flow conservation and scenario-consistent routing passed.",
);
