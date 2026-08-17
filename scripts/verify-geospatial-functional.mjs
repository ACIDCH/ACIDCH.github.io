import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  inventoryPolicy,
  parseOverpassGraph,
  runMonteCarlo,
  solveFacilityNetwork,
} from "../src/lib/geospatial/decisionEngine.js";
import { reconstructGraphPath } from "../src/lib/geospatial/pathTools.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const component = read("src/components/GeospatialSupplyChainLabV4.astro");
const controller = read("src/scripts/geospatial-v4.js");
const engine = read("src/lib/geospatial/decisionEngine.js");
const enPage = read("src/pages/lab/geospatial-supply-chain.astro");
const zhPage = read("src/pages/zh/lab/geospatial-supply-chain.astro");

const fail = (message) => {
  throw new Error(`[geospatial-functional] ${message}`);
};
const requireText = (source, token, label = token) => {
  if (!source.includes(token)) fail(`Missing ${label}`);
};
const requirePattern = (source, pattern, label) => {
  if (!pattern.test(source)) fail(`Missing ${label}`);
};

const componentRequirements = [
  ["geo4-engine", "network engine selector"],
  ["geo4-init", "explicit GIS initialisation"],
  ["geo4-load-graph", "OSM graph loader"],
  ["geo4-road-mode", "road uncertainty selector"],
  ["geo4-congestion", "congestion control"],
  ["geo4-closure", "road closure control"],
  ["geo4-new-roads-out", "new-road control"],
  ["geo4-policy-list", "facility policy editor"],
  ["geo4-max-open-out", "facility-count control"],
  ["geo4-fleet-out", "fleet-count control"],
  ["geo4-enforce-fleet", "hard fleet-capacity constraint"],
  ["geo4-inv-mean", "inventory demand control"],
  ["geo4-service", "inventory service level"],
  ["geo4-address", "natural-language address input"],
  ["geo4-map-add", "map-click entity editor"],
  ["geo4-simulate", "Monte Carlo trigger"],
  ["geo4-mc-runs", "actual Monte Carlo run count"],
  ["geo4-mc-p95", "P95 robustness result"],
  ["geo4-stability", "facility-selection stability"],
  ["geo4-save-a", "scenario A save"],
  ["geo4-save-b", "scenario B save"],
  ["geo4-compare", "A/B comparison"],
  ["geo4-layer", "functional map layer selector"],
  ["value=\"flow\"", "flow layer"],
  ["value=\"coverage\"", "coverage layer"],
  ["value=\"utilisation\"", "utilisation layer"],
  ["value=\"cost\"", "cost layer"],
  ["value=\"inventory\"", "inventory layer"],
  ["value=\"risk\"", "risk layer"],
  ["Factory → Warehouse → Demand", "honest facility-role boundary"],
];
for (const [token, label] of componentRequirements) {
  requireText(component, token, label);
}

const controllerRequirements = [
  ["/table/v1/driving/", "OSRM Table matrix update"],
  ["overpass-api.de", "Overpass road-graph source"],
  ["parseOverpassGraph", "edge-graph parsing"],
  ["graphOdMatrix", "Dijkstra-derived OD matrix"],
  ["reconstructGraphPath", "exact scenario-path reconstruction"],
  ["activeGraph.scenario", "route uses the same road scenario as optimisation"],
  ["data-policy", "must/exclude facility policies"],
  ["runMonteCarlo", "Monte Carlo engine"],
  ["compareScenarioResults", "A/B comparison engine"],
];
for (const [token, label] of controllerRequirements) {
  requireText(controller, token, label);
}
requirePattern(
  controller,
  /\[\s*5\s*,\s*10\s*,\s*15\s*,\s*25\s*\]/,
  "honest edge-level Monte Carlo run options",
);
requirePattern(
  controller,
  /\[\s*50\s*,\s*100\s*,\s*250\s*,\s*500\s*,\s*1000\s*\]/,
  "high-run OD Monte Carlo options",
);

const engineRequirements = [
  "solveTransportation",
  "solveFacilityNetwork",
  "runMonteCarlo",
  "simulateInventoryStockout",
  "parseOverpassGraph",
  "buildEdgeScenario",
  "dijkstraGraph",
  "graphOdMatrix",
  "compareScenarioResults",
];
for (const token of engineRequirements) {
  requireText(engine, `export function ${token}`, token);
}
requireText(enPage, "GeospatialSupplyChainLabV4", "English V4 route");
requireText(zhPage, "GeospatialSupplyChainLabV4", "Chinese V4 route");

const matrix = [
  [2.07, 5.8, 2.04, 4.66, 4.12, 10.66, 7.5, 0.31, 7.7, 7.89],
  [4.2, 5.62, 1.29, 4.26, 4.94, 10.03, 9.5, 3.22, 8.51, 6.91],
  [6.45, 1.92, 6.76, 2.79, 3.44, 4.19, 7.26, 7.27, 4.42, 3.23],
  [1.45, 4.95, 4.85, 4.11, 2.47, 9.25, 4.48, 3.52, 4.89, 7.33],
  [5.56, 6.79, 8.98, 7.29, 5.05, 9.13, 0, 7.63, 2.87, 9.6],
  [10.7, 6.17, 10.99, 7.03, 7.69, 1.04, 9.48, 11.52, 6.62, 4.27],
];
const demands = [4000, 600, 700, 800, 500, 600, 400, 700, 900, 400];
const baseline = solveFacilityNetwork({
  matrix,
  demands,
  maxOpen: 6,
  redundancy: 1,
  threshold: 6,
  facilityCapacity: 10000,
  fixedCost: 350000,
  transportCost: 0.72,
  objective: "minHubs",
});
if (!baseline || baseline.selected.length !== 2) {
  fail("Verified 6 km baseline must remain feasible with two facilities");
}
if (
  Math.abs(baseline.allocatedDemand - demands.reduce((a, b) => a + b, 0)) >
  1e-6
) {
  fail("Capacitated transport did not allocate all baseline demand");
}

const policy = inventoryPolicy({ mean: 120, sd: 25, leadTime: 2, z: 1.645 });
if (!(policy.safetyStock > 0 && policy.reorderPoint > policy.leadTimeMean)) {
  fail("Inventory policy relationship is invalid");
}

const monteCarlo = runMonteCarlo({
  baseMatrix: matrix,
  solverParams: {
    demands,
    maxOpen: 6,
    redundancy: 1,
    threshold: 7,
    facilityCapacity: 10000,
    fixedCost: 350000,
    transportCost: 0.72,
    objective: "minHubs",
  },
  scenarioParams: {
    mode: "mixed",
    congestionSeverity: 0.15,
    closureShare: 0.01,
    improvement: 0.1,
  },
  runs: 12,
  seed: 708709,
  facilityNames: ["PON", "GNR", "GLW", "BEA", "ORA", "ONE"],
  inventory: { mean: 120, sd: 25, leadTime: 2, z: 1.645 },
});
if (monteCarlo.runs !== 12 || monteCarlo.facilityStability.length !== 6) {
  fail("Monte Carlo acceptance result is incomplete");
}

const graph = parseOverpassGraph([
  { type: "node", id: 1, lat: -36.87, lon: 174.76 },
  { type: "node", id: 2, lat: -36.87, lon: 174.77 },
  { type: "node", id: 3, lat: -36.87, lon: 174.78 },
  {
    type: "way",
    id: 10,
    nodes: [1, 2, 3],
    tags: { highway: "primary", maxspeed: "50" },
  },
]);
const exactPath = reconstructGraphPath(graph, "1", "3", {}, "distance");
if (!exactPath || exactPath.coordinates.length !== 3 || exactPath.edges.length !== 2) {
  fail("Dijkstra path reconstruction is incomplete");
}

console.log(
  "[geospatial-functional] PASS: V4 UI modules, bilingual routes, capacitated solver, inventory, Monte Carlo, edge-level graph and exact-path consistency checks passed.",
);