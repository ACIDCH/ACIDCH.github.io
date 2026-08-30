import { describe, expect, it } from "vitest";
import {
  applyNetworkScenario,
  assertNetworkMatrix,
  createNetworkMatrix,
  networkMatricesComparable,
  networkMatrixFromDistance,
  networkMatrixFromOsrm,
  repriceNetworkMatrix,
} from "./networkMatrix.js";

describe("NetworkMatrix", () => {
  it("keeps distance, duration and generalized cost separate", () => {
    const matrix = createNetworkMatrix({
      distanceKm: [[10]],
      durationMin: [[30]],
      costPerKm: 2,
      costPerMinute: 1,
      source: "test",
    });
    expect(matrix.generalizedCostNZD[0][0]).toBe(50);
    expect(matrix.units).toEqual({
      distanceKm: "km",
      durationMin: "min",
      generalizedCostNZD: "NZD",
    });
    expect(assertNetworkMatrix(matrix)).toBe(matrix);
  });

  it("rejects mixed matrix dimensions and invalid values", () => {
    expect(() =>
      createNetworkMatrix({ distanceKm: [[1, 2]], durationMin: [[1]] }),
    ).toThrow(/dimensions/);
    expect(() =>
      createNetworkMatrix({ distanceKm: [[-1]], durationMin: [[1]] }),
    ).toThrow(/invalid/);
  });

  it("derives one internally consistent Fast OD matrix", () => {
    const matrix = networkMatrixFromDistance([[35]], {
      assumedSpeedKph: 35,
      costPerKm: 1,
      costPerMinute: 0.5,
    });
    expect(matrix.durationMin[0][0]).toBeCloseTo(60);
    expect(matrix.generalizedCostNZD[0][0]).toBeCloseTo(65);
    expect(matrix.provenance.method).toBe("single-road-distance-baseline");
  });

  it("requires OSRM distance and duration together", () => {
    expect(() => networkMatrixFromOsrm({ distances: [[1000]] })).toThrow(/include/);
    const matrix = networkMatrixFromOsrm(
      { distances: [[1000]], durations: [[120]] },
      { costPerKm: 1, costPerMinute: 2 },
    );
    expect(matrix.distanceKm[0][0]).toBe(1);
    expect(matrix.durationMin[0][0]).toBe(2);
    expect(matrix.generalizedCostNZD[0][0]).toBe(5);
  });

  it("only compares scenarios with identical cost meaning", () => {
    const base = networkMatrixFromDistance([[1]], { costPerKm: 1 });
    const same = repriceNetworkMatrix(base, { costPerKm: 1 });
    const different = repriceNetworkMatrix(base, { costPerKm: 2 });
    expect(networkMatricesComparable(base, same)).toBe(true);
    expect(networkMatricesComparable(base, different)).toBe(false);
  });

  it("applies congestion to time without silently changing distance", () => {
    const base = networkMatrixFromDistance([[10]], { costPerKm: 1, costPerMinute: 1 });
    const scenario = applyNetworkScenario(base, {
      mode: "congestion",
      congestionShare: 1,
      congestionSeverity: 0.5,
      seed: 42,
    });
    expect(scenario.distanceKm).toEqual(base.distanceKm);
    expect(scenario.durationMin[0][0]).toBeGreaterThan(base.durationMin[0][0]);
    expect(scenario.generalizedCostNZD[0][0]).toBeGreaterThan(
      base.generalizedCostNZD[0][0],
    );
  });
});
