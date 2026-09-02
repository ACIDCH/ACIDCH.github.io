import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  aStarGraph,
  buildGraphSpatialIndex,
  inventoryPolicy,
  parseOverpassGraph,
  solveTwoEchelonNetwork,
} from "../src/lib/geospatial/decisionEngine.js";
import { createNetworkMatrix } from "../src/lib/geospatial/networkMatrix.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const component = read("src/components/GeospatialSupplyChainLabV4.astro");
const controller = read("src/scripts/geospatial-v4.js");
const engine = read("src/lib/geospatial/decisionEngine.js");
const matrixSource = read("src/lib/geospatial/networkMatrix.js");
const storeSource = read("src/lib/geospatial/geospatialStore.js");
const servicesSource = read("src/lib/geospatial/gisServices.js");
const analysisSource = read("src/lib/geospatial/analysisEngine.js");
const workerClientSource = read("src/lib/geospatial/analysisWorkerClient.js");
const workerSource = read("src/workers/geospatial-analysis.worker.js");
const insightSource = read("src/lib/geospatial/insightModels.js");
const baselineSource = read("src/data/geospatial/aucklandBaselineSnapshot.js");
const enPage = read("src/pages/lab/geospatial-supply-chain.astro");
const zhPage = read("src/pages/zh/lab/geospatial-supply-chain.astro");

const fail = (message) => {
  throw new Error(`[geospatial-functional] ${message}`);
};
const requireText = (source, token, label = token) => {
  if (!source.includes(token)) fail(`Missing ${label}`);
};

for (const [token, label] of [
  ["geo4-engine", "network engine selector"],
  ["geo4-time-cost", "time-cost input"],
  ["geo4-road-mode", "road uncertainty selector"],
  ["geo4-event", "correlated disruption selector"],
  ["geo4-enforce-fleet", "hard fleet constraint"],
  ["geo4-mc-cvar", "CVaR robustness result"],
  ["geo4-mc-unmet", "expected unmet-demand result"],
  ["geo4-cost-histogram", "cost-distribution histogram"],
  ["geo4__workflow", "workflow state strip"],
  ["geo4-criticality", "road-criticality control"],
  ["geo4-sankey-canvas", "two-echelon Sankey mount"],
  ["geo4-explain-drawer", "node explainability drawer"],
  ["access-improvement", "access-improvement event"],
  ["geo4-solver-mode", "truthful solver mode"],
  ["Factory → Warehouse → Demand", "two-echelon semantics"],
])
  requireText(component, token, label);

for (const [token, label] of [
  ["solveTwoEchelonNetwork", "unified two-echelon solve"],
  ["graphNetworkMatrix", "same-scenario graph matrix"],
  ["services.osrmTable", "centralised OSRM matrix service"],
  ["fetchParseGraph", "background Overpass graph service"],
  ['store.begin("main")', "stale-result token"],
  ["store.setMainSolution", "structured main-result publish"],
  ["cvar95Cost", "CVaR calculation"],
  ["costHistogram", "Monte Carlo distribution output"],
  ["createDisruptionEvent", "seeded correlated events"],
  ["compareScenarioResults", "A/B comparison engine"],
  ["analysisWorker.run", "revision-aware Monte Carlo Worker"],
  ['"mainOptimisation"', "main road solve Worker dispatch"],
  ['"parseGraph"', "live graph parse Worker dispatch"],
])
  requireText(controller, token, label);

for (const [source, token, label] of [
  [analysisSource, "analyseRoadCriticality", "deterministic road criticality"],
  [analysisSource, "runMainOptimisation", "main-model Worker analysis"],
  [analysisSource, "runTwoEchelonMonteCarlo", "Worker Monte Carlo task"],
  [workerClientSource, "StaleWorkerResultError", "stale Worker protection"],
  [workerSource, "revisionId", "Worker revision echo"],
  [insightSource, "buildTwoEchelonSankey", "structured Sankey transform"],
  [insightSource, "explainSupplyChainNode", "structured explainability selector"],
])
  requireText(source, token, label);

for (const token of [
  "createNetworkMatrix",
  "assertNetworkMatrix",
  "applyNetworkScenario",
  "networkMatricesComparable",
])
  requireText(matrixSource, `export function ${token}`, token);
for (const token of ["begin", "setMainSolution", "updateInputs", "subscribe"])
  requireText(storeSource, `${token}(`, `store ${token}`);
for (const token of [
  "osrmTable",
  "osrmRoute",
  "overpassGraph",
  "geocode",
  "reverseGeocode",
])
  requireText(servicesSource, `${token}(`, `GIS service ${token}`);
for (const token of [
  "solveTwoEchelonNetwork",
  "aStarGraph",
  "buildGraphSpatialIndex",
  "graphNetworkMatrix",
])
  requireText(engine, `export function ${token}`, token);
requireText(
  baselineSource,
  "auckland-arterial-2026-08-30-v1",
  "versioned Auckland graph",
);
requireText(enPage, "GeospatialSupplyChainLabV4", "English V4 route");
requireText(zhPage, "GeospatialSupplyChainLabV4", "Chinese V4 route");

const fw = createNetworkMatrix({
  distanceKm: [
    [1, 4],
    [3, 1],
  ],
  durationMin: [
    [2, 8],
    [6, 2],
  ],
  costPerKm: 1,
  costPerMinute: 0.25,
  source: "acceptance",
  version: "1",
});
const wd = createNetworkMatrix({
  distanceKm: [
    [1, 3],
    [3, 1],
  ],
  durationMin: [
    [2, 6],
    [6, 2],
  ],
  costPerKm: 1,
  costPerMinute: 0.25,
  source: "acceptance",
  version: "1",
});
const solved = solveTwoEchelonNetwork({
  factoryWarehouseMatrix: fw,
  warehouseDemandMatrix: wd,
  demands: [4, 4],
  factoryCapacities: [5, 5],
  warehouseCapacities: [6, 6],
  maxOpen: 2,
  fixedCost: 10,
  serviceThreshold: 20,
  serviceMetric: "durationMin",
});
if (!solved?.feasible || Math.abs(solved.allocatedDemand - 8) > 1e-6)
  fail("Unified two-echelon solver did not serve all demand");
const upstream = solved.factoryWarehouseFlows.reduce((sum, arc) => sum + arc.flow, 0);
const downstream = solved.warehouseDemandFlows.reduce((sum, arc) => sum + arc.flow, 0);
if (Math.abs(upstream - downstream) > 1e-6)
  fail("Two-echelon flow conservation failed");

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
const index = buildGraphSpatialIndex(graph);
if (!index || !aStarGraph(graph, "1", "3", {}, "time"))
  fail("Indexed A* acceptance failed");

const policy = inventoryPolicy({ mean: 120, sd: 25, leadTime: 2, z: 1.645 });
if (!(policy.safetyStock > 0 && policy.reorderPoint > policy.leadTimeMean))
  fail("Inventory policy relationship is invalid");

console.log(
  "[geospatial-functional] PASS: typed matrices, unified two-echelon flow, central state/services, Worker risk analysis, road criticality, structured Sankey/explainability, Auckland graph, indexed A* and bilingual routes passed.",
);
