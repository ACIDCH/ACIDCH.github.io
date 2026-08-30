import { describe, expect, it } from "vitest";
import {
  buildPolylineMetrics,
  flattenLatLngs,
  particleCountForFlow,
  pointAlongPolyline,
} from "./flowGeometry.js";

describe("route-flow geometry", () => {
  it("normalises Leaflet-style and coordinate-array paths", () => {
    expect(flattenLatLngs([[1, 2], { lat: 3, lng: 4 }, [[5, 6]]])).toEqual([
      { lat: 1, lng: 2 },
      { lat: 3, lng: 4 },
      { lat: 5, lng: 6 },
    ]);
  });

  it("builds cumulative route length and interpolates along it", () => {
    const metrics = buildPolylineMetrics([
      { x: 0, y: 0 },
      { x: 3, y: 4 },
      { x: 6, y: 4 },
    ]);
    expect(metrics.total).toBeCloseTo(8);
    expect(metrics.cumulative).toEqual([0, 5, 8]);
    const point = pointAlongPolyline(metrics, 6.5);
    expect(point.x).toBeCloseTo(4.5);
    expect(point.y).toBeCloseTo(4);
  });

  it("wraps animation distance and scales particle count with flow", () => {
    const metrics = buildPolylineMetrics([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ]);
    expect(pointAlongPolyline(metrics, 12).x).toBeCloseTo(2);
    expect(particleCountForFlow(100, 1000, 4)).toBeLessThan(
      particleCountForFlow(1000, 1000, 4),
    );
  });
});
