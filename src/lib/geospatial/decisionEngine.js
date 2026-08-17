const EPS = 1e-9;

export function seededRandom(seed = 1) {
  let x = Math.abs(Math.trunc(Number(seed) || 1)) % 2147483647;
  if (x === 0) x = 1;
  return () => ((x = (x * 48271) % 2147483647) - 1) / 2147483646;
}

export function normalRandom(rnd = Math.random) {
  let u = 0;
  let v = 0;
  while (u <= Number.EPSILON) u = rnd();
  while (v <= Number.EPSILON) v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function haversineKm(a, b) {
  const r = 6371.0088;
  const toRad = (x) => (Number(x) * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function combinations(items, choose) {
  if (choose < 0 || choose > items.length) return [];
  if (choose === 0) return [[]];
  const out = [];
  const walk = (start, picked) => {
    if (picked.length === choose) {
      out.push([...picked]);
      return;
    }
    for (let i = start; i < items.length; i += 1) {
      picked.push(items[i]);
      walk(i + 1, picked);
      picked.pop();
    }
  };
  walk(0, []);
  return out;
}

export function applyOdScenario(matrix, params = {}) {
  const {
    mode = "baseline",
    congestionSeverity = 0.35,
    congestionShare = 0.6,
    closureShare = 0.1,
    improvement = 0.2,
    improvementShare = 0.3,
    seed = 1,
  } = params;
  const rnd = seededRandom(seed);
  return matrix.map((row) =>
    row.map((value) => {
      if (!Number.isFinite(value)) return Infinity;
      let next = Number(value);
      if (
        (mode === "congestion" || mode === "mixed") &&
        rnd() < congestionShare
      ) {
        next *= 1 + congestionSeverity * (0.45 + 0.55 * rnd());
      }
      if (
        (mode === "closure" || mode === "mixed") &&
        rnd() < closureShare
      ) {
        return Infinity;
      }
      if (
        (mode === "newroad" || mode === "mixed") &&
        rnd() < improvementShare
      ) {
        next *= Math.max(0.05, 1 - improvement * (0.55 + 0.45 * rnd()));
      }
      return next;
    }),
  );
}

function createResidualGraph(size) {
  return Array.from({ length: size }, () => []);
}

function addResidualEdge(graph, from, to, capacity, cost, meta = null) {
  const forward = {
    to,
    rev: graph[to].length,
    cap: Number(capacity),
    cost: Number(cost),
    initialCap: Number(capacity),
    meta,
  };
  const backward = {
    to: from,
    rev: graph[from].length,
    cap: 0,
    cost: -Number(cost),
    initialCap: 0,
    meta: null,
  };
  graph[from].push(forward);
  graph[to].push(backward);
  return forward;
}

export function solveTransportation({
  selected,
  matrix,
  demands,
  facilityCapacities,
  threshold = Infinity,
}) {
  const facilities = [...selected];
  const demandVector = demands.map((d) => Math.max(0, Number(d) || 0));
  const totalDemand = demandVector.reduce((a, b) => a + b, 0);
  if (totalDemand <= EPS) {
    return {
      feasible: true,
      allocatedDemand: 0,
      weightedNetworkCost: 0,
      averageNetworkCost: 0,
      assignments: [],
      utilisation: facilities.map(() => 0),
    };
  }

  const capacities = facilities.map((_, localIndex) => {
    if (Array.isArray(facilityCapacities)) {
      return Math.max(0, Number(facilityCapacities[localIndex]) || 0);
    }
    return Math.max(0, Number(facilityCapacities) || 0);
  });
  if (capacities.reduce((a, b) => a + b, 0) + EPS < totalDemand) {
    return { feasible: false, allocatedDemand: 0, reason: "facility-capacity" };
  }

  const m = facilities.length;
  const n = demandVector.length;
  const source = 0;
  const facilityStart = 1;
  const demandStart = facilityStart + m;
  const sink = demandStart + n;
  const graph = createResidualGraph(sink + 1);
  const pairEdges = [];

  for (let f = 0; f < m; f += 1) {
    addResidualEdge(graph, source, facilityStart + f, capacities[f], 0);
  }
  for (let j = 0; j < n; j += 1) {
    addResidualEdge(graph, demandStart + j, sink, demandVector[j], 0);
  }
  for (let f = 0; f < m; f += 1) {
    const hub = facilities[f];
    for (let j = 0; j < n; j += 1) {
      const cost = matrix[hub]?.[j];
      if (!Number.isFinite(cost) || cost > threshold) continue;
      const edge = addResidualEdge(
        graph,
        facilityStart + f,
        demandStart + j,
        totalDemand,
        cost,
        { hub, demand: j, localFacility: f },
      );
      pairEdges.push(edge);
    }
  }

  let flow = 0;
  let cost = 0;
  const nodeCount = graph.length;
  while (flow + EPS < totalDemand) {
    const dist = Array(nodeCount).fill(Infinity);
    const inQueue = Array(nodeCount).fill(false);
    const prevNode = Array(nodeCount).fill(-1);
    const prevEdge = Array(nodeCount).fill(-1);
    const queue = [source];
    let head = 0;
    dist[source] = 0;
    inQueue[source] = true;

    while (head < queue.length) {
      const u = queue[head++];
      inQueue[u] = false;
      for (let ei = 0; ei < graph[u].length; ei += 1) {
        const edge = graph[u][ei];
        if (edge.cap <= EPS) continue;
        const nd = dist[u] + edge.cost;
        if (nd + EPS < dist[edge.to]) {
          dist[edge.to] = nd;
          prevNode[edge.to] = u;
          prevEdge[edge.to] = ei;
          if (!inQueue[edge.to]) {
            queue.push(edge.to);
            inQueue[edge.to] = true;
          }
        }
      }
    }

    if (!Number.isFinite(dist[sink])) break;
    let add = totalDemand - flow;
    for (let v = sink; v !== source; v = prevNode[v]) {
      const u = prevNode[v];
      if (u < 0) {
        add = 0;
        break;
      }
      add = Math.min(add, graph[u][prevEdge[v]].cap);
    }
    if (add <= EPS) break;
    for (let v = sink; v !== source; v = prevNode[v]) {
      const u = prevNode[v];
      const edge = graph[u][prevEdge[v]];
      edge.cap -= add;
      graph[v][edge.rev].cap += add;
      cost += add * edge.cost;
    }
    flow += add;
  }

  if (flow + EPS < totalDemand) {
    return { feasible: false, allocatedDemand: flow, reason: "network-capacity" };
  }

  const assignments = [];
  const usedByLocalFacility = Array(m).fill(0);
  for (const edge of pairEdges) {
    const used = edge.initialCap - edge.cap;
    if (used <= EPS) continue;
    assignments.push({
      hub: edge.meta.hub,
      demand: edge.meta.demand,
      flow: used,
      networkCost: edge.cost,
    });
    usedByLocalFacility[edge.meta.localFacility] += used;
  }

  return {
    feasible: true,
    allocatedDemand: flow,
    weightedNetworkCost: cost,
    averageNetworkCost: cost / Math.max(EPS, totalDemand),
    assignments,
    utilisation: usedByLocalFacility.map((used, i) =>
      capacities[i] > EPS ? used / capacities[i] : 0,
    ),
  };
}

export function solveFacilityNetwork(params) {
  const {
    matrix,
    demands,
    policies = [],
    maxOpen = matrix.length,
    redundancy = 1,
    threshold = Infinity,
    facilityCapacity = Infinity,
    fixedCost = 0,
    transportCost = 1,
    objective = "minHubs",
    demandMultiplier = 1,
    fleetCapacity = Infinity,
    enforceFleet = false,
  } = params;

  const scaledDemands = demands.map(
    (d) => Math.max(0, Number(d) || 0) * Math.max(0, Number(demandMultiplier) || 0),
  );
  const totalDemand = scaledDemands.reduce((a, b) => a + b, 0);
  if (enforceFleet && Number(fleetCapacity) + EPS < totalDemand) return null;

  const ids = matrix.map((_, i) => i);
  const must = ids.filter((i) => policies[i] === "must");
  const optional = ids.filter(
    (i) => policies[i] !== "must" && policies[i] !== "exclude",
  );
  if (must.length > maxOpen) return null;

  let best = null;
  const minK = Math.max(1, must.length);
  const maxK = Math.min(maxOpen, must.length + optional.length);
  for (let k = minK; k <= maxK; k += 1) {
    const extraCount = k - must.length;
    for (const extra of combinations(optional, extraCount)) {
      const selected = [...must, ...extra].sort((a, b) => a - b);
      const coverCounts = demands.map((_, j) =>
        selected.reduce(
          (sum, hub) =>
            sum + (Number.isFinite(matrix[hub]?.[j]) && matrix[hub][j] <= threshold ? 1 : 0),
          0,
        ),
      );
      if (!coverCounts.every((count) => count >= redundancy)) continue;

      const transport = solveTransportation({
        selected,
        matrix,
        demands: scaledDemands,
        facilityCapacities: facilityCapacity,
        threshold,
      });
      if (!transport.feasible) continue;

      const fixed = selected.length * Number(fixedCost || 0);
      const variable = transport.weightedNetworkCost * Number(transportCost || 0);
      const score = fixed + variable;
      const candidate = {
        selected,
        coverCounts,
        totalDemand,
        fixedCost: fixed,
        transportCost: variable,
        score,
        ...transport,
      };
      const better =
        !best ||
        (objective === "minHubs"
          ? candidate.selected.length < best.selected.length ||
            (candidate.selected.length === best.selected.length && candidate.score < best.score)
          : candidate.score < best.score);
      if (better) best = candidate;
    }
    if (best && objective === "minHubs") break;
  }
  return best;
}

export function inventoryPolicy({ mean = 0, sd = 0, leadTime = 1, z = 1.645 }) {
  const mu = Math.max(0, Number(mean) || 0);
  const sigma = Math.max(0, Number(sd) || 0);
  const lead = Math.max(EPS, Number(leadTime) || 1);
  const safetyStock = Number(z || 0) * sigma * Math.sqrt(lead);
  return {
    safetyStock,
    reorderPoint: mu * lead + safetyStock,
    leadTimeMean: mu * lead,
    leadTimeSd: sigma * Math.sqrt(lead),
  };
}

export function simulateInventoryStockout({
  mean = 0,
  sd = 0,
  leadTime = 1,
  z = 1.645,
  runs = 500,
  seed = 1,
}) {
  const policy = inventoryPolicy({ mean, sd, leadTime, z });
  const rnd = seededRandom(seed);
  let stockouts = 0;
  const n = Math.max(1, Math.trunc(runs));
  for (let i = 0; i < n; i += 1) {
    const leadDemand = Math.max(
      0,
      policy.leadTimeMean + policy.leadTimeSd * normalRandom(rnd),
    );
    if (leadDemand > policy.reorderPoint) stockouts += 1;
  }
  return { ...policy, stockoutProbability: stockouts / n };
}

function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[index];
}

export function runMonteCarlo({
  baseMatrix,
  solverParams,
  scenarioParams,
  runs = 100,
  seed = 1,
  facilityNames = [],
  inventory = null,
}) {
  const n = Math.max(1, Math.trunc(runs));
  const costs = [];
  const networkCosts = [];
  const selectionCounts = Array(baseMatrix.length).fill(0);
  let failures = 0;
  for (let i = 0; i < n; i += 1) {
    const matrix = applyOdScenario(baseMatrix, {
      ...scenarioParams,
      seed: Number(seed) + i * 7919,
    });
    const solution = solveFacilityNetwork({ ...solverParams, matrix });
    if (!solution) {
      failures += 1;
      continue;
    }
    costs.push(solution.score);
    networkCosts.push(solution.averageNetworkCost);
    solution.selected.forEach((index) => {
      selectionCounts[index] += 1;
    });
  }

  const inv = inventory
    ? simulateInventoryStockout({
        ...inventory,
        runs: Math.max(200, n * 4),
        seed: Number(seed) + 104729,
      })
    : null;
  return {
    runs: n,
    successfulRuns: n - failures,
    expectedCost: costs.length
      ? costs.reduce((a, b) => a + b, 0) / costs.length
      : null,
    p95Cost: percentile(costs, 0.95),
    failureRate: failures / n,
    averageNetworkCost: networkCosts.length
      ? networkCosts.reduce((a, b) => a + b, 0) / networkCosts.length
      : null,
    facilityStability: selectionCounts
      .map((count, index) => ({
        index,
        name: facilityNames[index] || `Facility ${index + 1}`,
        probability: count / n,
      }))
      .sort((a, b) => b.probability - a.probability),
    stockoutProbability: inv?.stockoutProbability ?? null,
  };
}

export function compareScenarioResults(a, b) {
  if (!a || !b) return null;
  const delta = (x, y) =>
    Number.isFinite(x) && Number.isFinite(y) ? y - x : null;
  return {
    hubs: delta(a.selected?.length, b.selected?.length),
    cost: delta(a.score, b.score),
    averageNetworkCost: delta(a.averageNetworkCost, b.averageNetworkCost),
    totalDemand: delta(a.totalDemand, b.totalDemand),
  };
}

function parseSpeedKph(tags = {}) {
  const raw = String(tags.maxspeed || "").toLowerCase();
  const match = raw.match(/(\d+(?:\.\d+)?)/);
  if (match) {
    const speed = Number(match[1]);
    return raw.includes("mph") ? speed * 1.60934 : speed;
  }
  const defaults = {
    motorway: 100,
    motorway_link: 70,
    trunk: 80,
    trunk_link: 60,
    primary: 60,
    primary_link: 50,
    secondary: 50,
    secondary_link: 40,
    tertiary: 40,
    tertiary_link: 35,
    residential: 30,
    unclassified: 40,
    service: 20,
    living_street: 10,
  };
  return defaults[tags.highway] || 35;
}

function segmentKey(a, b) {
  return Number(a) < Number(b) ? `${a}:${b}` : `${b}:${a}`;
}

export function parseOverpassGraph(elements = []) {
  const nodes = new Map();
  const ways = [];
  for (const item of elements) {
    if (item.type === "node" && Number.isFinite(item.lat) && Number.isFinite(item.lon)) {
      nodes.set(String(item.id), { id: String(item.id), lat: Number(item.lat), lon: Number(item.lon) });
    } else if (item.type === "way" && Array.isArray(item.nodes) && item.nodes.length > 1) {
      ways.push(item);
    }
  }

  const edges = [];
  const adjacency = new Map();
  const addEdge = (from, to, way) => {
    const a = nodes.get(String(from));
    const b = nodes.get(String(to));
    if (!a || !b) return;
    const lengthKm = haversineKm(a, b);
    if (lengthKm <= EPS || lengthKm > 8) return;
    const speedKph = Math.max(5, parseSpeedKph(way.tags || {}));
    const edge = {
      id: edges.length,
      from: String(from),
      to: String(to),
      wayId: String(way.id),
      highway: way.tags?.highway || "road",
      segmentKey: segmentKey(from, to),
      lengthKm,
      timeMin: (lengthKm / speedKph) * 60,
    };
    edges.push(edge);
    if (!adjacency.has(edge.from)) adjacency.set(edge.from, []);
    adjacency.get(edge.from).push(edge.id);
  };

  for (const way of ways) {
    const onewayRaw = String(way.tags?.oneway || "").toLowerCase();
    const roundabout = String(way.tags?.junction || "").toLowerCase() === "roundabout";
    const reverseOnly = onewayRaw === "-1";
    const forwardOnly = ["yes", "1", "true"].includes(onewayRaw) || roundabout;
    for (let i = 0; i < way.nodes.length - 1; i += 1) {
      const from = way.nodes[i];
      const to = way.nodes[i + 1];
      if (reverseOnly) {
        addEdge(to, from, way);
      } else {
        addEdge(from, to, way);
        if (!forwardOnly) addEdge(to, from, way);
      }
    }
  }

  return {
    nodes,
    nodeList: [...nodes.values()],
    edges,
    adjacency,
  };
}

export function nearestGraphNode(graph, point) {
  let best = null;
  let bestKm = Infinity;
  for (const node of graph.nodeList || []) {
    const d = haversineKm(node, point);
    if (d < bestKm) {
      bestKm = d;
      best = node.id;
    }
  }
  return { nodeId: best, distanceKm: bestKm };
}

function buildSegmentScenario(graph, params) {
  const {
    mode = "baseline",
    seed = 1,
    congestionSeverity = 0.35,
    congestionShare = 0.35,
    closureShare = 0.01,
  } = params;
  const rnd = seededRandom(seed);
  const factors = new Map();
  const disabled = new Set();
  const keys = [...new Set(graph.edges.map((edge) => edge.segmentKey))];
  for (const key of keys) {
    if (
      (mode === "congestion" || mode === "mixed") &&
      rnd() < congestionShare
    ) {
      factors.set(key, 1 + congestionSeverity * (0.45 + 0.55 * rnd()));
    }
    if (
      (mode === "closure" || mode === "mixed") &&
      rnd() < closureShare
    ) {
      disabled.add(key);
    }
  }
  return { factors, disabled };
}

function generateShortcutEdges(graph, params, rnd) {
  const count = Math.max(0, Math.min(40, Math.trunc(params.newRoadLinks || 0)));
  if (!count || !graph.nodeList?.length) return [];
  const existing = new Set(graph.edges.map((edge) => edge.segmentKey));
  const shortcuts = [];
  const nodes = graph.nodeList;
  const maxAttempts = Math.max(500, count * 200);
  for (let attempt = 0; attempt < maxAttempts && shortcuts.length < count * 2; attempt += 1) {
    const a = nodes[Math.floor(rnd() * nodes.length)];
    const b = nodes[Math.floor(rnd() * nodes.length)];
    if (!a || !b || a.id === b.id) continue;
    const key = segmentKey(a.id, b.id);
    if (existing.has(key)) continue;
    const d = haversineKm(a, b);
    if (d < 0.08 || d > Number(params.maxNewRoadKm || 0.65)) continue;
    existing.add(key);
    const speed = Math.max(20, Number(params.newRoadSpeedKph || 50));
    const make = (from, to) => ({
      id: `new:${from}:${to}:${shortcuts.length}`,
      from,
      to,
      wayId: "hypothetical-new-road",
      highway: "proposed",
      segmentKey: key,
      lengthKm: d,
      timeMin: (d / speed) * 60,
      proposed: true,
    });
    shortcuts.push(make(a.id, b.id), make(b.id, a.id));
  }
  return shortcuts;
}

export function buildEdgeScenario(graph, params = {}) {
  const base = buildSegmentScenario(graph, params);
  const rnd = seededRandom(Number(params.seed || 1) + 65537);
  const shortcuts =
    params.mode === "newroad" || params.mode === "mixed"
      ? generateShortcutEdges(graph, params, rnd)
      : [];
  return { ...base, shortcuts };
}

class MinHeap {
  constructor() {
    this.items = [];
  }
  push(item) {
    const a = this.items;
    a.push(item);
    let i = a.length - 1;
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (a[p][0] <= item[0]) break;
      a[i] = a[p];
      i = p;
    }
    a[i] = item;
  }
  pop() {
    const a = this.items;
    if (!a.length) return null;
    const root = a[0];
    const last = a.pop();
    if (a.length && last) {
      let i = 0;
      while (true) {
        let child = i * 2 + 1;
        if (child >= a.length) break;
        if (child + 1 < a.length && a[child + 1][0] < a[child][0]) child += 1;
        if (a[child][0] >= last[0]) break;
        a[i] = a[child];
        i = child;
      }
      a[i] = last;
    }
    return root;
  }
  get size() {
    return this.items.length;
  }
}

export function dijkstraGraph(graph, sourceNodeId, scenario = {}, metric = "time") {
  const distances = new Map();
  const previous = new Map();
  const heap = new MinHeap();
  const extraAdjacency = new Map();
  for (const edge of scenario.shortcuts || []) {
    if (!extraAdjacency.has(edge.from)) extraAdjacency.set(edge.from, []);
    extraAdjacency.get(edge.from).push(edge);
  }
  distances.set(String(sourceNodeId), 0);
  heap.push([0, String(sourceNodeId)]);
  while (heap.size) {
    const [du, u] = heap.pop();
    if (du > (distances.get(u) ?? Infinity) + EPS) continue;
    const baseEdges = (graph.adjacency.get(u) || []).map((id) => graph.edges[id]);
    const edges = [...baseEdges, ...(extraAdjacency.get(u) || [])];
    for (const edge of edges) {
      if (scenario.disabled?.has(edge.segmentKey)) continue;
      const factor = scenario.factors?.get(edge.segmentKey) || 1;
      const baseWeight = metric === "distance" ? edge.lengthKm : edge.timeMin;
      const weight = edge.proposed ? baseWeight : baseWeight * factor;
      const nd = du + weight;
      if (nd + EPS < (distances.get(edge.to) ?? Infinity)) {
        distances.set(edge.to, nd);
        previous.set(edge.to, { node: u, edge });
        heap.push([nd, edge.to]);
      }
    }
  }
  return { distances, previous };
}

export function graphOdMatrix({
  graph,
  sources,
  destinations,
  scenarioParams = {},
  metric = "time",
}) {
  const sourceSnaps = sources.map((p) => nearestGraphNode(graph, p));
  const destinationSnaps = destinations.map((p) => nearestGraphNode(graph, p));
  const scenario = buildEdgeScenario(graph, scenarioParams);
  const matrix = sourceSnaps.map((snap) => {
    if (!snap.nodeId) return destinations.map(() => Infinity);
    const result = dijkstraGraph(graph, snap.nodeId, scenario, metric);
    return destinationSnaps.map((target) =>
      target.nodeId ? result.distances.get(target.nodeId) ?? Infinity : Infinity,
    );
  });
  return { matrix, sourceSnaps, destinationSnaps, scenario };
}
