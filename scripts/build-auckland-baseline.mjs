import { gzipSync } from "node:zlib";
import {
  nearestGraphNode,
  parseOverpassGraph,
} from "../src/lib/geospatial/decisionEngine.js";

const bbox = [-36.935, 174.72, -36.84, 174.825];
const query = `[out:json][timeout:35];way["highway"~"^(motorway|motorway_link|trunk|trunk_link|primary|primary_link|secondary|secondary_link|tertiary|tertiary_link)$"](${bbox.join(",")});(._;>;);out body;`;
const endpoints = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];
const entityPoints = [
  [-36.8487099, 174.7439349],
  [-36.8670281, 174.7296841],
  [-36.8962938, 174.7794052],
  [-36.8495463, 174.7741554],
  [-36.8560582, 174.8147599],
  [-36.9267696, 174.7928305],
  [-36.848911, 174.7652256],
  [-36.8858447, 174.7734616],
  [-36.859922, 174.7364178],
  [-36.8816475, 174.761999],
  [-36.8674453, 174.7780755],
  [-36.9229255, 174.7853896],
  [-36.8559243, 174.8143892],
  [-36.8501916, 174.742149],
  [-36.8759344, 174.8014178],
  [-36.9090049, 174.7583572],
].map(([lat, lon]) => ({ lat, lon }));

async function fetchPayload() {
  let lastError;
  for (const endpoint of endpoints) {
    try {
      const response = await globalThis.fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "User-Agent": "ACIDCH-Portfolio-GIS-Snapshot/1.0",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: globalThis.AbortSignal.timeout(50_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      if (!Array.isArray(payload?.elements) || !payload.elements.length) {
        throw new Error("Malformed Overpass payload");
      }
      return { payload, endpoint };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function compactGraph(graph) {
  const neighbours = new Map();
  const incoming = new Map();
  for (const edge of graph.edges) {
    if (!neighbours.has(edge.from)) neighbours.set(edge.from, new Set());
    if (!neighbours.has(edge.to)) neighbours.set(edge.to, new Set());
    neighbours.get(edge.from).add(edge.to);
    neighbours.get(edge.to).add(edge.from);
    incoming.set(edge.to, (incoming.get(edge.to) || 0) + 1);
  }
  const retained = new Set(
    graph.nodeList
      .filter((node) => {
        const degree = neighbours.get(node.id)?.size || 0;
        const out = graph.adjacency.get(node.id)?.length || 0;
        const into = incoming.get(node.id) || 0;
        return degree !== 2 || (out !== 1 && out !== 2) || (into !== 1 && into !== 2);
      })
      .map((node) => node.id),
  );
  for (const point of entityPoints) {
    const snap = nearestGraphNode(graph, point);
    if (snap.nodeId) retained.add(snap.nodeId);
  }

  const edges = [];
  const keepNode = (id) => {
    retained.add(String(id));
    return String(id);
  };
  for (const start of [...retained]) {
    for (const firstId of graph.adjacency.get(start) || []) {
      let edge = graph.edges[firstId];
      let current = edge.to;
      let previous = start;
      let lengthKm = 0;
      let timeMin = 0;
      let highway = edge.highway;
      const sourceWay = edge.wayId;
      let guard = 0;
      while (edge && guard++ < graph.edges.length) {
        lengthKm += edge.lengthKm;
        timeMin += edge.timeMin;
        highway ||= edge.highway;
        current = edge.to;
        if (retained.has(current)) break;
        const choices = (graph.adjacency.get(current) || [])
          .map((id) => graph.edges[id])
          .filter((candidate) => candidate.to !== previous);
        if (choices.length !== 1) {
          keepNode(current);
          break;
        }
        previous = current;
        edge = choices[0];
      }
      if (current === start || !(lengthKm > 0)) continue;
      edges.push({
        id: edges.length,
        from: start,
        to: current,
        lengthKm: Number(lengthKm.toFixed(6)),
        timeMin: Number(timeMin.toFixed(6)),
        highway,
        wayId: sourceWay,
        segmentKey: `${start}:${current}`,
      });
    }
  }
  const usedNodes = new Set(edges.flatMap((edge) => [edge.from, edge.to]));
  const nodes = [...usedNodes]
    .map((id) => graph.nodes.get(id))
    .filter(Boolean)
    .map(({ id, lat, lon }) => ({ id, lat, lon }));
  return { nodes, edges };
}

const { payload, endpoint } = await fetchPayload();
const sourceGraph = parseOverpassGraph(payload.elements);
const compact = compactGraph(sourceGraph);
const snapshot = {
  metadata: {
    name: "Compact Auckland baseline arterial road graph",
    source: "OpenStreetMap via Overpass",
    sourceEndpoint: endpoint,
    snapshotDate: new Date().toISOString().slice(0, 10),
    version: "auckland-arterial-2026-08-30-v1",
    bbox,
    sourceNodeCount: sourceGraph.nodeList.length,
    sourceEdgeCount: sourceGraph.edges.length,
    nodeCount: compact.nodes.length,
    edgeCount: compact.edges.length,
    speedAssumptions:
      "OSM maxspeed when present; otherwise highway-class defaults in decisionEngine.parseOverpassGraph",
    includedHighways:
      "motorway, trunk, primary, secondary, tertiary and their link classes",
  },
  ...compact,
};
const compressed = gzipSync(globalThis.Buffer.from(JSON.stringify(snapshot))).toString(
  "base64",
);
globalThis.process.stdout.write(`${JSON.stringify(snapshot.metadata)}\n${compressed}\n`);
