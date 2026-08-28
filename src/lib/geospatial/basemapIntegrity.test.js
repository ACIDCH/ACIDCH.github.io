import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  new globalThis.URL("../../scripts/geospatial-leaflet-loader.js", import.meta.url),
  "utf8",
);

describe("geospatial basemap integrity", () => {
  it("configures Carto Dark Matter without embedding a credential", () => {
    expect(source).toContain(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
    );
    expect(source).toContain("import.meta.env.PUBLIC_CARTO_BASEMAP_KEY");
    expect(source).toContain("encodeURIComponent(CARTO_KEY)");
    expect(source).not.toMatch(/cb1_[A-Za-z0-9_]+/);
  });

  it("keeps the OSM fallback and required attribution", () => {
    expect(source).toContain(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    );
    expect(source).toContain("OpenStreetMap</a> contributors");
    expect(source).toContain("CARTO</a>");
    expect(source).toContain(
      'target.dataset.leafletBasemap = CARTO_KEY ? "carto-dark-matter" : "osm-fallback"',
    );
    expect(source).toContain('setState("ready", "bundle")');
  });

  it("does not expose an API-key-required failure state", () => {
    expect(source).not.toMatch(/API KEY REQUIRED/i);
    expect(source).not.toMatch(/cartocdn\.com\/dark_all\/[^\s"']+\?key=$/);
  });
});
