import {
  aStarGraph,
  dijkstraGraph,
  solveTransportation,
  solveTwoEchelonNetwork,
} from "../src/lib/geospatial/decisionEngine.js";
import {
  buildSplitDeliveryRoutes,
  validateFleetPlan,
} from "../src/lib/geospatial/fleetEngine.js";
import { createNetworkMatrix } from "../src/lib/geospatial/networkMatrix.js";

function pathGraph() {
  const nodes = new Map(
    [
      ["a", 0, 0],
      ["b", 0, 0.01],
      ["c", 0, 0.02],
      ["d", 0, 0.03],
    ].map(([id, lat, lon]) => [id, { id, lat, lon }]),
  );
  const edges = [
    ["a", "b", 2],
    ["a", "c", 5],
    ["b", "c", 1],
    ["b", "d", 10],
    ["c", "d", 2],
  ].map(([from, to, cost], id) => ({
    id,
    from,
    to,
    lengthKm: cost,
    timeMin: cost,
    segmentKey: `${from}-${to}`,
  }));
  const adjacency = new Map();
  edges.forEach((edge) => {
    if (!adjacency.has(edge.from)) adjacency.set(edge.from, []);
    adjacency.get(edge.from).push(edge.id);
  });
  return {
    nodes,
    nodeList: [...nodes.values()],
    edges,
    adjacency,
    version: "benchmark",
    maxSpeedKph: 60,
  };
}

const graph = pathGraph();
const dijkstra = dijkstraGraph(graph, "a", {}, "time", { targets: ["d"] });
const astar = aStarGraph(graph, "a", "d", {}, "time");

const transport = solveTransportation({
  selected: [0, 1],
  matrix: [
    [2, 5],
    [3, 1],
  ],
  demands: [4, 6],
  facilityCapacities: [6, 6],
});

const factoryWarehouse = createNetworkMatrix({
  distanceKm: [[1, 2]],
  durationMin: [[1, 2]],
  costPerKm: 1,
});
const warehouseDemand = createNetworkMatrix({
  distanceKm: [
    [1, 5],
    [4, 1],
  ],
  durationMin: [
    [1, 5],
    [4, 1],
  ],
  costPerKm: 1,
});
const facility = solveTwoEchelonNetwork({
  factoryWarehouseMatrix: factoryWarehouse,
  warehouseDemandMatrix: warehouseDemand,
  demands: [3, 2],
  factoryCapacities: [5],
  warehouseCapacities: [5, 5],
  warehousePolicies: ["auto", "auto"],
  maxOpen: 2,
  fixedCost: 0,
  serviceThreshold: Infinity,
  serviceMetric: "distanceKm",
});

const fleetMatrix = [
  [0, 1, 2, 3],
  [1, 0, 1, 2],
  [2, 1, 0, 1],
  [3, 2, 1, 0],
];
const fleet = buildSplitDeliveryRoutes({
  deliveries: [
    { id: "a", demand: 2 },
    { id: "b", demand: 3 },
    { id: "c", demand: 4 },
  ],
  durationMatrix: fleetMatrix,
  distanceMatrix: fleetMatrix,
  vehicleCapacity: 10,
});
const fleetValidation = validateFleetPlan(fleet, 9);

globalThis.process.stdout.write(
  JSON.stringify({
    shortestPath: {
      dijkstra: dijkstra.distances.get("d"),
      astar: astar.cost,
    },
    minCostFlow: {
      feasible: transport.feasible,
      cost: transport.weightedNetworkCost,
      flow: transport.allocatedDemand,
    },
    facility: {
      solverMode: facility.solverMode,
      selected: facility.selectedWarehouses,
      cost: facility.transportCost,
      flow: facility.allocatedDemand,
    },
    fleet: {
      feasible: fleet.feasible && fleetValidation.valid,
      cost: fleet.trips.reduce((sum, trip) => sum + trip.durationMin, 0),
      routedDemand: fleet.routedDemand,
      trips: fleet.trips.length,
    },
  }),
);
