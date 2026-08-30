import { describe, expect, it, vi } from "vitest";
import { createGisServices } from "./gisServices.js";

function jsonResponse(payload, status = 200) {
  return new globalThis.Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("GIS service clients", () => {
  it("deduplicates and caches identical geocoding", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse([{ lat: "-36.85", lon: "174.76", display_name: "Auckland" }]),
    );
    const services = createGisServices({ fetchImpl, sleep: async () => {} });
    const [a, b] = await Promise.all([
      services.geocode("Auckland"),
      services.geocode("Auckland"),
    ]);
    expect(a).toEqual(b);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("requires OSRM distance and duration before returning a NetworkMatrix", async () => {
    const services = createGisServices({
      fetchImpl: async () => jsonResponse({ distances: [[1200]], durations: [[180]] }),
      sleep: async () => {},
    });
    const matrix = await services.osrmTable(
      [{ lat: 1, lon: 2 }],
      [{ lat: 3, lon: 4 }],
      { costPerKm: 1, costPerMinute: 2 },
    );
    expect(matrix.distanceKm[0][0]).toBeCloseTo(1.2);
    expect(matrix.durationMin[0][0]).toBeCloseTo(3);
    expect(matrix.generalizedCostNZD[0][0]).toBeCloseTo(7.2);
  });

  it("falls back to the secondary Overpass endpoint sequentially", async () => {
    const calls = [];
    const fetchImpl = vi.fn(async (url) => {
      calls.push(String(url));
      if (calls.length === 1) return jsonResponse({ error: true }, 503);
      return jsonResponse({ elements: [{ type: "node", id: 1, lat: 1, lon: 2 }] });
    });
    const services = createGisServices({ fetchImpl, sleep: async () => {} });
    const payload = await services.overpassGraph("[out:json];node(1);out;");
    expect(payload.elements).toHaveLength(1);
    expect(calls).toHaveLength(2);
    expect(calls[0]).toContain("overpass.private.coffee");
    expect(calls[1]).toContain("overpass-api.de");
  });

  it("rejects malformed OSRM routes instead of inventing geometry", async () => {
    const services = createGisServices({
      fetchImpl: async () => jsonResponse({ routes: [{ distance: 1, duration: 1 }] }),
      sleep: async () => {},
    });
    await expect(
      services.osrmRoute([
        { lat: 1, lon: 2 },
        { lat: 3, lon: 4 },
      ]),
    ).rejects.toThrow(/malformed/);
  });

  it("surfaces Nominatim throttling as degraded after bounded retry", async () => {
    const events = [];
    const services = createGisServices({
      fetchImpl: async () => jsonResponse({ error: "rate limited" }, 429),
      sleep: async () => {},
    });
    services.subscribe((event) => events.push(event));
    await expect(services.geocode("Auckland CBD")).rejects.toThrow(/HTTP 429/);
    expect(events.some((event) => event.state === "retrying")).toBe(true);
    expect(events.at(-1).state).toBe("degraded");
  });

  it("rejects invalid payloads from both Overpass endpoints", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ elements: [] }));
    const services = createGisServices({ fetchImpl, sleep: async () => {} });
    await expect(services.overpassGraph("[out:json];way(1);out;")).rejects.toThrow(
      /malformed/,
    );
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("surfaces OSRM HTTP failures without fabricating a matrix", async () => {
    const services = createGisServices({
      fetchImpl: async () => jsonResponse({ message: "unavailable" }, 503),
      sleep: async () => {},
    });
    await expect(
      services.osrmTable([{ lat: 1, lon: 2 }], [{ lat: 3, lon: 4 }]),
    ).rejects.toThrow(/HTTP 503/);
  });
});
