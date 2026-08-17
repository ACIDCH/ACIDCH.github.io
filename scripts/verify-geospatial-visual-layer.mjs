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
const visualState = read("src/scripts/geospatial-visual-state.js");
const nodeStatus = read("src/scripts/geospatial-node-status.js");
const layerVisuals = read("src/scripts/geospatial-layer-visuals.js");
const layoutPolish = read("src/scripts/geospatial-layout-polish.js");
const mobileView = read("src/scripts/geospatial-mobile-view.js");
const enPage = read("src/pages/lab/geospatial-supply-chain.astro");
const zhPage = read("src/pages/zh/lab/geospatial-supply-chain.astro");
const routeController = read("src/scripts/geospatial-v4.js");

const fail = (message) => {
  throw new Error(`[geospatial-visual] ${message}`);
};
const requireText = (source, token, label = token) => {
  if (!source.includes(token)) fail(`Missing ${label}`);
};

for (const [token, label] of [
  ["geospatial-advanced-visuals-v2.js", "advanced visual controller import"],
  ["geospatial-visual-state.js", "network-event visual state import"],
  ["geospatial-node-status.js", "node-status visual layer import"],
  ["geospatial-layer-visuals.js", "analysis-layer visual mode import"],
  ["geospatial-layout-polish.js", "map-first layout polish import"],
  ["geospatial-mobile-view.js", "mobile map view switcher import"],
]) requireText(component, token, label);
requireText(enPage, "GeospatialAdvancedVisuals", "English advanced visual mount");
requireText(zhPage, "GeospatialAdvancedVisuals", "Chinese advanced visual mount");

for (const [token, label] of [
  ["geo4__flow-canvas", "canvas route-flow overlay"],
  ["prefers-reduced-motion", "reduced-motion accessibility"],
  ["geo4-flow-toggle", "animation toggle"],
  ["geo4-flow-speed", "flow speed control"],
  ["geo4-flow-density", "particle density control"],
  ["geo4-flow-glow", "route glow control"],
  ["geo4-flow-ambient", "ambient visual control"],
  ["#d8ff6b", "optimal-route capture colour"],
  ["particleCountForFlow", "flow-scaled particle density"],
  ["pointAlongPolyline", "route particle interpolation"],
  ["latLngToContainerPoint", "Leaflet map projection coupling"],
  ["Flow:\\s*", "flow extraction from verified route tooltip"],
]) requireText(controller, token, label);

for (const [token, label] of [
  ["geo4__scenario-ribbon", "network event ribbon"],
  ["geo4-road-mode", "road scenario coupling"],
  ["geo4-congestion", "congestion severity coupling"],
  ["geo4-closure", "closure severity coupling"],
  ["data-level", "visual intensity state"],
]) requireText(visualState, token, label);

for (const [token, label] of [
  ["geo4__flow-tier", "flow hierarchy legend"],
  ["geo4__node-canvas", "node status canvas"],
  ["Facility outflow", "source node semantics"],
  ["Demand inflow", "sink node semantics"],
  ["routeState.routes", "verified route node aggregation"],
  ["latLngToContainerPoint", "node status map projection"],
]) requireText(nodeStatus, token, label);

for (const [token, label] of [
  ["geo4__layer-chip", "analysis layer chip"],
  ["geo4__layer-tint", "analysis layer tint"],
  ["data-analysis-layer", "analysis layer state"],
  ["geo4-layer", "functional layer coupling"],
  ["coverage", "coverage visual mode"],
  ["utilisation", "utilisation visual mode"],
  ["inventory", "inventory visual mode"],
  ["risk", "risk visual mode"],
]) requireText(layerVisuals, token, label);

for (const [token, label] of [
  [".geo4__console", "right-side function console layout"],
  [".geo4__results", "right-lower result module layout"],
  ["right:.7rem", "shared right alignment"],
  ["height:calc(61% - .7rem)", "upper console height"],
  ["height:calc(39% - .7rem)", "lower result height"],
]) requireText(layoutPolish, token, label);

for (const [token, label] of [
  ["geo4__mobile-nav", "mobile view navigation"],
  ["data-mobile-view=\"map\"", "mobile map mode button"],
  ["data-mobile-view=\"controls\"", "mobile controls mode button"],
  ["data-mobile-view=\"results\"", "mobile results mode button"],
  ["data-mobile-view=\"map\"] .geo4__console", "map-first hidden console state"],
  ["setView(\"map\")", "map-first mobile default"],
]) requireText(mobileView, token, label);

requireText(routeController, "reconstructGraphPath", "exact Dijkstra path reconstruction in functional route controller");
requireText(routeController, "activeGraph.scenario", "route geometry tied to the active OSM disruption scenario");

const metrics = buildPolylineMetrics([
  { x: 0, y: 0 },
  { x: 30, y: 40 },
  { x: 80, y: 40 },
]);
if (Math.abs(metrics.total - 100) > 1e-9) fail("Unexpected route metric length");
const midpoint = pointAlongPolyline(metrics, 50);
if (!midpoint || Math.abs(midpoint.x - 30) > 1e-9 || Math.abs(midpoint.y - 40) > 1e-9) fail("Particle interpolation is not deterministic");
if (particleCountForFlow(1000, 1000, 4) <= particleCountForFlow(100, 1000, 4)) fail("Particle count does not scale with route flow");

console.log(
  "[geospatial-visual] PASS: route flow, event-state, node-status, analysis layers, desktop right-stack, mobile map-first switching, reduced-motion and geometry checks passed.",
);