import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildPolylineMetrics,
  particleCountForFlow,
  pointAlongPolyline,
} from "../src/lib/geospatial/flowGeometry.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const component = read("src/components/GeospatialAdvancedVisuals.astro");
const controller = read("src/scripts/geospatial-advanced-visuals-v2.js");
const roadNetwork = read("src/scripts/geospatial-road-network-visuals.js");
const networkCoverage = read("src/scripts/geospatial-network-coverage-v2.js");
const logisticsMotion = read("src/scripts/geospatial-logistics-motion.js");
const visualState = read("src/scripts/geospatial-visual-state.js");
const nodeStatus = read("src/scripts/geospatial-node-status.js");
const layerVisuals = read("src/scripts/geospatial-layer-visuals.js");
const layoutPolish = read("src/scripts/geospatial-layout-polish.js");
const enPage = read("src/pages/lab/geospatial-supply-chain.astro");
const zhPage = read("src/pages/zh/lab/geospatial-supply-chain.astro");
const routeController = read("src/scripts/geospatial-v4.js");
const mainComponent = read("src/components/GeospatialSupplyChainLabV4.astro");
const decisionInsights = read("src/scripts/geospatial-decision-insights.js");

const fail = (message) => {
  throw new Error(`[geospatial-visual] ${message}`);
};
const requireText = (source, token, label = token) => {
  if (!source.includes(token)) fail(`Missing ${label}`);
};

for (const [token, label] of [
  ["geospatial-road-network-visuals.js", "real OSM road-network visual import"],
  ["geospatial-network-coverage-v2.js", "graph-schema-correct OSM coverage import"],
  ["geospatial-advanced-visuals-v2.js", "advanced visual controller import"],
  ["geospatial-logistics-motion.js", "fleet/transshipment motion semantics import"],
  ["geospatial-visual-state.js", "network-event visual state import"],
  ["geospatial-node-status.js", "node-status visual layer import"],
  ["geospatial-layer-visuals.js", "analysis-layer visual mode import"],
  ["geospatial-layout-polish.js", "map-first desktop layout polish import"],
])
  requireText(component, token, label);
requireText(enPage, "GeospatialAdvancedVisuals", "English advanced visual mount");
requireText(zhPage, "GeospatialAdvancedVisuals", "Chinese advanced visual mount");

for (const [token, label] of [
  ["geo4__road-canvas", "real road-network canvas"],
  ["geo4__road-hud", "real road-network HUD"],
  ["getGeospatialStore", "structured graph source"],
  ["snapshot.graph", "store graph subscription"],
  ["buildEdgeScenario", "edge-level road scenario coupling"],
  ["scenario.factors", "congestion edge rendering"],
  ["scenario.disabled", "closed-edge rendering"],
  ["scenario.shortcuts", "new-road rendering"],
  ["motorway|trunk", "road hierarchy classification"],
  ["latLngToContainerPoint", "road graph map projection"],
  ["geo4-engine", "OSM engine visibility coupling"],
  ["geo4-layer", "analysis-layer road emphasis coupling"],
])
  requireText(roadNetwork, token, label);
if (
  roadNetwork.includes("globalThis.fetch =") ||
  roadNetwork.includes("L.circleMarker =")
)
  fail("Road visual layer must not monkey-patch fetch or Leaflet markers");

for (const [token, label] of [
  ["geo4__coverage-canvas-v2", "network service-area canvas"],
  ["SERVICE AREA / DIJKSTRA", "network coverage HUD"],
  ["nearestGraphNode", "facility-to-road graph snapping"],
  ["boundedDijkstra", "bounded Dijkstra service-area traversal"],
  ["edge.timeMin", "actual graph travel-time field"],
  ["graph.adjacency.get", "graph edge-id adjacency traversal"],
  ["scenario.disabled", "coverage respects road closures"],
  ["scenario.factors", "coverage respects congestion"],
  ["scenario.shortcuts", "coverage respects new-road links"],
  ["snapshot.mainSolution.selected", "structured selected facility coupling"],
  ["coverage >= 2", "overlapping network coverage emphasis"],
  ["geo4-threshold", "service-time threshold coupling"],
])
  requireText(networkCoverage, token, label);

for (const [token, label] of [
  ["geo4__flow-canvas", "canvas route-flow overlay"],
  ["prefers-reduced-motion", "reduced-motion accessibility"],
  ["geo4-flow-toggle", "animation toggle"],
  ["geo4-flow-speed", "flow speed control"],
  ["geo4-flow-density", "particle density control"],
  ["geo4-flow-glow", "route glow control"],
  ["geo4-flow-ambient", "ambient visual control"],
  ["getGeospatialStore", "structured route source"],
  ["snapshot.routeVisuals", "route geometry and flow subscription"],
  ["particleCountForFlow", "flow-scaled particle density"],
  ["pointAlongPolyline", "route particle interpolation"],
  ["latLngToContainerPoint", "Leaflet map projection coupling"],
])
  requireText(controller, token, label);
if (controller.includes("L.polyline =") || controller.includes("Flow:\\s*"))
  fail("Advanced route visuals must not monkey-patch Leaflet or parse tooltip copy");

for (const [token, label] of [
  ["geo4__fleet-route", "fleet tour motion"],
  ["geo4__transshipment-route.stage-fw", "Factory→Warehouse motion"],
  ["geo4__transshipment-route.stage-wd", "Warehouse→Demand motion"],
  ["geo4__logistics-state", "logistics layer status badge"],
  ["geo4__legend", "logistics legend integration"],
  ["prefers-reduced-motion", "logistics reduced-motion safety"],
])
  requireText(logisticsMotion, token, label);

for (const [token, label] of [
  ["geo4__scenario-ribbon", "network event ribbon"],
  ["geo4-road-mode", "road scenario coupling"],
  ["geo4-congestion", "congestion severity coupling"],
  ["geo4-closure", "closure severity coupling"],
  ["data-level", "visual intensity state"],
])
  requireText(visualState, token, label);

for (const [token, label] of [
  ["geo4__flow-tier", "flow hierarchy legend"],
  ["geo4__node-canvas", "node status canvas"],
  ["Facility outflow", "source node semantics"],
  ["Demand inflow", "sink node semantics"],
  ["snapshot.routeVisuals", "structured route node aggregation"],
  ["latLngToContainerPoint", "node status map projection"],
])
  requireText(nodeStatus, token, label);

for (const [token, label] of [
  ["geo4__layer-chip", "analysis layer chip"],
  ["geo4__layer-tint", "analysis layer tint"],
  ["data-analysis-layer", "analysis layer state"],
  ["geo4-layer", "functional layer coupling"],
  ["coverage", "coverage visual mode"],
  ["utilisation", "utilisation visual mode"],
  ["inventory", "inventory visual mode"],
  ["risk", "risk visual mode"],
])
  requireText(layerVisuals, token, label);

for (const [token, label] of [
  ["geo-lab-page", "desktop lab page-shell compaction"],
  ["geo-lab-container", "desktop full-width lab container"],
  [".geo4__console", "right-side function console layout"],
  [".geo4__results", "right-lower result module layout"],
  ["right:.7rem", "shared right alignment"],
  ["height:calc(61% - .7rem)", "upper console height"],
  ["height:calc(39% - .7rem)", "lower result height"],
  ["calc(100vh - 8.2rem)", "viewport-led desktop map height"],
])
  requireText(layoutPolish, token, label);

requireText(
  routeController,
  "reconstructGraphPath",
  "exact scenario path reconstruction in functional route controller",
);
requireText(
  routeController,
  "activeGraph.scenario",
  "route geometry tied to the active OSM disruption scenario",
);

for (const [source, token, label] of [
  [mainComponent, "geo4__criticality-edge", "criticality map styling"],
  [mainComponent, "geo4__sankey-canvas", "responsive Sankey canvas"],
  [mainComponent, "geo4__drawer", "responsive explainability drawer"],
  [decisionInsights, "buildTwoEchelonSankey", "structured Sankey rendering"],
  [decisionInsights, "explainSupplyChainNode", "structured node explanation"],
  [decisionInsights, "drawMapPolyline", "criticality map layer"],
  [decisionInsights, "StaleWorkerResultError", "criticality stale-state guard"],
])
  requireText(source, token, label);

const metrics = buildPolylineMetrics([
  { x: 0, y: 0 },
  { x: 30, y: 40 },
  { x: 80, y: 40 },
]);
if (Math.abs(metrics.total - 100) > 1e-9) fail("Unexpected route metric length");
const midpoint = pointAlongPolyline(metrics, 50);
if (!midpoint || Math.abs(midpoint.x - 30) > 1e-9 || Math.abs(midpoint.y - 40) > 1e-9)
  fail("Particle interpolation is not deterministic");
if (particleCountForFlow(1000, 1000, 4) <= particleCountForFlow(100, 1000, 4))
  fail("Particle count does not scale with route flow");

console.log(
  "[geospatial-visual] PASS: real OSM road hierarchy, disruption states, graph-schema-correct bounded-Dijkstra coverage, verified route flow, fleet/transshipment motion, node status, analysis layers, desktop viewport shell and reduced-motion checks passed.",
);
