import { describe, expect, it } from "vitest";
import {
  nearestNeighbourTour,
  solveTspTour,
  splitByCapacity,
  totalTripFlow,
} from "./fleetTour.js";

describe("fleet road-tour completeness", () => {
  it("returns a complete exact tour when every stop can be visited and the vehicle can return", () => {
    const result = solveTspTour([
      [0, 4, 7],
      [4, 0, 3],
      [7, 3, 0],
    ]);
    expect(result.complete).toBe(true);
    expect(result.method).toBe("exact");
    expect(result.order[0]).toBe(0);
    expect(result.order.at(-1)).toBe(0);
    expect(new Set(result.order.slice(1, -1))).toEqual(new Set([1, 2]));
  });

  it("rejects a partial nearest-neighbour tour when a demand stop is unreachable", () => {
    const result = nearestNeighbourTour([
      [0, 2, Infinity],
      [2, 0, Infinity],
      [Infinity, Infinity, 0],
    ]);
    expect(result.complete).toBe(false);
    expect(result.unvisited).toContain(2);
    expect(result.cost).toBe(Infinity);
  });

  it("rejects a tour that cannot return to the depot", () => {
    const result = solveTspTour([
      [0, 2],
      [Infinity, 0],
    ]);
    expect(result.complete).toBe(false);
    expect(result.returnBlocked).toBe(true);
  });

  it("capacity splitting conserves every allocated unit", () => {
    const deliveries = [
      { demand: "A", flow: 130 },
      { demand: "B", flow: 70 },
    ];
    const trips = splitByCapacity([0, 1, 2, 0], deliveries, 80);
    expect(trips).toHaveLength(3);
    expect(totalTripFlow(trips)).toBeCloseTo(200);
  });
});
