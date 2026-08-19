const EPS = 1e-9;

export function networkMetricForEngine(engine = "od") {
  if (engine === "osm") {
    return { key: "travel-time", unit: "min" };
  }
  return { key: "delivery-distance", unit: "km" };
}

function delta(a, b) {
  return Number.isFinite(a) && Number.isFinite(b) ? b - a : null;
}

function relativeDelta(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || Math.abs(a) <= EPS) return null;
  return (b - a) / Math.abs(a);
}

function valueEqual(a, b) {
  if (typeof a === "number" && typeof b === "number") {
    return Math.abs(a - b) <= EPS;
  }
  return a === b;
}

export function changedScenarioParameters(a = {}, b = {}, orderedKeys = []) {
  const keys = orderedKeys.length
    ? orderedKeys
    : [...new Set([...Object.keys(a || {}), ...Object.keys(b || {})])];
  return keys
    .filter((key) => !valueEqual(a?.[key], b?.[key]))
    .map((key) => ({ key, a: a?.[key], b: b?.[key] }));
}

function movement(value, tolerance = EPS) {
  if (!Number.isFinite(value) || Math.abs(value) <= tolerance) return 0;
  return value > 0 ? 1 : -1;
}

function classifyTradeoff(costDelta, networkDelta, comparable) {
  if (!comparable) return "network-not-comparable";
  const cost = movement(costDelta, 0.5);
  const network = movement(networkDelta, 0.005);
  if (cost < 0 && network < 0) return "cost-and-network-improve";
  if (cost < 0 && network > 0) return "cost-network-tradeoff";
  if (cost > 0 && network < 0) return "network-cost-tradeoff";
  if (cost > 0 && network > 0) return "cost-and-network-worse";
  if (cost < 0) return "cost-improves";
  if (cost > 0) return "cost-worsens";
  if (network < 0) return "network-improves";
  if (network > 0) return "network-worsens";
  return "similar";
}

export function compareScenarioSnapshots(a, b, { parameterOrder = [] } = {}) {
  if (!a || !b) return null;

  const metricA = a.networkMetric || networkMetricForEngine(a.params?.engine);
  const metricB = b.networkMetric || networkMetricForEngine(b.params?.engine);
  const networkComparable = metricA.key === metricB.key && metricA.unit === metricB.unit;
  const networkDelta = networkComparable
    ? delta(a.metrics?.networkValue, b.metrics?.networkValue)
    : null;

  const robustnessComparable = Boolean(a.robustness && b.robustness);
  const robustness = robustnessComparable
    ? {
        expectedCost: delta(a.robustness.expectedCost, b.robustness.expectedCost),
        p95Cost: delta(a.robustness.p95Cost, b.robustness.p95Cost),
        failureRate: delta(a.robustness.failureRate, b.robustness.failureRate),
        stockoutProbability: delta(
          a.robustness.stockoutProbability,
          b.robustness.stockoutProbability,
        ),
      }
    : null;

  const costDelta = delta(a.metrics?.totalCost, b.metrics?.totalCost);
  return {
    networkComparable,
    networkMetric: networkComparable ? metricA : null,
    networkMetricA: metricA,
    networkMetricB: metricB,
    objectiveComparable: a.params?.objective === b.params?.objective,
    deltas: {
      facilities: delta(a.metrics?.hubs, b.metrics?.hubs),
      totalCost: costDelta,
      totalCostPct: relativeDelta(a.metrics?.totalCost, b.metrics?.totalCost),
      transportCost: delta(a.metrics?.transportCost, b.metrics?.transportCost),
      network: networkDelta,
      networkPct: networkComparable
        ? relativeDelta(a.metrics?.networkValue, b.metrics?.networkValue)
        : null,
      coverage: delta(a.metrics?.coverage, b.metrics?.coverage),
      fleetCapacity: delta(a.metrics?.fleetCapacity, b.metrics?.fleetCapacity),
      safetyStock: delta(a.metrics?.safetyStock, b.metrics?.safetyStock),
      reorderPoint: delta(a.metrics?.reorderPoint, b.metrics?.reorderPoint),
    },
    robustnessComparable,
    robustness,
    changedParameters: changedScenarioParameters(a.params, b.params, parameterOrder),
    tradeoff: classifyTradeoff(costDelta, networkDelta, networkComparable),
  };
}
