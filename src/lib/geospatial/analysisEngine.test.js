import { describe, expect, it, vi } from "vitest";
import {
  analyseRoadCriticality,
  runGeospatialWorkerTask,
  runMainOptimisation,
  runTwoEchelonMonteCarlo,
} from "./analysisEngine.js";
import { createNetworkMatrix } from "./networkMatrix.js";

function graphFixture() {
  const nodes = new Map([
    ["a", { id: "a", lat: 0, lon: 0 }],
    ["b", { id: "b", lat: 0, lon: 0.01 }],
    ["c", { id: "c", lat: 0.01, lon: 0.005 }],
  ]);
  const edges = [
    {
      from: "a",
      to: "b",
      lengthKm: 1,
      timeMin: 1,
      segmentKey: "direct",
      highway: "primary",
    },
    { from: "a", to: "c", lengthKm: 1, timeMin: 2, segmentKey: "alt-a" },
    { from: "c", to: "b", lengthKm: 1, timeMin: 2, segmentKey: "alt-b" },
  ].map((edge, id) => ({ ...edge, id }));
  return {
    nodes,
    nodeList: [...nodes.values()],
    edges,
    adjacency: new Map([
      ["a", [0, 1]],
      ["c", [2]],
    ]),
    version: "criticality-test",
    maxSpeedKph: 60,
  };
}

function monteCarloPayload() {
  return {
    useGraph: false,
    entities: {
      facilities: [
        {
          id: "f",
          name: "Factory",
          role: "factory",
          policy: "auto",
          point: { lat: 0, lon: 0 },
        },
        {
          id: "w1",
          name: "Warehouse 1",
          role: "warehouse",
          policy: "auto",
          point: { lat: 0, lon: 1 },
        },
        {
          id: "w2",
          name: "Warehouse 2",
          role: "warehouse",
          policy: "auto",
          point: { lat: 0, lon: 2 },
        },
      ],
      demands: [{ id: "d", name: "Demand", demand: 8, point: { lat: 0, lon: 3 } }],
    },
    baseNetworkMatrix: createNetworkMatrix({
      distanceKm: [[3], [1], [2]],
      durationMin: [[6], [2], [4]],
      costPerKm: 1,
      costPerMinute: 0.5,
    }),
    baseFactoryWarehouseMatrix: createNetworkMatrix({
      distanceKm: [[1, 2]],
      durationMin: [[2, 4]],
      costPerKm: 1,
      costPerMinute: 0.5,
    }),
    pricing: { costPerKm: 1, costPerMinute: 0.5 },
    baseDemands: [8],
    demandMultiplier: 1,
    facilityCapacity: 10,
    maxOpen: 1,
    fixedCost: 5,
    serviceThreshold: 10,
    serviceMetric: "distanceKm",
    redundancy: 1,
    scenarioParams: { mode: "mixed", congestionShare: 0.2, closureShare: 0 },
    eventId: "none",
    runs: 20,
    seed: 77,
    inventory: { mean: 8, sd: 1, leadTime: 1, z: 1.645 },
  };
}

describe("background analysis engine", () => {
  it("reproduces two-echelon Monte Carlo output under a fixed seed", () => {
    const first = runTwoEchelonMonteCarlo(monteCarloPayload());
    const second = runTwoEchelonMonteCarlo(monteCarloPayload());
    expect(second).toEqual(first);
    expect(first.successfulRuns).toBe(20);
    expect(first.cvar95Cost).toBeGreaterThanOrEqual(first.p95Cost);
  });

  it("ranks a used direct road above unused alternatives deterministically", () => {
    const payload = {
      graph: graphFixture(),
      entities: {
        facilities: [
          { name: "Factory", role: "factory", point: { lat: 0, lon: 0 } },
          { name: "Warehouse", role: "warehouse", point: { lat: 0, lon: 0.01 } },
        ],
        demands: [],
      },
      solution: {
        factoryAssignments: [{ factory: 0, warehouse: 1, flow: 10 }],
        assignments: [],
      },
      scenario: {},
      pricing: { costPerKm: 1, costPerMinute: 1 },
      maxCandidates: 5,
      unmetPenaltyNZD: 100,
    };
    const first = analyseRoadCriticality(payload);
    const second = analyseRoadCriticality(payload);
    expect(second).toEqual(first);
    expect(first.edges[0].segmentKey).toBe("direct");
    expect(first.edges[0].deltaTravelTimeMin).toBe(3);
    expect(first.edges[0].score).toBe(1);
  });

  it("runs the current and baseline road scenarios without changing main-model output shape", () => {
    const payload = {
      useGraph: true,
      graph: graphFixture(),
      entities: {
        facilities: [
          {
            name: "Factory",
            role: "factory",
            policy: "auto",
            point: { lat: 0, lon: 0 },
          },
          {
            name: "Warehouse",
            role: "warehouse",
            policy: "auto",
            point: { lat: 0.01, lon: 0.005 },
          },
        ],
        demands: [{ name: "Demand", demand: 8, point: { lat: 0, lon: 0.01 } }],
      },
      pricing: { costPerKm: 1, costPerMinute: 0.5 },
      baseDemands: [8],
      demandMultiplier: 1,
      facilityCapacity: 10,
      maxOpen: 1,
      fixedCost: 5,
      serviceThreshold: 10,
      serviceMetric: "durationMin",
      redundancy: 1,
      scenarioParams: { mode: "baseline", seed: 77 },
      baselineScenarioParams: { mode: "baseline", seed: 77 },
      eventId: "none",
      seed: 77,
      enforceFleetCapacity: true,
      totalFleetCapacity: 10,
    };
    const result = runMainOptimisation(payload);
    expect(runGeospatialWorkerTask("mainOptimisation", payload)).toEqual(result);
    expect(result.solution.selected).toEqual([1]);
    expect(result.solution.factoryAssignments[0]).toMatchObject({
      factory: 0,
      warehouse: 1,
      flow: 8,
    });
    expect(result.solution.assignments[0]).toMatchObject({
      hub: 1,
      demand: 0,
      flow: 8,
      distanceKm: 1,
      durationMin: 2,
    });
    expect(result.activeGraph.sourceSnaps).toHaveLength(2);
    expect(result.networkMatrices.twoEchelonRouteContext.scenario).toBeDefined();
    expect(result.baselineSolution).toEqual(result.solution);
  });

  it("parses live Overpass elements through the analysis Worker task", () => {
    const graph = runGeospatialWorkerTask("parseGraph", {
      elements: [
        { type: "node", id: 1, lat: -36.85, lon: 174.76 },
        { type: "node", id: 2, lat: -36.85, lon: 174.77 },
        {
          type: "way",
          id: 10,
          nodes: [1, 2],
          tags: { highway: "primary", maxspeed: "50" },
        },
      ],
    });
    expect(graph.nodes.size).toBe(2);
    expect(graph.edges.length).toBeGreaterThanOrEqual(2);
  });

  it("fetches and parses bounded live-road payloads inside the Worker task", async () => {
    const elements = [
      { type: "node", id: 1, lat: -36.85, lon: 174.76 },
      { type: "node", id: 2, lat: -36.85, lon: 174.77 },
      {
        type: "way",
        id: 10,
        nodes: [1, 2],
        tags: { highway: "primary", maxspeed: "50" },
      },
    ];
    const fetchMock = vi.fn(async () =>
      Promise.resolve(
        new globalThis.Response(JSON.stringify({ elements }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    try {
      const result = await runGeospatialWorkerTask("fetchParseGraph", {
        query: "[out:json];way(1);out body;>;out skel qt;",
        primary: "https://primary.example/interpreter",
        secondary: "https://secondary.example/interpreter",
        maxElements: 10,
        hedgeDelayMs: 50,
      });
      expect(result.elementCount).toBe(3);
      expect(result.graph.edges.length).toBeGreaterThanOrEqual(2);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
