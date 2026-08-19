import { describe, expect, it } from "vitest";
import {
  changedScenarioParameters,
  compareScenarioSnapshots,
  networkMetricForEngine,
} from "./scenarioComparison.js";

describe("geospatial scenario comparison", () => {
  it("maps network engines to physically meaningful metrics", () => {
    expect(networkMetricForEngine("od")).toEqual({
      key: "delivery-distance",
      unit: "km",
    });
    expect(networkMetricForEngine("osm")).toEqual({
      key: "travel-time",
      unit: "min",
    });
  });

  it("never subtracts distance from travel time across different engines", () => {
    const result = compareScenarioSnapshots(
      {
        params: { engine: "od", objective: "minCost" },
        metrics: { totalCost: 1000, networkValue: 8.4, hubs: 3, coverage: 100 },
      },
      {
        params: { engine: "osm", objective: "minCost" },
        metrics: { totalCost: 950, networkValue: 21.2, hubs: 3, coverage: 100 },
      },
    );

    expect(result.networkComparable).toBe(false);
    expect(result.deltas.network).toBeNull();
    expect(result.deltas.networkPct).toBeNull();
    expect(result.tradeoff).toBe("network-not-comparable");
  });

  it("classifies cost-service tradeoffs only when network units are comparable", () => {
    const result = compareScenarioSnapshots(
      {
        params: { engine: "osm", objective: "minCost" },
        metrics: {
          totalCost: 1000,
          transportCost: 200,
          networkValue: 20,
          hubs: 3,
          coverage: 100,
          fleetCapacity: 120,
          safetyStock: 58,
          reorderPoint: 298,
        },
      },
      {
        params: { engine: "osm", objective: "minCost" },
        metrics: {
          totalCost: 900,
          transportCost: 180,
          networkValue: 24,
          hubs: 2,
          coverage: 98,
          fleetCapacity: 115,
          safetyStock: 60,
          reorderPoint: 300,
        },
      },
    );

    expect(result.networkComparable).toBe(true);
    expect(result.networkMetric).toEqual({ key: "travel-time", unit: "min" });
    expect(result.deltas.totalCost).toBe(-100);
    expect(result.deltas.totalCostPct).toBeCloseTo(-0.1);
    expect(result.deltas.network).toBe(4);
    expect(result.tradeoff).toBe("cost-network-tradeoff");
  });

  it("reports robustness deltas only when both saved states contain robustness results", () => {
    const withBoth = compareScenarioSnapshots(
      {
        params: { engine: "od" },
        metrics: { totalCost: 1000, networkValue: 8 },
        robustness: {
          expectedCost: 1020,
          p95Cost: 1110,
          failureRate: 4,
          stockoutProbability: 5,
        },
      },
      {
        params: { engine: "od" },
        metrics: { totalCost: 980, networkValue: 7.8 },
        robustness: {
          expectedCost: 1000,
          p95Cost: 1060,
          failureRate: 2,
          stockoutProbability: 4,
        },
      },
    );
    expect(withBoth.robustnessComparable).toBe(true);
    expect(withBoth.robustness).toEqual({
      expectedCost: -20,
      p95Cost: -50,
      failureRate: -2,
      stockoutProbability: -1,
    });

    const withOne = compareScenarioSnapshots(
      {
        params: { engine: "od" },
        metrics: { totalCost: 1000, networkValue: 8 },
        robustness: { expectedCost: 1020 },
      },
      {
        params: { engine: "od" },
        metrics: { totalCost: 980, networkValue: 7.8 },
      },
    );
    expect(withOne.robustnessComparable).toBe(false);
    expect(withOne.robustness).toBeNull();
  });

  it("returns changed assumptions in a stable decision-oriented order", () => {
    const changes = changedScenarioParameters(
      { roadMode: "baseline", demandMultiplier: 1, fleet: 20 },
      { roadMode: "mixed", demandMultiplier: 1.15, fleet: 20 },
      ["roadMode", "demandMultiplier", "fleet"],
    );
    expect(changes).toEqual([
      { key: "roadMode", a: "baseline", b: "mixed" },
      { key: "demandMultiplier", a: 1, b: 1.15 },
    ]);
  });
});
