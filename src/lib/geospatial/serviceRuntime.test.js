import { describe, expect, it } from "vitest";
import {
  classifyRuntimeServiceUrl,
  classifyServiceUrl,
  normalizeGisEndpoints,
  rewriteServiceUrl,
  shareJsonResponse,
  timeoutForService,
} from "./serviceRuntime.js";

describe("geospatial service runtime", () => {
  it("classifies the external GIS services used by the lab", () => {
    expect(classifyServiceUrl("https://nominatim.openstreetmap.org/search?q=Auckland")).toBe(
      "nominatim",
    );
    expect(classifyServiceUrl("https://router.project-osrm.org/table/v1/driving/1,2;3,4")).toBe(
      "osrm",
    );
    expect(classifyServiceUrl("https://overpass-api.de/api/interpreter")).toBe("overpass");
    expect(classifyServiceUrl("https://overpass.kumi.systems/api/interpreter")).toBe(
      "overpass",
    );
    expect(classifyServiceUrl("https://maps.mail.ru/osm/tools/overpass/api/interpreter")).toBe(
      "overpass",
    );
    expect(classifyServiceUrl("https://example.com/data.json")).toBeNull();
  });

  it("classifies configured and self-hosted GIS endpoints for health reporting", () => {
    const endpoints = normalizeGisEndpoints({
      nominatim: "http://127.0.0.1:9101/nominatim",
      osrm: "http://127.0.0.1:9102/osrm",
      overpassPrimary: "http://127.0.0.1:9103/api/interpreter",
      overpassSecondary: "https://overpass.example.test/api/interpreter",
    });
    expect(
      classifyRuntimeServiceUrl("http://127.0.0.1:9101/nominatim/search?q=Auckland", endpoints),
    ).toBe("nominatim");
    expect(
      classifyRuntimeServiceUrl("http://127.0.0.1:9102/osrm/table/v1/driving/1,2;3,4", endpoints),
    ).toBe("osrm");
    expect(
      classifyRuntimeServiceUrl("http://127.0.0.1:9103/api/interpreter", endpoints),
    ).toBe("overpass");
    expect(
      classifyRuntimeServiceUrl("https://overpass.example.test/api/interpreter", endpoints),
    ).toBe("overpass");
    expect(classifyRuntimeServiceUrl("https://example.com/data.json", endpoints)).toBeNull();
  });

  it("moves legacy Overpass fallbacks to the configured secondary endpoint", () => {
    expect(rewriteServiceUrl("https://overpass.kumi.systems/api/interpreter")).toBe(
      "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    );
    expect(rewriteServiceUrl("https://overpass.private.coffee/api/interpreter")).toBe(
      "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    );
  });

  it("preserves endpoint paths and queries when a runtime override is supplied", () => {
    const endpoints = normalizeGisEndpoints({
      nominatim: "https://geo.example.test/nominatim",
      osrm: "https://route.example.test/osrm",
      overpassPrimary: "https://overpass.example.test/api/interpreter",
    });
    expect(
      rewriteServiceUrl("https://nominatim.openstreetmap.org/search?q=Epsom&format=jsonv2", endpoints),
    ).toBe("https://geo.example.test/nominatim/search?q=Epsom&format=jsonv2");
    expect(
      rewriteServiceUrl("https://router.project-osrm.org/route/v1/driving/1,2;3,4?steps=false", endpoints),
    ).toBe("https://route.example.test/osrm/route/v1/driving/1,2;3,4?steps=false");
    expect(rewriteServiceUrl("https://overpass-api.de/api/interpreter", endpoints)).toBe(
      "https://overpass.example.test/api/interpreter",
    );
  });

  it("shares one parsed JSON payload across the response and all clones", async () => {
    const response = shareJsonResponse(
      new globalThis.Response(JSON.stringify({ elements: [{ type: "node", id: 1 }] }), {
        headers: { "content-type": "application/json" },
      }),
    );
    const [direct, cloneA, cloneB] = await Promise.all([
      response.json(),
      response.clone().json(),
      response.clone().json(),
    ]);
    expect(direct).toBe(cloneA);
    expect(cloneA).toBe(cloneB);
    expect(direct.elements).toBe(cloneB.elements);
  });

  it("uses finite request budgets without background polling", () => {
    expect(timeoutForService("nominatim")).toBe(12_000);
    expect(timeoutForService("osrm")).toBe(15_000);
    expect(timeoutForService("overpass")).toBe(12_000);
    expect(timeoutForService(null)).toBe(0);
  });
});
