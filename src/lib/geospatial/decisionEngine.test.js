import { describe, expect, it } from "vitest";
import {
  aStarGraph,
  applyOdScenario,
  dijkstraGraph,
  graphNetworkMatrix,
  graphOdMatrix,
  inventoryPolicy,
  parseOverpassGraph,
  runMonteCarlo,
  solveFacilityNetwork,
  solveTwoEchelonNetwork,
  solveTransportation,
} from "./decisionEngine.js";
import { createNetworkMatrix } from "./networkMatrix.js";

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
    expect(a.cvar95Cost).toBeGreaterThanOrEqual(a.p95Cost);
    expect(a.costHistogram.length).toBeGreaterThan(0);
  });

  it("memoizes one parsed graph for the exact shared Overpass payload", () => {
    const elements = [
      { type: "node", id: 1, lat: -36.87, lon: 174.76 },
      { type: "node", id: 2, lat: -36.87, lon: 174.77 },
      {
        type: "way",
        id: 10,
        nodes: [1, 2],
        tags: { highway: "primary", maxspeed: "50" },
      },
    ];
    const first = parseOverpassGraph(elements);
    const second = parseOverpassGraph(elements);
    expect(second).toBe(first);
    expect(parseOverpassGraph([...elements])).not.toBe(first);
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
    expect(graph.spatialIndex).toBeTruthy();
  });

  it("builds both physical metrics from the same graph scenario", () => {
    const graph = parseOverpassGraph([
      { type: "node", id: 1, lat: -36.87, lon: 174.76 },
      { type: "node", id: 2, lat: -36.87, lon: 174.77 },
      { type: "node", id: 3, lat: -36.87, lon: 174.78 },
      {
        type: "way",
        id: 10,
        nodes: [1, 2, 3],
        tags: { highway: "primary", maxspeed: "60" },
      },
    ]);
    const result = graphNetworkMatrix({
      graph,
      sources: [{ lat: -36.87, lon: 174.7601 }],
      destinations: [{ lat: -36.87, lon: 174.7799 }],
      costPerKm: 1,
      costPerMinute: 2,
    });
    expect(result.networkMatrix.distanceKm[0][0]).toBeGreaterThan(1);
    expect(result.networkMatrix.durationMin[0][0]).toBeGreaterThan(1);
    expect(result.networkMatrix.generalizedCostNZD[0][0]).toBeGreaterThan(
      result.networkMatrix.distanceKm[0][0],
    );
  });

  it("uses target-aware cached Dijkstra and admissible A* consistently", () => {
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
    const first = dijkstraGraph(graph, "1", {}, "time", { targets: ["3"] });
    const second = dijkstraGraph(graph, "1", {}, "time", { targets: ["3"] });
    const astar = aStarGraph(graph, "1", "3", {}, "time");
    expect(second).toBe(first);
    expect(astar.cost).toBeCloseTo(first.distances.get("3"));
  });

  it("solves an exact Factory to Warehouse to Demand network with conservation", () => {
    const fw = createNetworkMatrix({
      distanceKm: [
        [2, 5],
        [4, 1],
      ],
      durationMin: [
        [4, 10],
        [8, 2],
      ],
      costPerKm: 1,
      costPerMinute: 0.5,
    });
    const wd = createNetworkMatrix({
      distanceKm: [
        [1, 3],
        [3, 1],
      ],
      durationMin: [
        [2, 6],
        [6, 2],
      ],
      costPerKm: 1,
      costPerMinute: 0.5,
    });
    const result = solveTwoEchelonNetwork({
      factoryWarehouseMatrix: fw,
      warehouseDemandMatrix: wd,
      demands: [6, 6],
      factoryCapacities: [8, 8],
      warehouseCapacities: [8, 8],
      maxOpen: 2,
      fixedCost: 10,
      serviceThreshold: 10,
    });
    expect(result.feasible).toBe(true);
    expect(result.solverMode).toBe("exact");
    expect(result.allocatedDemand).toBeCloseTo(12);
    for (const throughput of result.throughput) {
      const inflow = result.factoryWarehouseFlows
        .filter((flow) => flow.warehouse === throughput.warehouse)
        .reduce((sum, flow) => sum + flow.flow, 0);
      const outflow = result.warehouseDemandFlows
        .filter((flow) => flow.warehouse === throughput.warehouse)
        .reduce((sum, flow) => sum + flow.flow, 0);
      expect(inflow).toBeCloseTo(outflow);
      expect(outflow).toBeLessThanOrEqual(throughput.capacity);
    }
  });

  it("labels large facility candidate searches as heuristic", () => {
    const large = Array.from({ length: 14 }, (_, facility) =>
      [1, 2].map((value) => value + facility / 100),
    );
    const result = solveFacilityNetwork({
      matrix: large,
      demands: [2, 2],
      maxOpen: 2,
      threshold: 10,
      facilityCapacity: 10,
      exactLimit: 5,
    });
    expect(result.solverMode).toBe("heuristic");
    expect(result.optimal).toBe(false);
  });
});
