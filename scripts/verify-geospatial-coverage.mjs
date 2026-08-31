import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(
  path.join(root, "src/scripts/geospatial-network-coverage-v2.js"),
  "utf8",
);
const fail = (message) => {
  throw new Error(`[geospatial-coverage] ${message}`);
};

const start = source.indexOf("class Heap");
const end = source.indexOf("\nfunction boot", start);
if (start < 0 || end <= start)
  fail("Unable to extract Coverage V2 bounded-Dijkstra implementation");
const extracted = source.slice(start, end);
const boundedDijkstra = new Function(`${extracted}; return boundedDijkstra;`)();

const graph = {
  edges: [
    { from: "1", to: "2", timeMin: 1, segmentKey: "1-2" },
    { from: "2", to: "3", timeMin: 1, segmentKey: "2-3" },
  ],
  adjacency: new Map([
    ["1", [0]],
    ["2", [1]],
    ["3", []],
  ]),
};
const scenario = (overrides = {}) => ({
  disabled: new Set(),
  factors: new Map(),
  shortcuts: [],
  ...overrides,
});

const baseline = boundedDijkstra(graph, "1", scenario(), 1.5);
if (!baseline.has("1") || !baseline.has("2") || baseline.has("3")) {
  fail("Baseline time threshold should reach node 2 but not node 3");
}

const congested = boundedDijkstra(
  graph,
  "1",
  scenario({ factors: new Map([["1-2", 2]]) }),
  1.5,
);
if (congested.has("2"))
  fail("Congestion factor must push node 2 outside the service-time threshold");

const closed = boundedDijkstra(
  graph,
  "1",
  scenario({ disabled: new Set(["1-2"]) }),
  10,
);
if (closed.has("2") || closed.has("3"))
  fail("Closed first edge must block downstream reachability");

const improved = boundedDijkstra(
  graph,
  "1",
  scenario({
    shortcuts: [{ from: "1", to: "3", timeMin: 0.5, segmentKey: "new:1-3" }],
  }),
  0.75,
);
if (!improved.has("3"))
  fail("Hypothetical new-road shortcut must expand network service reach");

if (!source.includes("edge.timeMin"))
  fail("Coverage must use the real graph timeMin schema");
if (source.includes("edge.travelTimeMin"))
  fail("Legacy invalid travelTimeMin schema must not remain in Coverage V2");
if (!source.includes('state.map?.on("move zoom resize", scheduleDraw)'))
  fail(
    "Map viewport changes must redraw cached coverage without invalidating Dijkstra",
  );
if (source.includes('state.map?.on("move zoom resize", invalidateCoverage)'))
  fail("Map viewport changes must not invalidate the coverage calculation cache");
if (!source.includes("for (const segment of state.coveredSegments)"))
  fail("Coverage draw must reuse preclassified covered segments");

console.log(
  "[geospatial-coverage] PASS: bounded Dijkstra responds correctly to time threshold, congestion, closure and new-road shortcuts using edge.timeMin; viewport redraws preserve the cached service area.",
);
