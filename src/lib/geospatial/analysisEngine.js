import {
  graphNetworkMatrix,
  nearestGraphNode,
  simulateInventoryStockout,
  solveTwoEchelonNetwork,
} from "./decisionEngine.js";
import { createDisruptionEvent } from "./disruptionEvents.js";
import { applyNetworkScenario, createNetworkMatrix } from "./networkMatrix.js";
import { reconstructGraphPath } from "./pathTools.js";

const EPS = 1e-9;

function matrixRows(matrix, rows, suffix) {
  return createNetworkMatrix({
    distanceKm: rows.map((index) => matrix.distanceKm[index]),
    durationMin: rows.map((index) => matrix.durationMin[index]),
    costPerKm: matrix.pricing.costPerKm,
    costPerMinute: matrix.pricing.costPerMinute,
    ...matrix.provenance,
    method: `${matrix.provenance.method}:${suffix}`,
  });
}

function percentile(sorted, probability) {
  if (!sorted.length) return null;
  return sorted[
    Math.min(sorted.length - 1, Math.ceil(sorted.length * probability) - 1)
  ];
}

function histogram(sorted, requestedBins = null) {
  if (!sorted.length) return [];
  const bins =
    requestedBins || Math.min(12, Math.max(4, Math.ceil(Math.sqrt(sorted.length))));
  const minimum = sorted[0];
  const maximum = sorted.at(-1);
  const width = Math.max(EPS, (maximum - minimum) / bins);
  return Array.from({ length: bins }, (_, index) => {
    const min = minimum + index * width;
    const max = index === bins - 1 ? maximum : min + width;
    return {
      min,
      max,
      count: sorted.filter((value) =>
        index === bins - 1 ? value >= min && value <= max : value >= min && value < max,
      ).length,
    };
  });
}

function roleIndexes(entities) {
  const facilities = entities?.facilities || [];
  return {
    factories: facilities
      .map((_, index) => index)
      .filter(
        (index) =>
          facilities[index].role === "factory" &&
          facilities[index].policy !== "exclude",
      ),
    warehouses: facilities
      .map((_, index) => index)
      .filter((index) => facilities[index].role === "warehouse"),
  };
}

function scenarioMatrices(payload, scenarioParams) {
  const { factories, warehouses } = roleIndexes(payload.entities);
  if (payload.useGraph) {
    const allToDemand = graphNetworkMatrix({
      graph: payload.graph,
      sources: payload.entities.facilities.map((entity) => entity.point),
      destinations: payload.entities.demands.map((entity) => entity.point),
      scenarioParams,
      ...payload.pricing,
    }).networkMatrix;
    const factoryWarehouse = graphNetworkMatrix({
      graph: payload.graph,
      sources: factories.map((index) => payload.entities.facilities[index].point),
      destinations: warehouses.map((index) => payload.entities.facilities[index].point),
      scenarioParams,
      ...payload.pricing,
    }).networkMatrix;
    return { allToDemand, factoryWarehouse, factories, warehouses };
  }
  return {
    allToDemand: applyNetworkScenario(payload.baseNetworkMatrix, scenarioParams),
    factoryWarehouse: applyNetworkScenario(
      payload.baseFactoryWarehouseMatrix,
      scenarioParams,
    ),
    factories,
    warehouses,
  };
}

export function solveAnalysisScenario(payload, runIndex = 0) {
  const seed = Number(payload.seed || 1) + runIndex * 7919;
  const event = createDisruptionEvent({
    eventId: payload.eventId || "none",
    seed,
    facilities: payload.entities.facilities,
    demands: payload.entities.demands,
  });
  const scenarioParams = {
    ...payload.scenarioParams,
    seed,
    ...event.networkScenario,
  };
  const matrices = scenarioMatrices(payload, scenarioParams);
  const scaledDemands = payload.baseDemands.map(
    (value, index) =>
      Math.max(0, Number(value) || 0) *
      Math.max(0, Number(payload.demandMultiplier) || 0) *
      (event.demandMultipliers[index] ?? 1),
  );
  const capacity = Math.max(0, Number(payload.facilityCapacity) || 0);
  const warehouseDemand = matrixRows(
    matrices.allToDemand,
    matrices.warehouses,
    "worker-warehouse-demand",
  );
  const result = solveTwoEchelonNetwork({
    factoryWarehouseMatrix: matrices.factoryWarehouse,
    warehouseDemandMatrix: warehouseDemand,
    demands: scaledDemands,
    factoryCapacities: matrices.factories.map(
      (index) => capacity * (event.facilityCapacityMultipliers[index] ?? 1),
    ),
    warehouseCapacities: matrices.warehouses.map(
      (index) => capacity * (event.facilityCapacityMultipliers[index] ?? 1),
    ),
    warehousePolicies: matrices.warehouses.map(
      (index) => payload.entities.facilities[index].policy,
    ),
    maxOpen: payload.maxOpen,
    fixedCost: payload.fixedCost,
    serviceThreshold: payload.serviceThreshold,
    serviceMetric: payload.serviceMetric,
    redundancy: payload.redundancy,
  });
  if (!result) {
    return {
      result: null,
      totalDemand: scaledDemands.reduce((sum, value) => sum + value, 0),
    };
  }
  const selected = result.selectedWarehouses.map((index) => matrices.warehouses[index]);
  const assignments = result.warehouseDemandFlows.map((flow) => ({
    ...flow,
    hub: matrices.warehouses[flow.warehouse],
    distanceKm: warehouseDemand.distanceKm[flow.warehouse][flow.demand],
    durationMin: warehouseDemand.durationMin[flow.warehouse][flow.demand],
  }));
  const totalDemand = scaledDemands.reduce((sum, value) => sum + value, 0);
  const weighted = (field) =>
    assignments.reduce((sum, flow) => sum + flow.flow * flow[field], 0) /
    Math.max(EPS, totalDemand);
  return {
    result: {
      ...result,
      selected,
      assignments,
      averageDistanceKm: weighted("distanceKm"),
      averageDurationMin: weighted("durationMin"),
    },
    totalDemand,
  };
}

export function runTwoEchelonMonteCarlo(payload) {
  const runs = Math.max(1, Math.trunc(Number(payload.runs) || 1));
  const costs = [];
  const networkValues = [];
  const unmet = [];
  const selections = Array(payload.entities.facilities.length).fill(0);
  for (let index = 0; index < runs; index += 1) {
    const solved = solveAnalysisScenario(payload, index);
    if (!solved.result) {
      unmet.push(solved.totalDemand);
      continue;
    }
    costs.push(solved.result.score);
    unmet.push(Math.max(0, solved.totalDemand - solved.result.allocatedDemand));
    networkValues.push(
      payload.serviceMetric === "durationMin"
        ? solved.result.averageDurationMin
        : solved.result.averageDistanceKm,
    );
    solved.result.selected.forEach((facility) => {
      selections[facility] += 1;
    });
  }
  const sorted = [...costs].sort((a, b) => a - b);
  const p95Cost = percentile(sorted, 0.95);
  const tail = Number.isFinite(p95Cost)
    ? sorted.filter((value) => value >= p95Cost)
    : [];
  const inventory = simulateInventoryStockout({
    ...payload.inventory,
    runs: Math.max(200, runs * 10),
    seed: Number(payload.seed || 1) + 104729,
  });
  const average = (values) =>
    values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : null;
  return {
    runs,
    successfulRuns: costs.length,
    expectedCost: average(costs),
    p95Cost,
    cvar95Cost: average(tail),
    failureRate: (runs - costs.length) / runs,
    expectedUnmetDemand: average(unmet),
    averageNetworkCost: average(networkValues),
    stockoutProbability: inventory.stockoutProbability,
    facilityStability: selections
      .map((count, index) => ({
        index,
        name: payload.entities.facilities[index].name,
        probability: count / runs,
      }))
      .sort((a, b) => b.probability - a.probability || a.index - b.index),
    costHistogram: histogram(sorted),
  };
}

function shipmentPaths(payload) {
  const facilities = payload.entities.facilities;
  const demands = payload.entities.demands;
  const shipments = [
    ...(payload.solution.factoryAssignments || []).map((flow) => ({
      stage: "factoryWarehouse",
      from: facilities[flow.factory]?.point,
      to: facilities[flow.warehouse]?.point,
      flow: flow.flow,
    })),
    ...(payload.solution.assignments || []).map((flow) => ({
      stage: "warehouseDemand",
      from: facilities[flow.hub]?.point,
      to: demands[flow.demand]?.point,
      flow: flow.flow,
    })),
  ];
  return shipments
    .map((shipment) => {
      if (!shipment.from || !shipment.to) return null;
      const source = nearestGraphNode(payload.graph, shipment.from);
      const target = nearestGraphNode(payload.graph, shipment.to);
      if (!source?.nodeId || !target?.nodeId) return null;
      const path = reconstructGraphPath(
        payload.graph,
        source.nodeId,
        target.nodeId,
        payload.scenario,
        "time",
      );
      return path
        ? { ...shipment, source: source.nodeId, target: target.nodeId, path }
        : null;
    })
    .filter(Boolean);
}

export function analyseRoadCriticality(payload) {
  const shipments = shipmentPaths(payload);
  const candidates = new Map();
  for (const shipment of shipments) {
    const seen = new Set();
    for (const edge of shipment.path.edges) {
      if (seen.has(edge.segmentKey)) continue;
      seen.add(edge.segmentKey);
      const candidate = candidates.get(edge.segmentKey) || {
        segmentKey: edge.segmentKey,
        edge,
        routedFlow: 0,
        frequency: 0,
      };
      candidate.routedFlow += shipment.flow;
      candidate.frequency += 1;
      candidates.set(edge.segmentKey, candidate);
    }
  }
  const selected = [...candidates.values()]
    .sort(
      (a, b) =>
        b.routedFlow - a.routedFlow ||
        b.frequency - a.frequency ||
        a.segmentKey.localeCompare(b.segmentKey),
    )
    .slice(0, Math.max(1, Math.trunc(payload.maxCandidates || 24)));
  const pricing = payload.pricing || { costPerKm: 0, costPerMinute: 0 };
  const unmetPenalty = Math.max(0, Number(payload.unmetPenaltyNZD) || 1000);
  const results = selected.map((candidate) => {
    let deltaGeneralizedCostNZD = 0;
    let weightedDeltaTime = 0;
    let affectedFlow = 0;
    let unmetDemand = 0;
    const disabled = new Set(payload.scenario?.disabled || []);
    disabled.add(candidate.segmentKey);
    const degradedScenario = { ...payload.scenario, disabled };
    for (const shipment of shipments) {
      if (
        !shipment.path.edges.some((edge) => edge.segmentKey === candidate.segmentKey)
      ) {
        continue;
      }
      affectedFlow += shipment.flow;
      const alternative = reconstructGraphPath(
        payload.graph,
        shipment.source,
        shipment.target,
        degradedScenario,
        "time",
      );
      if (!alternative) {
        unmetDemand += shipment.flow;
        continue;
      }
      const baselineCost =
        shipment.path.distanceKm * pricing.costPerKm +
        shipment.path.travelTimeMin * pricing.costPerMinute;
      const alternativeCost =
        alternative.distanceKm * pricing.costPerKm +
        alternative.travelTimeMin * pricing.costPerMinute;
      deltaGeneralizedCostNZD +=
        shipment.flow * Math.max(0, alternativeCost - baselineCost);
      weightedDeltaTime +=
        shipment.flow *
        Math.max(0, alternative.travelTimeMin - shipment.path.travelTimeMin);
    }
    const deltaTravelTimeMin = weightedDeltaTime / Math.max(EPS, affectedFlow);
    const rawScore =
      deltaGeneralizedCostNZD +
      unmetDemand * unmetPenalty +
      weightedDeltaTime * Math.max(0, pricing.costPerMinute);
    const from = payload.graph.nodes.get(String(candidate.edge.from));
    const to = payload.graph.nodes.get(String(candidate.edge.to));
    return {
      segmentKey: candidate.segmentKey,
      roadClass: candidate.edge.highway || candidate.edge.tags?.highway || "road",
      routedFlow: candidate.routedFlow,
      frequency: candidate.frequency,
      affectedFlow,
      deltaGeneralizedCostNZD,
      deltaTravelTimeMin,
      unmetDemand,
      rawScore,
      coordinates:
        from && to
          ? [
              { lat: from.lat, lon: from.lon },
              { lat: to.lat, lon: to.lon },
            ]
          : [],
    };
  });
  const maximum = Math.max(EPS, ...results.map((result) => result.rawScore));
  return {
    method: "optimal-route-edge-removal-reroute",
    deterministic: true,
    candidateCount: results.length,
    shipmentCount: shipments.length,
    scoreDefinition:
      "normalised(max(0, delta generalised cost) + unmet demand penalty + weighted delay cost)",
    edges: results
      .map((result) => ({ ...result, score: result.rawScore / maximum }))
      .sort((a, b) => b.score - a.score || a.segmentKey.localeCompare(b.segmentKey)),
  };
}

export function runGeospatialWorkerTask(task, payload) {
  if (task === "monteCarlo") return runTwoEchelonMonteCarlo(payload);
  if (task === "criticality") return analyseRoadCriticality(payload);
  throw new RangeError(`Unknown geospatial Worker task: ${task}`);
}
