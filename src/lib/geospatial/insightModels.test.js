import { describe, expect, it } from "vitest";
import { createNetworkMatrix } from "./networkMatrix.js";
import { buildTwoEchelonSankey, explainSupplyChainNode } from "./insightModels.js";

function snapshot() {
  return {
    freshness: { main: "current" },
    entities: {
      facilities: [
        { id: "f", name: "Factory", role: "factory" },
        { id: "w", name: "Warehouse", role: "warehouse" },
        { id: "w2", name: "Alternative", role: "warehouse" },
      ],
      demands: [{ id: "d", name: "Customer", demand: 10 }],
    },
    networkMatrices: {
      active: createNetworkMatrix({
        distanceKm: [[4], [2], [3]],
        durationMin: [[8], [4], [6]],
        costPerKm: 1,
        costPerMinute: 0.5,
      }),
    },
    scenarioInputs: { facilityCapacity: 20, fixedCost: 50 },
    mainSolution: {
      selected: [1],
      totalDemand: 10,
      coverCounts: [2],
      disruptionEvent: "none",
      throughput: [{ warehouse: 0, capacity: 20, utilisation: 0.5 }],
      factoryAssignments: [{ factory: 0, warehouse: 1, flow: 10 }],
      assignments: [
        { hub: 1, demand: 0, flow: 10, distanceKm: 2, durationMin: 4, networkCost: 4 },
      ],
    },
  };
}

describe("decision insight models", () => {
  it("builds a real Factory to Warehouse to Demand Sankey from structured flow", () => {
    const model = buildTwoEchelonSankey(snapshot());
    expect(model.nodes.map((node) => node.type)).toEqual([
      "factory",
      "warehouse",
      "demand",
    ]);
    expect(model.links).toHaveLength(2);
    expect(model.links.every((link) => link.thickness > 0)).toBe(true);
    expect(model.totalFlow).toBe(10);
  });

  it("selects an independent alternative warehouse for demand explanation", () => {
    const explanation = explainSupplyChainNode(snapshot(), {
      type: "demand",
      index: 0,
    });
    expect(explanation.fields.assignedWarehouse).toBe("Warehouse");
    expect(explanation.fields.alternative.name).toBe("Alternative");
    expect(explanation.fields.coverageCount).toBe(2);
  });

  it("returns an explicit stale explanation instead of old model output", () => {
    const stale = snapshot();
    stale.freshness.main = "stale";
    expect(explainSupplyChainNode(stale, { type: "warehouse", index: 1 }).state).toBe(
      "stale",
    );
  });
});
