import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../../scripts/geospatial-v4.js", import.meta.url), "utf8");

describe("geospatial basemap integrity", () => {
  it("uses the public OpenStreetMap tile layer", () => {
    expect(source).toContain(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    );
    expect(source).toContain("OpenStreetMap</a> contributors");
  });

  it("does not depend on the retired Carto basemap endpoint", () => {
    expect(source).not.toContain("basemaps.cartocdn.com");
    expect(source).not.toContain("cartodb.com");
    expect(source).not.toMatch(/API KEY REQUIRED/i);
  });
});
