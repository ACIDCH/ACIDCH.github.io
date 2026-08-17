import { describe, expect, it } from "vitest";
import {
  applyOdScenario,
  graphOdMatrix,
  inventoryPolicy,
  parseOverpassGraph,
  runMonteCarlo,
  solveFacilityNetwork,
  solveTransportation,
} from "./decisionEngine.js";

const matrix = [
  [2.07, 5.8, 2.04, 4.66, 4.12, 10.66, 7.5, 0.31, 7.7, 7.89],
  [4.2, 5.62, 1.29, 4.26, 4.94, 10.03, 9.5, 3.22, 8.51, 6.91],
  [6.45, 1.92, 6.76, 2.79, 3.44, 4.19, 7.26, 7.27, 4.42, 3.23],
  [1.45, 4.95, 4.85, 4.11, 2.47, 9.25, 4.48, 3.52, 4.89, 7.33],
  [5.56, 6.79, 8.98, 7.29, 5.05, 9.13, 0, 7.63, 2.87, 9.6],
  [10.7, 6.17, 10.99, 7.03, 7.69, 1.04, 9.48, 11.52, 6.62, 4.27],
];
const demands = [4000, 600, 700, 800, 500, 600, 400, 700, 900, 400];

function baseSolver(overrides = {}) {
  return solveFacilityNetwork({
    matrix,
    demands,
    maxOpen: 6,
    redundancy: 1,
    threshold: 6,
    facilityCapacity: 10000,
    fixedCost: 350000,
    transportCost: 0.72,
    objective: "minHubs",
    demandMultiplier: 1,
    ...overrides,
  });
}

describe("geospatial decision engine", () => {
  it("reproduces a feasible two-hub baseline coverage solution", () => {
    const solution = baseSolver();
    expect(solution).toBeTruthy();
    expect(solution.selected).toHaveLength(2);
    expect(solution.coverCounts.every((count) => count >= 1)).toBe(true);
    expect(solution.allocatedDemand).toBeCloseTo(demands.reduce((a, b) => a + b, 0));
  });

  it("honours must-open and exclude facility policies", () => {
    const policies = Array(6).fill("auto");
    policies[2] = "must";
    policies[3] = "exclude";
    const solution = baseSolver({ policies, maxOpen: 5 });
    expect(solution).toBeTruthy();
    expect(solution.selected).toContain(2);
    expect(solution.selected).not.toContain(3);
  });

  it("uses capacitated transportation rather than only aggregate capacity", () => {
    const transport = solveTransportation({
      selected: [0, 1],
      matrix: [
        [1, Infinity],
        [Infinity, 1],
      ],
      demands: [8, 8],
      facilityCapacities: 10,
      threshold: 5,
    });
    expect(transport.feasible).toBe(true);
    expect(transport.assignments).toHaveLength(2);
    expect(transport.utilisation[0]).toBeCloseTo(0.8);
    expect(transport.utilisation[1]).toBeCloseTo(0.8);
  });

  it("makes seeded OD uncertainty deterministic", () => {
    const params = {
      mode: "mixed",
      seed: 708709,
      congestionSeverity: 0.35,
      closureShare: 0.1,
      improvement: 0.2,
    };
    expect(applyOdScenario(matrix, params)).toEqual(applyOdScenario(matrix, params));
    expect(applyOdScenario(matrix, params)).not.toEqual(
      applyOdScenario(matrix, { ...params, seed: 708710 }),
    );
  });

  it("calculates the standard safety-stock and reorder-point relationship", () => {
    const result = inventoryPolicy({ mean: 120, sd: 25, leadTime: 2, z: 1.645 });
    expect(result.safetyStock).toBeCloseTo(1.645 * 25 * Math.sqrt(2));
    expect(result.reorderPoint).toBeCloseTo(240 + result.safetyStock);
  });

  it("runs repeatable Monte Carlo robustness output", () => {
    const args = {
      baseMatrix: matrix,
      solverParams: {
        demands,
        maxOpen: 6,
        redundancy: 1,
        threshold: 7,
        facilityCapacity: 10000,
        fixedCost: 350000,
        transportCost: 0.72,
        objective: "minHubs",
      },
      scenarioParams: {
        mode: "mixed",
        congestionSeverity: 0.2,
        closureShare: 0.02,
        improvement: 0.1,
      },
      runs: 20,
      seed: 42,
      facilityNames: ["A", "B", "C", "D", "E", "F"],
      inventory: { mean: 120, sd: 25, leadTime: 2, z: 1.645 },
    };
    const a = runMonteCarlo(args);
    const b = runMonteCarlo(args);
    expect(a).toEqual(b);
    expect(a.runs).toBe(20);
    expect(a.facilityStability).toHaveLength(6);
  });

  it("builds and routes a small OSM edge graph", () => {
    const graph = parseOverpassGraph([
      { type: "node", id: 1, lat: -36.87, lon: 174.76 },
      { type: "node", id: 2, lat: -36.87, lon: 174.77 },
      { type: "node", id: 3, lat: -36.87, lon: 174.78 },
      {
        type: "way",
        id: 10,
        nodes: [1, 2, 3],
        tags: { highway: "primary", maxspeed: "50" },
      },
    ]);
    const result = graphOdMatrix({
      graph,
      sources: [{ lat: -36.87, lon: 174.7601 }],
      destinations: [{ lat: -36.87, lon: 174.7799 }],
      scenarioParams: { mode: "baseline", seed: 1 },
      metric: "distance",
    });
    expect(result.matrix[0][0]).toBeGreaterThan(1);
    expect(result.matrix[0][0]).toBeLessThan(3);
  });
});
