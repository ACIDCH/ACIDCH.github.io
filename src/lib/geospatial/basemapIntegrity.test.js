import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path) =>
  readFileSync(new globalThis.URL(path, import.meta.url), "utf8");

const config = read("./basemapConfig.js");
const loader = read("../../scripts/geospatial-leaflet-loader.js");
const runtime = read("../../scripts/geospatial-v4.js");

describe("geospatial basemap integrity", () => {
  it("uses the keyed CARTO rastertiles contract from one shared config", () => {
    expect(config).toContain(
      "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png",
    );
    expect(config).toContain("import.meta.env.PUBLIC_CARTO_BASEMAP_KEY");
    expect(config).toContain(
      "${CARTO_RASTER_URL}?key=${encodeURIComponent(CARTO_KEY)}",
    );
    expect(config).not.toMatch(/cb1_[A-Za-z0-9_]+/);
  });

  it("keeps a real OSM fallback and required attribution", () => {
    expect(config).toContain(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    );
    expect(config).toContain("OpenStreetMap</a> contributors");
    expect(config).toContain("CARTO</a>");
    expect(config).toContain('"osm-fallback"');
  });

  it("makes the GIS runtime consume the shared keyed basemap config", () => {
    expect(runtime).toContain(
      'import { getBasemapConfig } from "../lib/geospatial/basemapConfig.js";',
    );
    expect(runtime).toContain("const basemap = getBasemapConfig();");
    expect(runtime).toContain(
      "L.tileLayer(basemap.url, basemap.options).addTo(map);",
    );
    expect(runtime).not.toContain(
      "https://{s}.basemaps.cartocdn.com/dark_all/",
    );
  });

  it("does not monkey-patch Leaflet tileLayer or expose the old failure contract", () => {
    expect(loader).toContain(
      'import { getBasemapSource } from "../lib/geospatial/basemapConfig.js";',
    );
    expect(loader).not.toContain("Leaflet.tileLayer =");
    expect(loader).not.toMatch(/API KEY REQUIRED/i);
    expect(runtime).not.toMatch(/API KEY REQUIRED/i);
  });
});
