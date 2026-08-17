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
const scenarioVisual = read("src/scripts/geospatial-visual-state.js");
const enPage = read("src/pages/lab/geospatial-supply-chain.astro");
const zhPage = read("src/pages/zh/lab/geospatial-supply-chain.astro");
const routeController = read("src/scripts/geospatial-v4.js");

const fail = (message) => {
  throw new Error(`[geospatial-visual] ${message}`);
};
const requireText = (source, token, label = token) => {
  if (!source.includes(token)) fail(`Missing ${label}`);
};

requireText(component, "geospatial-advanced-visuals-v2.js", "advanced visual controller import");
requireText(component, "geospatial-visual-state.js", "scenario visual-state import");
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
]) {
  requireText(controller, token, label);
}

for (const [token, label] of [
  ["geo4__scenario-ribbon", "scenario-state ribbon"],
  ["geo4__event-vignette", "network-event vignette"],
  ["data-road-visual", "road-event visual state"],
  ["geo4-congestion", "congestion visual coupling"],
  ["geo4-closure", "closure visual coupling"],
  ["geo4-new-roads-out", "new-road visual coupling"],
  ["mixed", "mixed-event visual state"],
]) {
  requireText(scenarioVisual, token, label);
}

requireText(
  routeController,
  "reconstructGraphPath",
  "exact Dijkstra path reconstruction in functional route controller",
);
requireText(
  routeController,
  "activeGraph.scenario",
  "route geometry tied to the active OSM disruption scenario",
);

const metrics = buildPolylineMetrics([
  { x: 0, y: 0 },
  { x: 30, y: 40 },
  { x: 80, y: 40 },
]);
if (Math.abs(metrics.total - 100) > 1e-9) fail("Unexpected route metric length");
const midpoint = pointAlongPolyline(metrics, 50);
if (!midpoint || Math.abs(midpoint.x - 30) > 1e-9 || Math.abs(midpoint.y - 40) > 1e-9) {
  fail("Particle interpolation is not deterministic");
}
if (particleCountForFlow(1000, 1000, 4) <= particleCountForFlow(100, 1000, 4)) {
  fail("Particle count does not scale with route flow");
}

console.log(
  "[geospatial-visual] PASS: optimal-route flow, event-state encoding, reduced-motion handling and deterministic geometry checks passed.",
);