import { describe, expect, it } from "vitest";
import { parseOverpassGraph } from "./decisionEngine.js";
import {
  buildLocalRoutePayload,
  buildLocalTablePayload,
  parseOsrmRouteRequest,
  parseOsrmTableRequest,
} from "./localRoutingFallback.js";

describe("local OSM routing fallback", () => {
  const graph = parseOverpassGraph([
    { type: "node", id: 1, lat: -36.87, lon: 174.76 },
    { type: "node", id: 2, lat: -36.87, lon: 174.77 },
    { type: "node", id: 3, lat: -36.87, lon: 174.78 },
    {
      type: "way",
      id: 10,
      nodes: [1, 2, 3],
      tags: { highway: "primary", maxspeed: "50" },
    },
  ]);
  const tableUrl =
    "https://router.project-osrm.org/table/v1/driving/174.76,-36.87;174.78,-36.87?sources=0&destinations=1&annotations=distance,duration";
  const routeUrl =
    "https://router.project-osrm.org/route/v1/driving/174.76,-36.87;174.78,-36.87?overview=full&geometries=geojson";

  it("parses OSRM table coordinates and source/destination indexes", () => {
    const request = parseOsrmTableRequest(tableUrl);
    expect(request?.points).toHaveLength(2);
    expect(request?.sources).toEqual([0]);
    expect(request?.destinations).toEqual([1]);
  });

  it("builds OSRM-compatible distance and duration tables from the loaded graph", () => {
    const payload = buildLocalTablePayload(tableUrl, graph);
    expect(payload?.code).toBe("Ok");
    expect(payload?.distances).toHaveLength(1);
    expect(payload?.distances[0]).toHaveLength(1);
    expect(payload?.distances[0][0]).toBeGreaterThan(1000);
    expect(payload?.durations[0][0]).toBeGreaterThan(0);
  });

  it("parses OSRM route coordinates", () => {
    const request = parseOsrmRouteRequest(routeUrl);
    expect(request?.points).toEqual([
      { lat: -36.87, lon: 174.76 },
      { lat: -36.87, lon: 174.78 },
    ]);
  });

  it("builds OSRM-compatible route geometry from the loaded graph", () => {
    const payload = buildLocalRoutePayload(routeUrl, graph);
    expect(payload?.code).toBe("Ok");
    expect(payload?.routes).toHaveLength(1);
    expect(payload?.routes[0].geometry.type).toBe("LineString");
    expect(payload?.routes[0].geometry.coordinates.length).toBeGreaterThanOrEqual(2);
    expect(payload?.routes[0].distance).toBeGreaterThan(1000);
    expect(payload?.routes[0].duration).toBeGreaterThan(0);
    expect(payload?.waypoints).toHaveLength(2);
  });

  it("keeps cached Table and Route duration aligned with the active congestion scenario", () => {
    const scenario = {
      mode: "congestion",
      congestionSeverity: 1,
      congestionShare: 1,
      seed: 708709,
    };
    const baselineTable = buildLocalTablePayload(tableUrl, graph);
    const scenarioTable = buildLocalTablePayload(tableUrl, graph, scenario);
    const baselineRoute = buildLocalRoutePayload(routeUrl, graph);
    const scenarioRoute = buildLocalRoutePayload(routeUrl, graph, scenario);

    expect(scenarioTable?.durations[0][0]).toBeGreaterThan(
      baselineTable?.durations[0][0] ?? Infinity,
    );
    expect(scenarioRoute?.routes[0].duration).toBeGreaterThan(
      baselineRoute?.routes[0].duration ?? Infinity,
    );
    expect(scenarioRoute?.routes[0].distance).toBeCloseTo(
      baselineRoute?.routes[0].distance ?? 0,
      6,
    );
  });
});
