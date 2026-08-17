import {
  buildEdgeScenario,
  graphOdMatrix,
  nearestGraphNode,
  parseOverpassGraph,
} from "../lib/geospatial/decisionEngine.js";
import { reconstructGraphPath } from "../lib/geospatial/pathTools.js";

const D = globalThis.document;
const F = (...args) => globalThis.fetch(...args);

function exactTsp(matrix) {
  const n = matrix.length;
  if (n <= 1) return { order: [0], cost: 0 };
  const m = n - 1;
  if (m > 11) return nearestNeighbour(matrix);
  const size = 1 << m;
  const dp = Array.from({ length: size }, () => Array(n).fill(Infinity));
  const prev = Array.from({ length: size }, () => Array(n).fill(-1));
  for (let j = 1; j < n; j += 1) dp[1 << (j - 1)][j] = matrix[0][j];
  for (let mask = 1; mask < size; mask += 1) {
    for (let j = 1; j < n; j += 1) {
      if (!(mask & (1 << (j - 1)))) continue;
      const priorMask = mask ^ (1 << (j - 1));
      if (!priorMask) continue;
      for (let k = 1; k < n; k += 1) {
        if (!(priorMask & (1 << (k - 1)))) continue;
        const candidate = dp[priorMask][k] + matrix[k][j];
        if (candidate < dp[mask][j]) {
          dp[mask][j] = candidate;
          prev[mask][j] = k;
        }
      }
    }
  }
  const full = size - 1;
  let end = -1;
  let best = Infinity;
  for (let j = 1; j < n; j += 1) {
    const candidate = dp[full][j] + matrix[j][0];
    if (candidate < best) {
      best = candidate;
      end = j;
    }
  }
  if (!Number.isFinite(best) || end < 0) return nearestNeighbour(matrix);
  const reversed = [];
  let mask = full;
  let current = end;
  while (current > 0) {
    reversed.push(current);
    const next = prev[mask][current];
    mask ^= 1 << (current - 1);
    current = next;
  }
  return { order: [0, ...reversed.reverse(), 0], cost: best, method: "exact" };
}

function nearestNeighbour(matrix) {
  const n = matrix.length;
  const remaining = new Set(Array.from({ length: Math.max(0, n - 1) }, (_, i) => i + 1));
  const order = [0];
  let current = 0;
  let cost = 0;
  while (remaining.size) {
    let best = null;
    let bestCost = Infinity;
    for (const node of remaining) {
      if (matrix[current][node] < bestCost) {
        best = node;
        bestCost = matrix[current][node];
      }
    }
    if (best == null || !Number.isFinite(bestCost)) break;
    order.push(best);
    remaining.delete(best);
    cost += bestCost;
    current = best;
  }
  if (order.length > 1 && Number.isFinite(matrix[current][0])) {
    cost += matrix[current][0];
    order.push(0);
  }
  return { order, cost, method: "nearest-neighbour" };
}

function splitByCapacity(sequence, deliveries, capacity) {
  const trips = [];
  let trip = [];
  let remaining = Math.max(1, capacity);
  for (const index of sequence) {
    if (index === 0) continue;
    const delivery = deliveries[index - 1];
    let flow = Math.max(0, delivery.flow);
    while (flow > 1e-9) {
      if (remaining <= 1e-9) {
        if (trip.length) trips.push(trip);
        trip = [];
        remaining = capacity;
      }
      const amount = Math.min(flow, remaining);
      trip.push({ ...delivery, amount });
      flow -= amount;
      remaining -= amount;
      if (remaining <= 1e-9) {
        trips.push(trip);
        trip = [];
        remaining = capacity;
      }
    }
  }
  if (trip.length) trips.push(trip);
  return trips;
}

function boot() {
  const root = D?.getElementById("geo-v4");
  const fleetBlock = D?.getElementById("geo4-fleet-out")?.closest(".geo4__block");
  const L = globalThis.L;
  if (!root || !fleetBlock || !L) {
    globalThis.setTimeout(boot, 80);
    return;
  }
  if (root.dataset.fleetRoutingReady === "true") return;
  root.dataset.fleetRoutingReady = "true";

  const zh = (root.dataset.locale || "zh") === "zh";
  const copy = zh
    ? {
        title: "车队道路计划",
        build: "生成车队路线",
        note: "TSP 道路访问顺序 + 单车容量拆分；用于课程方法组合，不宣称为完整 CVRP。",
        need: "请先初始化 GIS、运行优化并加载当前最优路径。",
        running: "正在计算道路 TSP 顺序与容量 trips…",
        ready: "车队计划已生成。",
        unavailable: "当前路线或道路服务不可用。",
        trips: "需要 Trips",
        available: "可用 Trips",
        distance: "计划距离",
        time: "计划时间",
        feasible: "运力可行",
        infeasible: "运力不足",
        exact: "Exact TSP",
        heuristic: "Heuristic TSP",
      }
    : {
        title: "Fleet Road Planner",
        build: "Build fleet tours",
        note: "Road-based TSP visit order + vehicle-capacity trip splitting; a course-method combination, not a claim of full CVRP optimisation.",
        need: "Initialise GIS, run optimisation and load current optimal paths first.",
        running: "Calculating road TSP sequence and capacity trips…",
        ready: "Fleet plan generated.",
        unavailable: "Current route or road service is unavailable.",
        trips: "Trips required",
        available: "Trips available",
        distance: "Planned distance",
        time: "Planned time",
        feasible: "Fleet feasible",
        infeasible: "Fleet shortfall",
        exact: "Exact TSP",
        heuristic: "Heuristic TSP",
      };

  const style = D.createElement("style");
  style.textContent = `
    .geo4__fleet-planner{margin-top:.7rem;padding-top:.65rem;border-top:1px solid rgba(116,190,213,.16)}.geo4__fleet-planner-head{display:flex;justify-content:space-between;gap:.5rem;align-items:center}.geo4__fleet-planner-head strong{font-size:.65rem;color:#eafaff}.geo4__fleet-planner-head span{color:#ffcc66;font:700 .5rem monospace;letter-spacing:.1em}.geo4__fleet-build{width:100%;margin-top:.45rem;border-color:rgba(255,204,102,.3)!important;color:#ffdb86!important}.geo4__fleet-note{margin:.4rem 0 0;color:#698892;font-size:.52rem;line-height:1.42}.geo4__fleet-summary{display:grid;grid-template-columns:1fr 1fr;gap:.3rem;margin-top:.48rem}.geo4__fleet-summary>div{padding:.36rem .4rem;border:1px solid rgba(255,204,102,.11);background:rgba(53,42,18,.16)}.geo4__fleet-summary span{display:block;color:#728d95;font-size:.45rem}.geo4__fleet-summary b{display:block;margin-top:.15rem;color:#f6fbfc;font:700 .65rem monospace}.geo4__fleet-status{margin:.42rem 0 0;color:#728e98;font-size:.53rem;line-height:1.4}.geo4__fleet-status.ok{color:#d8ff6b}.geo4__fleet-status.bad{color:#ff759a}.geo4__fleet-tour-list{display:grid;gap:.28rem;margin-top:.45rem}.geo4__fleet-tour-list>div{padding:.34rem .4rem;border-left:2px solid rgba(255,204,102,.5);background:rgba(8,33,43,.42);color:#78959f;font-size:.49rem;line-height:1.4}.geo4__fleet-tour-list strong{display:block;color:#e7f8fb;font-size:.55rem}.geo4__fleet-route{filter:drop-shadow(0 0 4px rgba(255,204,102,.32))}
  `;
  D.head.appendChild(style);

  const panel = D.createElement("div");
  panel.className = "geo4__fleet-planner";
  panel.innerHTML = `<div class="geo4__fleet-planner-head"><span>FLEET / TSP</span><strong>${copy.title}</strong></div><button type="button" class="geo4__fleet-build">${copy.build}</button><p class="geo4__fleet-note">${copy.note}</p><div class="geo4__fleet-summary"><div><span>${copy.trips}</span><b data-fleet-trips>—</b></div><div><span>${copy.available}</span><b data-fleet-available>—</b></div><div><span>${copy.distance}</span><b data-fleet-distance>—</b></div><div><span>${copy.time}</span><b data-fleet-time>—</b></div></div><p class="geo4__fleet-status">${copy.need}</p><div class="geo4__fleet-tour-list"></div>`;
  fleetBlock.appendChild(panel);

  const button = panel.querySelector(".geo4__fleet-build");
  const status = panel.querySelector(".geo4__fleet-status");
  const list = panel.querySelector(".geo4__fleet-tour-list");
  const outputs = {
    trips: panel.querySelector("[data-fleet-trips]"),
    available: panel.querySelector("[data-fleet-available]"),
    distance: panel.querySelector("[data-fleet-distance]"),
    time: panel.querySelector("[data-fleet-time]"),
  };

  const state = { map: null, graph: null, fleetLayers: [], routeCache: new Map() };

  function captureMapFromLayer(layer) {
    if (state.map || !layer) return;
    const originalAdd = layer.addTo;
    if (typeof originalAdd !== "function") return;
    layer.addTo = function fleetMapCaptureAddTo(target) {
      const result = originalAdd.call(this, target);
      if (!state.map && target?._map) state.map = target._map;
      return result;
    };
  }
  if (!L.circleMarker.__acidchFleetWrapped) {
    const originalCircleMarker = L.circleMarker;
    const wrappedCircleMarker = (...args) => {
      const layer = originalCircleMarker.apply(L, args);
      captureMapFromLayer(layer);
      return layer;
    };
    wrappedCircleMarker.__acidchFleetWrapped = true;
    wrappedCircleMarker.__acidchFleetOriginal = originalCircleMarker;
    L.circleMarker = wrappedCircleMarker;
  }

  const originalFetch = globalThis.fetch;
  if (typeof originalFetch === "function" && !originalFetch.__acidchFleetWrapped) {
    const wrappedFetch = async (...args) => {
      const response = await originalFetch.apply(globalThis, args);
      const input = args[0];
      const url = typeof input === "string" ? input : input?.url || "";
      if (response.ok && /overpass.*api\/interpreter|api\/interpreter/i.test(url)) {
        response.clone().json().then((payload) => {
          if (!Array.isArray(payload?.elements) || !payload.elements.length) return;
          const graph = parseOverpassGraph(payload.elements);
          if (graph?.edges?.length) state.graph = graph;
        }).catch(() => {});
      }
      return response;
    };
    wrappedFetch.__acidchFleetWrapped = true;
    wrappedFetch.__acidchFleetOriginal = originalFetch;
    globalThis.fetch = wrappedFetch;
  }

  function clearFleetLayers() {
    state.fleetLayers.forEach((layer) => {
      try { layer.remove(); } catch { /* presentation cleanup */ }
    });
    state.fleetLayers = [];
  }

  function verifiedAssignments() {
    if (!state.map) return [];
    const assignments = [];
    for (const layer of Object.values(state.map._layers || {})) {
      if (typeof layer?.getLatLngs !== "function" || typeof layer?.getTooltip !== "function") continue;
      const content = String(layer.getTooltip()?.getContent?.() || "");
      if (!content.includes("→") || !/Flow:\s*[\d,.]+/i.test(content)) continue;
      const match = content.match(/^([^<]+?)\s*→\s*([^<]+)<br>Flow:\s*([\d,.]+)/i);
      if (!match) continue;
      const points = layer.getLatLngs().flat?.(Infinity) || [];
      if (points.length < 2) continue;
      const a = points[0];
      const b = points.at(-1);
      assignments.push({
        hub: match[1].trim(),
        demand: match[2].trim(),
        flow: Number(match[3].replaceAll(",", "")) || 0,
        hubPoint: { lat: a.lat, lon: a.lng },
        demandPoint: { lat: b.lat, lon: b.lng },
      });
    }
    return assignments;
  }

  function scenarioParams() {
    return {
      mode: D.getElementById("geo4-road-mode")?.value || "baseline",
      congestionSeverity: Number(D.getElementById("geo4-congestion")?.value || 0) / 100,
      congestionShare: Number(D.getElementById("geo4-congestion-share")?.value || 0) / 100,
      closureShare: Number(D.getElementById("geo4-closure")?.value || 0) / 100,
      improvement: 0.25,
      improvementShare: 0.3,
      newRoadLinks: Number(D.getElementById("geo4-new-roads-out")?.textContent || 0),
      maxNewRoadKm: 0.65,
      newRoadSpeedKph: 50,
      seed: Number(D.getElementById("geo4-seed")?.value || 708709),
    };
  }

  async function osrmMatrix(points) {
    const coords = points.map((point) => `${point.lon},${point.lat}`).join(";");
    const response = await F(`https://router.project-osrm.org/table/v1/driving/${coords}?annotations=distance,duration`);
    const data = await response.json();
    if (!response.ok || !Array.isArray(data.durations)) throw new Error("OSRM table unavailable");
    return {
      matrix: data.durations.map((row) => row.map((value) => Number.isFinite(value) ? value / 60 : Infinity)),
      distance: data.distances?.map((row) => row.map((value) => Number.isFinite(value) ? value / 1000 : Infinity)) || null,
    };
  }

  function osmMatrix(points) {
    const scenario = scenarioParams();
    const result = graphOdMatrix({ graph: state.graph, sources: points, destinations: points, scenarioParams: scenario, metric: "time" });
    return { matrix: result.matrix, distance: null, scenario: result.scenario, snaps: result.sourceSnaps };
  }

  function tripMetrics(trip, indexByDemand, matrix, distanceMatrix) {
    let time = 0;
    let distance = 0;
    let current = 0;
    for (const stop of trip) {
      const next = indexByDemand.get(stop.demand);
      if (next == null) continue;
      time += matrix[current]?.[next] ?? 0;
      if (distanceMatrix) distance += distanceMatrix[current]?.[next] ?? 0;
      current = next;
    }
    time += matrix[current]?.[0] ?? 0;
    if (distanceMatrix) distance += distanceMatrix[current]?.[0] ?? 0;
    return { time, distance };
  }

  async function osrmTripGeometry(points) {
    const key = points.map((p) => `${p.lon.toFixed(5)},${p.lat.toFixed(5)}`).join(";");
    if (state.routeCache.has(key)) return state.routeCache.get(key);
    const response = await F(`https://router.project-osrm.org/route/v1/driving/${points.map((p) => `${p.lon},${p.lat}`).join(";")}?overview=full&geometries=geojson&steps=false`);
    const data = await response.json();
    if (!response.ok || !data.routes?.[0]) throw new Error("OSRM route unavailable");
    const route = {
      coords: data.routes[0].geometry.coordinates.map(([lon, lat]) => [lat, lon]),
      distance: data.routes[0].distance / 1000,
      time: data.routes[0].duration / 60,
    };
    state.routeCache.set(key, route);
    return route;
  }

  function osmTripGeometry(points, matrixData) {
    const routeCoords = [];
    let distance = 0;
    let time = 0;
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = nearestGraphNode(state.graph, points[i]);
      const b = nearestGraphNode(state.graph, points[i + 1]);
      if (!a?.nodeId || !b?.nodeId) continue;
      const path = reconstructGraphPath(state.graph, a.nodeId, b.nodeId, matrixData.scenario, "time");
      if (!path) continue;
      const coords = path.coordinates.map((point) => [point.lat, point.lon]);
      if (routeCoords.length && coords.length) coords.shift();
      routeCoords.push(...coords);
      distance += path.distanceKm || 0;
      time += path.travelTimeMin || 0;
    }
    return { coords: routeCoords, distance, time };
  }

  async function build() {
    clearFleetLayers();
    const assignments = verifiedAssignments();
    if (!assignments.length || !state.map) {
      status.textContent = copy.need;
      status.className = "geo4__fleet-status bad";
      return;
    }
    button.disabled = true;
    status.textContent = copy.running;
    status.className = "geo4__fleet-status";
    try {
      const capacity = Math.max(1, Number(D.getElementById("geo4-vehicle-capacity")?.value || 1));
      const fleet = Math.max(0, Number(D.getElementById("geo4-fleet-out")?.textContent || 0));
      const tripsPerVehicle = Math.max(0, Number(D.getElementById("geo4-trips")?.value || 0));
      const engine = D.getElementById("geo4-engine")?.value || "od";
      const byHub = new Map();
      for (const assignment of assignments) {
        if (!byHub.has(assignment.hub)) byHub.set(assignment.hub, []);
        byHub.get(assignment.hub).push(assignment);
      }

      let totalTrips = 0;
      let totalDistance = 0;
      let totalTime = 0;
      const summaries = [];
      let colourIndex = 0;
      for (const [hubName, deliveriesRaw] of byHub) {
        const deliveries = [];
        const grouped = new Map();
        for (const item of deliveriesRaw) {
          const existing = grouped.get(item.demand);
          if (existing) existing.flow += item.flow;
          else grouped.set(item.demand, { ...item });
        }
        deliveries.push(...grouped.values());
        const points = [deliveries[0].hubPoint, ...deliveries.map((item) => item.demandPoint)];
        const matrixData = engine === "osm" && state.graph ? osmMatrix(points) : await osrmMatrix(points);
        const tsp = exactTsp(matrixData.matrix);
        const trips = splitByCapacity(tsp.order, deliveries, capacity);
        totalTrips += trips.length;
        const indexByDemand = new Map(deliveries.map((item, index) => [item.demand, index + 1]));
        let hubDistance = 0;
        let hubTime = 0;
        const signatures = new Map();
        for (const trip of trips) {
          const stops = [deliveries[0].hubPoint, ...trip.map((stop) => stop.demandPoint), deliveries[0].hubPoint];
          const names = trip.map((stop) => stop.demand).join(" → ");
          const signature = `${hubName}|${names}`;
          if (!signatures.has(signature)) signatures.set(signature, { stops, names, count: 0 });
          signatures.get(signature).count += 1;
          const metrics = tripMetrics(trip, indexByDemand, matrixData.matrix, matrixData.distance);
          hubTime += metrics.time;
          hubDistance += metrics.distance;
        }
        const geometryEntries = [...signatures.values()].slice(0, 18);
        for (const entry of geometryEntries) {
          let route;
          if (engine === "osm" && state.graph) route = osmTripGeometry(entry.stops, matrixData);
          else route = await osrmTripGeometry(entry.stops);
          if (route.coords.length >= 2) {
            const layer = L.polyline(route.coords, {
              color: colourIndex % 2 ? "#ffcc66" : "#ffb85c",
              weight: 2.05,
              opacity: 0.72,
              dashArray: "9 6",
              className: "geo4__fleet-route",
            }).bindTooltip(`${hubName}<br>${entry.names}<br>${entry.count}× trip · ${route.distance.toFixed(1)} km · ${route.time.toFixed(0)} min`).addTo(state.map);
            state.fleetLayers.push(layer);
          }
        }
        colourIndex += 1;
        if (!matrixData.distance) {
          for (const entry of geometryEntries) {
            const route = engine === "osm" && state.graph ? osmTripGeometry(entry.stops, matrixData) : null;
            if (route) {
              hubDistance += route.distance * entry.count;
              // hubTime is already calculated from the graph matrix.
            }
          }
        }
        totalDistance += hubDistance;
        totalTime += hubTime;
        summaries.push({ hubName, trips: trips.length, method: tsp.method, cost: tsp.cost });
      }

      const available = fleet * tripsPerVehicle;
      const feasible = totalTrips <= available;
      outputs.trips.textContent = String(totalTrips);
      outputs.available.textContent = String(available);
      outputs.distance.textContent = totalDistance > 0 ? `${totalDistance.toFixed(1)} km` : "—";
      outputs.time.textContent = `${(totalTime / 60).toFixed(1)} h`;
      status.textContent = `${copy.ready} ${feasible ? copy.feasible : copy.infeasible}.`;
      status.className = `geo4__fleet-status ${feasible ? "ok" : "bad"}`;
      list.innerHTML = summaries.map((item) => `<div><strong>${item.hubName}</strong>${item.trips} trips · ${item.method === "exact" ? copy.exact : copy.heuristic} · ${item.cost.toFixed(0)} min road-tour objective</div>`).join("");
    } catch (error) {
      globalThis.console?.warn("[Fleet planner]", error);
      status.textContent = copy.unavailable;
      status.className = "geo4__fleet-status bad";
    } finally {
      button.disabled = false;
    }
  }

  button.addEventListener("click", build);
  for (const id of ["geo4-run", "geo4-routes", "geo4-reset", "geo4-engine", "geo4-road-mode", "geo4-vehicle-capacity", "geo4-trips"]) {
    const element = D.getElementById(id);
    element?.addEventListener("click", () => {
      if (id !== "geo4-routes") clearFleetLayers();
    });
    element?.addEventListener("change", clearFleetLayers);
  }
}

boot();
