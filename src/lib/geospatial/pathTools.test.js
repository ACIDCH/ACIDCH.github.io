import { describe, expect, it } from "vitest";
import { routeGraphNeedsRefresh } from "./pathTools.js";

describe("routeGraphNeedsRefresh", () => {
  const baselineGraph = { version: "baseline" };
  const liveGraph = { version: "live" };
  const bounds = [-37.2, 174.5, -36.5, 175.0];
  const point = { lat: -36.85, lon: 174.76 };

  it("requires a refresh for the built-in baseline graph in OSM mode", () => {
    expect(
      routeGraphNeedsRefresh({
        engine: "osm",
        graph: baselineGraph,
        baselineGraph,
        graphBounds: bounds,
        points: [point],
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
