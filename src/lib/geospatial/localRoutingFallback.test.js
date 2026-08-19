import { describe, expect, it } from "vitest";
import { parseOverpassGraph } from "./decisionEngine.js";
import { buildLocalTablePayload, parseOsrmTableRequest } from "./localRoutingFallback.js";

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

  it("parses OSRM table coordinates and source/destination indexes", () => {
    const request = parseOsrmTableRequest(
      "https://router.project-osrm.org/table/v1/driving/174.76,-36.87;174.78,-36.87?sources=0&destinations=1&annotations=distance,duration",
    );
    expect(request?.points).toHaveLength(2);
    expect(request?.sources).toEqual([0]);
    expect(request?.destinations).toEqual([1]);
  });

  it("builds OSRM-compatible distance and duration tables from the loaded graph", () => {
    const payload = buildLocalTablePayload(
      "https://router.project-osrm.org/table/v1/driving/174.76,-36.87;174.78,-36.87?sources=0&destinations=1&annotations=distance,duration",
      graph,
    );
    expect(payload?.code).toBe("Ok");
    expect(payload?.distances).toHaveLength(1);
    expect(payload?.distances[0]).toHaveLength(1);
    expect(payload?.distances[0][0]).toBeGreaterThan(1000);
    expect(payload?.durations[0][0]).toBeGreaterThan(0);
  });
});
