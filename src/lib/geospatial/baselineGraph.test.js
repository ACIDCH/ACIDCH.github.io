import { describe, expect, it } from "vitest";
import {
  AUCKLAND_BASELINE_METADATA,
  loadAucklandBaselineGraph,
} from "../../data/geospatial/aucklandBaselineSnapshot.js";
import { dijkstraGraph, nearestGraphNode } from "./decisionEngine.js";

describe("built-in Auckland road graph", () => {
  it("loads a versioned, routable OSM-derived baseline without a live request", async () => {
    const graph = await loadAucklandBaselineGraph();
    expect(graph.version).toBe(AUCKLAND_BASELINE_METADATA.version);
    expect(graph.nodeList.length).toBe(AUCKLAND_BASELINE_METADATA.nodeCount);
    expect(graph.edges.length).toBe(AUCKLAND_BASELINE_METADATA.edgeCount);
    expect(graph.spatialIndex).toBeTruthy();
    const source = nearestGraphNode(graph, { lat: -36.8489, lon: 174.7652 });
    const target = nearestGraphNode(graph, { lat: -36.9229, lon: 174.7854 });
    const route = dijkstraGraph(graph, source.nodeId, {}, "time", {
      targets: [target.nodeId],
    });
    expect(route.distances.get(target.nodeId)).toBeGreaterThan(0);
  });

  it("keeps every generated Auckland facility and demand close to the bundled roads", async () => {
    const graph = await loadAucklandBaselineGraph();
    const scenePoints = [
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
    ];
    const snapDistances = scenePoints.map(
      ([lat, lon]) => nearestGraphNode(graph, { lat, lon }).distanceKm,
    );
    expect(Math.max(...snapDistances)).toBeLessThanOrEqual(2.5);
  });

  it("retains enough road-shape vertices to prevent long straight map chords", async () => {
    const graph = await loadAucklandBaselineGraph();
    const longestCompactEdgeKm = Math.max(...graph.edges.map((edge) => edge.lengthKm));
    expect(longestCompactEdgeKm).toBeLessThanOrEqual(1.2);
  });

  it("rejects a malformed baseline graph instead of presenting it as usable", async () => {
    const { graphFromCompactSnapshot } =
      await import("../../data/geospatial/aucklandBaselineSnapshot.js");
    expect(() =>
      graphFromCompactSnapshot({
        metadata: { version: "broken" },
        nodes: [{ id: "a", lat: 0, lon: 0 }],
        edges: [{ from: "a", to: "missing", lengthKm: 1, timeMin: 1 }],
      }),
    ).toThrow(/invalid road edges/);
  });
});
