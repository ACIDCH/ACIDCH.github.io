import { performance } from "node:perf_hooks";

import {
  buildGraphSpatialIndex,
  compareScenarioResults,
  graphNetworkMatrix,
  solveTwoEchelonNetwork,
} from "../src/lib/geospatial/decisionEngine.js";
import {
  analyseRoadCriticality,
  runTwoEchelonMonteCarlo,
} from "../src/lib/geospatial/analysisEngine.js";
import {
  assignTripsToVehicles,
  buildSplitDeliveryRoutes,
} from "../src/lib/geospatial/fleetEngine.js";
import { createNetworkMatrix } from "../src/lib/geospatial/networkMatrix.js";

const facilities = [
  {
    name: "328 Ponsonby Road",
    role: "warehouse",
    point: { lat: -36.8487099, lon: 174.7439349 },
  },
  {
    name: "322 Great North Road",
    role: "factory",
    point: { lat: -36.8670281, lon: 174.7296841 },
  },
  {
    name: "214 Green Lane West",
    role: "warehouse",
    point: { lat: -36.8962938, lon: 174.7794052 },
  },
  {
    name: "151 Beach Road",
    role: "warehouse",
    point: { lat: -36.8495463, lon: 174.7741554 },
  },
  {
    name: "76 Coates Avenue",
    role: "warehouse",
    point: { lat: -36.8560582, lon: 174.8147599 },
  },
  {
    name: "151 Neilson Street",
    role: "factory",
    point: { lat: -36.9267696, lon: 174.7928305 },
  },
].map((item, index) => ({ ...item, id: `facility-${index}`, policy: "auto" }));

const demandNames = [
  "Auckland CBD",
  "Epsom",
  "Grey Lynn",
  "Mount Eden",
  "Newmarket",
  "Onehunga",
  "Orakei",
  "Ponsonby",
  "Remuera",
  "Three Kings",
];
const demandValues = [4000, 600, 700, 800, 500, 600, 400, 700, 900, 400];
const demandCoordinates = [
  [-36.848911, 174.7652256],
  [-36.8858447, 174.7734616],
  [-36.859922, 174.7364178],
  [-36.8816475, 174.761999],
  [-36.8674453, 174.7780755],
  [-36.9229255, 174.7853896],
  [-36.8559243, 174.8143892],
  [-36.8501916, 174.742149],
  [-36.8759344, 174.8014178],
  [-36.9090049, 174.7583572],
];
const demands = demandNames.map((name, index) => ({
  id: `demand-${index}`,
  name,
  demand: demandValues[index],
  point: { lat: demandCoordinates[index][0], lon: demandCoordinates[index][1] },
}));

const pricing = { costPerKm: 0.72, costPerMinute: 0.35 };
const scenarioParams = {
  mode: "baseline",
  congestionSeverity: 0.35,
  congestionShare: 0.35,
  closureShare: 0.01,
  newRoadLinks: 4,
  maxNewRoadKm: 0.65,
  newRoadSpeedKph: 50,
  seed: 708709,
};
const factoryIndices = facilities.flatMap((item, index) =>
  item.role === "factory" ? [index] : [],
);
const warehouseIndices = facilities.flatMap((item, index) =>
  item.role === "warehouse" ? [index] : [],
);

function timed(run) {
  const start = performance.now();
  const value = run();
  return { value, ms: performance.now() - start };
}

function matrixRows(matrix, rows) {
  return createNetworkMatrix({
    distanceKm: rows.map((index) => matrix.distanceKm[index]),
    durationMin: rows.map((index) => matrix.durationMin[index]),
    costPerKm: matrix.pricing.costPerKm,
    costPerMinute: matrix.pricing.costPerMinute,
    ...matrix.provenance,
    method: `${matrix.provenance.method}:performance-warehouse-demand`,
  });
}

const loadStart = performance.now();
const { loadAucklandBaselineGraph } =
  await import("../src/data/geospatial/aucklandBaselineSnapshot.js");
const graph = await loadAucklandBaselineGraph();
const graphLoadMs = performance.now() - loadStart;
const spatialIndex = timed(() => buildGraphSpatialIndex(graph));

const allMatrix = timed(() =>
  graphNetworkMatrix({
    graph,
    sources: facilities.map((item) => item.point),
    destinations: demands.map((item) => item.point),
    scenarioParams,
    ...pricing,
  }),
);
const factoryWarehouse = graphNetworkMatrix({
  graph,
  sources: factoryIndices.map((index) => facilities[index].point),
  destinations: warehouseIndices.map((index) => facilities[index].point),
  scenarioParams,
  ...pricing,
});
const warehouseDemandMatrix = matrixRows(
  allMatrix.value.networkMatrix,
  warehouseIndices,
);

const solve = () =>
  solveTwoEchelonNetwork({
    factoryWarehouseMatrix: factoryWarehouse.networkMatrix,
    warehouseDemandMatrix,
    demands: demandValues,
    factoryCapacities: factoryIndices.map(() => 6000),
    warehouseCapacities: warehouseIndices.map(() => 6000),
    warehousePolicies: warehouseIndices.map(() => "auto"),
    maxOpen: 4,
    fixedCost: 350058,
    serviceThreshold: 30,
    serviceMetric: "durationMin",
    redundancy: 1,
  });
const firstOptimisation = timed(solve);
const repeatOptimisation = timed(solve);
const solution = firstOptimisation.value;

const fleetMatrix = graphNetworkMatrix({
  graph,
  sources: [
    facilities[warehouseIndices[0]].point,
    ...demands.map((item) => item.point),
  ],
  destinations: [
    facilities[warehouseIndices[0]].point,
    ...demands.map((item) => item.point),
  ],
  scenarioParams,
  ...pricing,
}).networkMatrix;
const fleet = timed(() => {
  const plan = buildSplitDeliveryRoutes({
    deliveries: demands,
    durationMatrix: fleetMatrix.durationMin,
    distanceMatrix: fleetMatrix.distanceKm,
    vehicleCapacity: 120,
  });
  return {
    plan,
    schedule: assignTripsToVehicles(plan.trips, {
      vehicleCount: 20,
      shiftHours: 8,
      tripsPerVehicle: 5,
    }),
  };
});

const monteCarlo = timed(() =>
  runTwoEchelonMonteCarlo({
    useGraph: false,
    entities: { facilities, demands },
    baseNetworkMatrix: allMatrix.value.networkMatrix,
    baseFactoryWarehouseMatrix: factoryWarehouse.networkMatrix,
    pricing,
    baseDemands: demandValues,
    demandMultiplier: 1,
    facilityCapacity: 6000,
    maxOpen: 4,
    fixedCost: 350058,
    serviceThreshold: 30,
    serviceMetric: "durationMin",
    redundancy: 1,
    scenarioParams,
    eventId: "none",
    runs: 100,
    seed: 708709,
    inventory: { mean: 120, sd: 25, leadTime: 2, leadTimeSd: 0, z: 1.645 },
  }),
);

const normalisedSolution = {
  factoryAssignments: solution.factoryWarehouseFlows.map((flow) => ({
    ...flow,
    factory: factoryIndices[flow.factory],
    warehouse: warehouseIndices[flow.warehouse],
  })),
  assignments: solution.warehouseDemandFlows.map((flow) => ({
    ...flow,
    hub: warehouseIndices[flow.warehouse],
  })),
};
const criticality = timed(() =>
  analyseRoadCriticality({
    graph,
    entities: { facilities, demands },
    solution: normalisedSolution,
    scenario: allMatrix.value.scenario,
    pricing,
    maxCandidates: 24,
    unmetPenaltyNZD: 1000,
  }),
);
const comparison = timed(() =>
  compareScenarioResults(
    { ...solution, expectedCost: monteCarlo.value.expectedCost },
    { ...repeatOptimisation.value, expectedCost: monteCarlo.value.expectedCost * 1.01 },
  ),
);

const extraWarehouses = Array.from({ length: 6 }, (_, index) => ({
  lat:
    facilities[warehouseIndices[index % warehouseIndices.length]].point.lat +
    0.0005 * (index + 1),
  lon:
    facilities[warehouseIndices[index % warehouseIndices.length]].point.lon -
    0.0004 * (index + 1),
}));
const enlargedWarehousePoints = [
  ...warehouseIndices.map((index) => facilities[index].point),
  ...extraWarehouses,
];
const enlarged = timed(() => {
  const fw = graphNetworkMatrix({
    graph,
    sources: factoryIndices.map((index) => facilities[index].point),
    destinations: enlargedWarehousePoints,
    scenarioParams,
    ...pricing,
  }).networkMatrix;
  const wd = graphNetworkMatrix({
    graph,
    sources: enlargedWarehousePoints,
    destinations: demands.map((item) => item.point),
    scenarioParams,
    ...pricing,
  }).networkMatrix;
  return solveTwoEchelonNetwork({
    factoryWarehouseMatrix: fw,
    warehouseDemandMatrix: wd,
    demands: demandValues,
    factoryCapacities: factoryIndices.map(() => 12000),
    warehouseCapacities: enlargedWarehousePoints.map(() => 6000),
    warehousePolicies: enlargedWarehousePoints.map(() => "auto"),
    maxOpen: 4,
    fixedCost: 350058,
    serviceThreshold: 30,
    serviceMetric: "durationMin",
    redundancy: 1,
  });
});

console.log(
  JSON.stringify(
    {
      scale: {
        nodes: graph.nodes.size,
        edges: graph.edges.length,
        facilities: 6,
        demands: 10,
      },
      timingsMs: {
        baselineGraphParseLoad: graphLoadMs,
        spatialIndexBuild: spatialIndex.ms,
        networkMatrix: allMatrix.ms,
        firstOptimisation: firstOptimisation.ms,
        repeatOptimisation: repeatOptimisation.ms,
        fleetSolve: fleet.ms,
        monteCarlo100: monteCarlo.ms,
        criticality: criticality.ms,
        scenarioComparison: comparison.ms,
        enlargedCandidateSet: enlarged.ms,
      },
      results: {
        solverMode: solution.solverMode,
        openWarehouses: solution.selectedWarehouses.length,
        fleetTrips: fleet.value.plan.trips.length,
        workerCandidates: criticality.value.candidateCount,
        enlargedWarehouses: enlargedWarehousePoints.length,
        enlargedSolverMode: enlarged.value?.solverMode,
      },
    },
    null,
    2,
  ),
);
