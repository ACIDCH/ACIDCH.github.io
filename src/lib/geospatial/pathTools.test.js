import { describe, expect, it } from "vitest";
import {
  connectRouteEndpoints,
  reconstructGraphPath,
  routeGraphNeedsRefresh,
} from "./pathTools.js";

function rerouteTestGraph() {
  const nodes = new Map([
    ["a", { id: "a", lat: -36.86, lon: 174.75 }],
    ["b", { id: "b", lat: -36.85, lon: 174.76 }],
    ["c", { id: "c", lat: -36.84, lon: 174.77 }],
  ]);
  const edges = [
    { from: "a", to: "b", segmentKey: "ab", lengthKm: 1, timeMin: 1 },
    { from: "b", to: "c", segmentKey: "bc", lengthKm: 1, timeMin: 1 },
    { from: "a", to: "c", segmentKey: "ac", lengthKm: 4, timeMin: 4 },
  ];
  const adjacency = new Map([
    ["a", [0, 2]],
    ["b", [1]],
    ["c", []],
  ]);
  return { nodes, nodeList: [...nodes.values()], edges, adjacency, maxSpeedKph: 60 };
}

describe("connectRouteEndpoints", () => {
  const source = { lat: -36.86, lon: 174.75 };
  const destination = { lat: -36.84, lon: 174.79 };

  it("keeps a same-node graph path drawable by attaching the real endpoints", () => {
    expect(
      connectRouteEndpoints([{ lat: -36.85, lon: 174.77 }], source, destination),
    ).toEqual([source, { lat: -36.85, lon: 174.77 }, destination]);
  });

  it("removes adjacent duplicate endpoints", () => {
    expect(
      connectRouteEndpoints(
        [source, { lat: -36.85, lon: 174.77 }, destination],
        source,
        destination,
      ),
    ).toEqual([source, { lat: -36.85, lon: 174.77 }, destination]);
  });

  it("filters invalid path points and rejects invalid endpoints", () => {
    expect(
      connectRouteEndpoints(
        [
          { lat: Number.NaN, lon: 174.77 },
          { lat: -36.85, lng: 174.77 },
        ],
        source,
        destination,
      ),
    ).toEqual([source, { lat: -36.85, lon: 174.77 }, destination]);
    expect(connectRouteEndpoints([], { lat: Number.NaN, lon: 1 }, destination)).toEqual(
      [],
    );
    expect(connectRouteEndpoints([], { lat: null, lon: 1 }, destination)).toEqual([]);
    expect(connectRouteEndpoints([], { lat: 91, lon: 1 }, destination)).toEqual([]);
    expect(connectRouteEndpoints({}, source, destination)).toEqual([
      source,
      destination,
    ]);
  });

  it("preserves a normal multi-segment graph path", () => {
    const path = [
      { lat: -36.855, lon: 174.76 },
      { lat: -36.85, lon: 174.77 },
      { lat: -36.845, lon: 174.78 },
    ];
    const connected = connectRouteEndpoints(path, source, destination);
    expect(connected).toEqual([source, ...path, destination]);
    expect(connected.at(0)).toEqual(source);
    expect(connected.at(-1)).toEqual(destination);
  });
});

describe("routeGraphNeedsRefresh", () => {
  const baselineGraph = { version: "baseline" };
  const liveGraph = { version: "live" };
  const bounds = [-37.2, 174.5, -36.5, 175.0];
  const point = { lat: -36.85, lon: 174.76 };

  it("reuses the built-in baseline when it covers every entity", () => {
    expect(
      routeGraphNeedsRefresh({
        engine: "osm",
        graph: baselineGraph,
        baselineGraph,
        graphBounds: bounds,
        points: [point],
      }),
    ).toBe(false);
  });

  it("refreshes the built-in baseline for an entity outside its bounds", () => {
    expect(
      routeGraphNeedsRefresh({
        engine: "osm",
        graph: baselineGraph,
        baselineGraph,
        graphBounds: bounds,
        points: [{ lat: -37.3, lon: 174.76 }],
      }),
    ).toBe(true);
  });

  it("requires a refresh when a live graph does not cover every entity", () => {
    expect(
      routeGraphNeedsRefresh({
        engine: "osm",
        graph: liveGraph,
        baselineGraph,
        graphBounds: [-36.9, 174.7, -36.8, 174.8],
        points: [point, { lat: -37.05, lon: 174.9 }],
      }),
    ).toBe(true);
  });

  it("reuses a live graph when it covers the current entity extent", () => {
    expect(
      routeGraphNeedsRefresh({
        engine: "osm",
        graph: liveGraph,
        baselineGraph,
        graphBounds: bounds,
        points: [point],
      }),
    ).toBe(false);
  });

  it("does not require OSM graph refresh for the Fast OD engine", () => {
    expect(
      routeGraphNeedsRefresh({
        engine: "od",
        graph: null,
        baselineGraph,
        graphBounds: null,
        points: [point],
      }),
    ).toBe(false);
  });
});

describe("reconstructGraphPath", () => {
  it("rebuilds a different route when the active scenario closes a used segment", () => {
    const graph = rerouteTestGraph();
    const baseline = reconstructGraphPath(graph, "a", "c", {}, "time");
    const closure = reconstructGraphPath(
      graph,
      "a",
      "c",
      { disabled: new Set(["bc"]) },
      "time",
    );

    expect(baseline?.coordinates.map((point) => point.lat)).toEqual([
      -36.86, -36.85, -36.84,
    ]);
    expect(closure?.coordinates.map((point) => point.lat)).toEqual([-36.86, -36.84]);
    expect(closure?.cost).toBe(4);
  });
});
