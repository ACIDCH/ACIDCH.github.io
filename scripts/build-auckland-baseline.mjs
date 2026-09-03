import { gzipSync } from "node:zlib";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import {
  nearestGraphNode,
  parseOverpassGraph,
} from "../src/lib/geospatial/decisionEngine.js";

const bbox = [-37.12, 174.58, -36.59, 174.98];
const maxCompactEdgeKm = 0.3;
const latCuts = [-37.12, -36.9875, -36.855, -36.7225, -36.59];
const lonCuts = [174.58, 174.68, 174.78, 174.88, 174.98];
const tiles = latCuts
  .slice(0, -1)
  .flatMap((south, latIndex) =>
    lonCuts
      .slice(0, -1)
      .map((west, lonIndex) => [
        south - (latIndex ? 0.003 : 0),
        west - (lonIndex ? 0.003 : 0),
        latCuts[latIndex + 1] + (latIndex < latCuts.length - 2 ? 0.003 : 0),
        lonCuts[lonIndex + 1] + (lonIndex < lonCuts.length - 2 ? 0.003 : 0),
      ]),
  );
const endpoints = [
  "https://overpass.private.coffee/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass-api.de/api/interpreter",
];
const inputFlag = globalThis.process.argv.indexOf("--input");
const inputPath = inputFlag >= 0 ? globalThis.process.argv[inputFlag + 1] : null;
const tileCacheDirectory = new URL(
  "../tmp/auckland-road-tiles-2026-09-04-v3/",
  import.meta.url,
);
const entityPoints = [
  [-36.7245, 174.6978],
  [-36.7167, 174.75],
  [-36.787, 174.775],
  [-36.6167, 174.675],
  [-36.879, 174.63],
  [-36.819, 174.613],
  [-36.866, 174.657],
  [-36.91, 174.684],
  [-36.8485, 174.7633],
  [-36.877, 174.764],
  [-36.889, 174.797],
  [-36.921, 174.785],
  [-36.869, 174.777],
  [-36.8585, 174.811],
  [-36.896, 174.855],
  [-36.883, 174.915],
  [-36.895, 174.93],
  [-36.992, 174.879],
  [-37.021, 174.901],
  [-37.041, 174.921],
  [-37.066, 174.943],
  [-37.101, 174.956],
  [-36.735, 174.698],
  [-36.742, 174.717],
  [-36.715, 174.748],
  [-36.703, 174.733],
  [-36.814, 174.606],
  [-36.909, 174.681],
  [-36.923, 174.65],
  [-36.882, 174.719],
  [-36.901, 174.785],
  [-36.895, 174.854],
].map(([lat, lon]) => ({ lat, lon }));

async function fetchTile(tile) {
  const query = `[out:json][timeout:60];way["highway"~"^(motorway|motorway_link|trunk|trunk_link|primary|primary_link|secondary|secondary_link|tertiary|tertiary_link)$"](${tile.join(",")});out body;>;out skel qt;`;
  let lastError;
  for (const endpoint of endpoints) {
    try {
      const response = await globalThis.fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "User-Agent":
            "ACIDCH-Portfolio-GIS-Snapshot/1.0 (contact: github.com/acidch)",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: globalThis.AbortSignal.timeout(75_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      if (!Array.isArray(payload?.elements)) {
        throw new Error("Malformed Overpass payload");
      }
      return { payload, endpoint };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function fetchSubdividedTile(tile, depth = 0) {
  const [south, west, north, east] = tile;
  const middleLat = (south + north) / 2;
  const middleLon = (west + east) / 2;
  const overlap = 0.001;
  const childTiles = [
    [south, west, middleLat + overlap, middleLon + overlap],
    [south, middleLon - overlap, middleLat + overlap, east],
    [middleLat - overlap, west, north, middleLon + overlap],
    [middleLat - overlap, middleLon - overlap, north, east],
  ];
  const elements = new Map();
  const usedEndpoints = new Set();
  for (const child of childTiles) {
    let response;
    try {
      response = await fetchTile(child);
    } catch (error) {
      if (depth >= 2) throw error;
      response = await fetchSubdividedTile(child, depth + 1);
    }
    usedEndpoints.add(response.endpoint);
    for (const element of response.payload.elements) {
      elements.set(`${element.type}:${element.id}`, element);
    }
  }
  return {
    payload: { elements: [...elements.values()] },
    endpoint: [...usedEndpoints].join(", "),
  };
}

async function fetchPayload() {
  if (inputPath) {
    const input = JSON.parse(readFileSync(inputPath, "utf8"));
    if (!Array.isArray(input.elements)) throw new Error("Malformed local OSM payload");
    return {
      payload: { elements: input.elements },
      endpoint: input.sourceEndpoint || "local OSM extract",
      sourceDate: input.sourceDate || null,
    };
  }
  mkdirSync(tileCacheDirectory, { recursive: true });
  const elements = new Map();
  const usedEndpoints = new Set();
  for (const [index, tile] of tiles.entries()) {
    globalThis.process.stderr.write(
      `Fetching Auckland road tile ${index + 1}/${tiles.length}\n`,
    );
    const cacheFile = new URL(`tile-${index + 1}.json`, tileCacheDirectory);
    let payload;
    let endpoint = "local tile cache";
    if (existsSync(cacheFile)) {
      payload = JSON.parse(readFileSync(cacheFile, "utf8"));
    } else {
      let response;
      try {
        response = await fetchTile(tile);
      } catch {
        response = await fetchSubdividedTile(tile, 1);
      }
      payload = response.payload;
      endpoint = response.endpoint;
      writeFileSync(cacheFile, JSON.stringify(payload));
    }
    usedEndpoints.add(endpoint);
    for (const element of payload.elements) {
      elements.set(`${element.type}:${element.id}`, element);
    }
  }
  return {
    payload: { elements: [...elements.values()] },
    endpoint: [...usedEndpoints].join(", "),
  };
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
  const pendingStarts = [...retained];
  const keepNode = (id) => {
    const nodeId = String(id);
    if (!retained.has(nodeId)) {
      retained.add(nodeId);
      pendingStarts.push(nodeId);
    }
    return nodeId;
  };
  for (let startIndex = 0; startIndex < pendingStarts.length; startIndex += 1) {
    const start = pendingStarts[startIndex];
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
        if (lengthKm >= maxCompactEdgeKm) {
          keepNode(current);
          break;
        }
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

const { payload, endpoint, sourceDate } = await fetchPayload();
const sourceGraph = parseOverpassGraph(payload.elements);
const compact = compactGraph(sourceGraph);
const snapshot = {
  metadata: {
    name: "Compact Auckland baseline arterial road graph",
    source: inputPath
      ? "OpenStreetMap via BBBike extract"
      : "OpenStreetMap via Overpass",
    sourceEndpoint: endpoint,
    snapshotDate: sourceDate || new Date().toISOString().slice(0, 10),
    version: "auckland-arterial-2026-09-04-v2",
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
const outputFlag = globalThis.process.argv.indexOf("--output");
if (outputFlag >= 0 && globalThis.process.argv[outputFlag + 1]) {
  const outputPath = globalThis.process.argv[outputFlag + 1];
  const source = readFileSync(outputPath, "utf8")
    .replace(
      /export const AUCKLAND_BASELINE_METADATA = Object\.freeze\([\s\S]*?\);/,
      `export const AUCKLAND_BASELINE_METADATA = Object.freeze(${JSON.stringify(snapshot.metadata)});`,
    )
    .replace(
      /const COMPRESSED_SNAPSHOT\s*=\s*"[^"]+";/,
      `const COMPRESSED_SNAPSHOT = ${JSON.stringify(compressed)};`,
    );
  writeFileSync(outputPath, source);
  globalThis.process.stdout.write(`${JSON.stringify(snapshot.metadata)}\n`);
} else {
  globalThis.process.stdout.write(
    `${JSON.stringify(snapshot.metadata)}\n${compressed}\n`,
  );
}
