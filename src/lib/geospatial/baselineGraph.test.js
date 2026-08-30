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
