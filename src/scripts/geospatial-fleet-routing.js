import {
  graphOdMatrix,
  nearestGraphNode,
  parseOverpassGraph,
} from "../lib/geospatial/decisionEngine.js";
import { reconstructGraphPath } from "../lib/geospatial/pathTools.js";

const D = globalThis.document;
const F = (...args) => globalThis.fetch(...args);

function nearestNeighbour(matrix) {
  const remaining = new Set(matrix.slice(1).map((_, index) => index + 1));
  const order = [0];
  let current = 0;
  let cost = 0;
  while (remaining.size) {
    let next = -1;
    let best = Infinity;
    for (const node of remaining) {
      if (matrix[current][node] < best) {
        next = node;
        best = matrix[current][node];
      }
    }
    if (next < 0 || !Number.isFinite(best)) break;
    order.push(next);
    remaining.delete(next);
    cost += best;
    current = next;
  }
  if (order.length > 1 && Number.isFinite(matrix[current][0])) {
    order.push(0);
    cost += matrix[current][0];
  }
  return { order, cost, method: "nearest-neighbour" };
}

function exactTsp(matrix) {
  const n = matrix.length;
  if (n <= 1) return { order: [0], cost: 0, method: "exact" };
  if (n - 1 > 11) return nearestNeighbour(matrix);
  const bits = n - 1;
  const size = 1 << bits;
  const dp = Array.from({ length: size }, () => Array(n).fill(Infinity));
  const previous = Array.from({ length: size }, () => Array(n).fill(-1));
  for (let node = 1; node < n; node += 1) {
    dp[1 << (node - 1)][node] = matrix[0][node];
  }
  for (let mask = 1; mask < size; mask += 1) {
    for (let end = 1; end < n; end += 1) {
      if (!(mask & (1 << (end - 1)))) continue;
      const prior = mask ^ (1 << (end - 1));
      if (!prior) continue;
      for (let before = 1; before < n; before += 1) {
        if (!(prior & (1 << (before - 1)))) continue;
        const candidate = dp[prior][before] + matrix[before][end];
        if (candidate < dp[mask][end]) {
          dp[mask][end] = candidate;
          previous[mask][end] = before;
        }
      }
    }
  }
  const full = size - 1;
  let end = -1;
  let best = Infinity;
  for (let node = 1; node < n; node += 1) {
    const candidate = dp[full][node] + matrix[node][0];
    if (candidate < best) {
      end = node;
      best = candidate;
    }
  }
  if (end < 0 || !Number.isFinite(best)) return nearestNeighbour(matrix);
  const reversed = [];
  let mask = full;
  let current = end;
  while (current > 0) {
    reversed.push(current);
    const next = previous[mask][current];
    mask ^= 1 << (current - 1);
    current = next;
  }
  return { order: [0, ...reversed.reverse(), 0], cost: best, method: "exact" };
}

function splitByCapacity(order, deliveries, capacity) {
  const trips = [];
  let currentTrip = [];
  let remaining = Math.max(1, capacity);
  for (const node of order) {
    if (node === 0) continue;
    const delivery = deliveries[node - 1];
    let flow = Math.max(0, delivery.flow);
    while (flow > 1e-9) {
      if (remaining <= 1e-9) {
        if (currentTrip.length) trips.push(currentTrip);
        currentTrip = [];
        remaining = capacity;
      }
      const amount = Math.min(flow, remaining);
      currentTrip.push({ ...delivery, amount });
      flow -= amount;
      remaining -= amount;
      if (remaining <= 1e-9) {
        trips.push(currentTrip);
        currentTrip = [];
        remaining = capacity;
      }
    }
  }
  if (currentTrip.length) trips.push(currentTrip);
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
        note: "TSP 道路访问顺序 + 单车容量拆分；组合课程方法，不宣称为完整 CVRP。",
        need: "请先初始化 GIS、运行优化并加载当前最优路径。",
        running: "正在计算道路 TSP 顺序与容量 trips…",
        ready: "车队计划已生成",
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
        note: "Road-based TSP visit order + vehicle-capacity trip splitting; a course-method combination, not a full CVRP claim.",
        need: "Initialise GIS, run optimisation and load current optimal paths first.",
        running: "Calculating road TSP sequence and capacity trips…",
        ready: "Fleet plan generated",
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
  const state = { map: null, graph: null, layers: [], routeCache: new Map() };

  function captureMap(layer) {
    if (state.map || typeof layer?.addTo !== "function") return;
    const originalAdd = layer.addTo;
    layer.addTo = function fleetCaptureAddTo(target) {
      const result = originalAdd.call(this, target);
      if (!state.map && target?._map) state.map = target._map;
      return result;
    };
  }
  if (!L.circleMarker.__acidchFleetWrapped) {
    const original = L.circleMarker;
    const wrapped = (...args) => {
      const layer = original.apply(L, args);
      captureMap(layer);
      return layer;
    };
    wrapped.__acidchFleetWrapped = true;
    wrapped.__acidchFleetOriginal = original;
    L.circleMarker = wrapped;
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

  const clearLayers = () => {
    state.layers.forEach((layer) => {
      try {
        layer.remove();
      } catch {
        // Presentation-only cleanup.
      }
    });
    state.layers = [];
  };

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
      assignments.push({
        hub: match[1].trim(),
        demand: match[2].trim(),
        flow: Number(match[3].replaceAll(",", "")) || 0,
        hubPoint: { lat: points[0].lat, lon: points[0].lng },
        demandPoint: { lat: points.at(-1).lat, lon: points.at(-1).lng },
      });
    }
    return assignments;
  }

  const scenarioParams = () => ({
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
  });

  async function osrmMatrix(points) {
    const coords = points.map((point) => `${point.lon},${point.lat}`).join(";");
    const response = await F(`https://router.project-osrm.org/table/v1/driving/${coords}?annotations=distance,duration`);
    const data = await response.json();
    if (!response.ok || !Array.isArray(data.durations)) throw new Error("OSRM table unavailable");
    return {
      matrix: data.durations.map((row) => row.map((value) => Number.isFinite(value) ? value / 60 : Infinity)),
      distance: data.distances?.map((row) => row.map((value) => Number.isFinite(value) ? value / 1000 : Infinity)) || null,
      scenario: null,
    };
  }

  function currentMatrix(points) {
    if (D.getElementById("geo4-engine")?.value !== "osm" || !state.graph) return null;
    const result = graphOdMatrix({
      graph: state.graph,
      sources: points,
      destinations: points,
      scenarioParams: scenarioParams(),
      metric: "time",
    });
    return { matrix: result.matrix, distance: null, scenario: result.scenario };
  }

  function tripMatrixMetrics(trip, indexByDemand, matrix, distance) {
    let minutes = 0;
    let km = 0;
    let current = 0;
    for (const stop of trip) {
      const next = indexByDemand.get(stop.demand);
      if (next == null) continue;
      minutes += matrix[current]?.[next] ?? 0;
      if (distance) km += distance[current]?.[next] ?? 0;
      current = next;
    }
    minutes += matrix[current]?.[0] ?? 0;
    if (distance) km += distance[current]?.[0] ?? 0;
    return { minutes, km };
  }

  async function osrmGeometry(points) {
    const key = points.map((point) => `${point.lon.toFixed(5)},${point.lat.toFixed(5)}`).join(";");
    if (state.routeCache.has(key)) return state.routeCache.get(key);
    const coords = points.map((point) => `${point.lon},${point.lat}`).join(";");
    const response = await F(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`);
    const data = await response.json();
    if (!response.ok || !data.routes?.[0]) throw new Error("OSRM route unavailable");
    const route = {
      coords: data.routes[0].geometry.coordinates.map(([lon, lat]) => [lat, lon]),
      km: data.routes[0].distance / 1000,
      minutes: data.routes[0].duration / 60,
    };
    state.routeCache.set(key, route);
    return route;
  }

  function graphGeometry(points, scenario) {
    const coords = [];
    let km = 0;
    let minutes = 0;
    for (let index = 0; index < points.length - 1; index += 1) {
      const source = nearestGraphNode(state.graph, points[index]);
      const target = nearestGraphNode(state.graph, points[index + 1]);
      if (!source?.nodeId || !target?.nodeId) continue;
      const path = reconstructGraphPath(state.graph, source.nodeId, target.nodeId, scenario, "time");
      if (!path) continue;
      const leg = path.coordinates.map((point) => [point.lat, point.lon]);
      if (coords.length && leg.length) leg.shift();
      coords.push(...leg);
      km += path.distanceKm || 0;
      minutes += path.travelTimeMin || 0;
    }
    return { coords, km, minutes };
  }

  function renderRoute(route, hubName, names, count, colour) {
    if (!state.map || route.coords.length < 2) return;
    const layer = L.polyline(route.coords, {
      color: colour,
      weight: 2.05,
      opacity: 0.74,
      dashArray: "9 6",
      className: "geo4__fleet-route",
    }).bindTooltip(`${hubName}<br>${names}<br>${count}× trip · ${route.km.toFixed(1)} km · ${route.minutes.toFixed(0)} min`).addTo(state.map);
    state.layers.push(layer);
  }

  async function build() {
    clearLayers();
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
      const groups = new Map();
      for (const assignment of assignments) {
        if (!groups.has(assignment.hub)) groups.set(assignment.hub, new Map());
        const hub = groups.get(assignment.hub);
        const prior = hub.get(assignment.demand);
        if (prior) prior.flow += assignment.flow;
        else hub.set(assignment.demand, { ...assignment });
      }

      let totalTrips = 0;
      let totalKm = 0;
      let totalMinutes = 0;
      const summaries = [];
      let groupIndex = 0;
      for (const [hubName, demandMap] of groups) {
        const deliveries = [...demandMap.values()];
        const points = [deliveries[0].hubPoint, ...deliveries.map((item) => item.demandPoint)];
        const matrixData = currentMatrix(points) || await osrmMatrix(points);
        const tsp = exactTsp(matrixData.matrix);
        const trips = splitByCapacity(tsp.order, deliveries, capacity);
        const indexByDemand = new Map(deliveries.map((item, index) => [item.demand, index + 1]));
        const signatures = new Map();
        let hubKm = 0;
        let hubMinutes = 0;
        for (const trip of trips) {
          const names = trip.map((stop) => stop.demand).join(" → ");
          const key = `${hubName}|${names}`;
          if (!signatures.has(key)) {
            signatures.set(key, {
              names,
              count: 0,
              points: [deliveries[0].hubPoint, ...trip.map((stop) => stop.demandPoint), deliveries[0].hubPoint],
            });
          }
          signatures.get(key).count += 1;
          const metrics = tripMatrixMetrics(trip, indexByDemand, matrixData.matrix, matrixData.distance);
          hubMinutes += metrics.minutes;
          hubKm += metrics.km;
        }

        for (const entry of [...signatures.values()].slice(0, 18)) {
          const route = matrixData.scenario
            ? graphGeometry(entry.points, matrixData.scenario)
            : await osrmGeometry(entry.points);
          renderRoute(route, hubName, entry.names, entry.count, groupIndex % 2 ? "#ffcc66" : "#ffb85c");
          if (!matrixData.distance) hubKm += route.km * entry.count;
        }
        totalTrips += trips.length;
        totalKm += hubKm;
        totalMinutes += hubMinutes;
        summaries.push({ hubName, trips: trips.length, method: tsp.method, objective: tsp.cost });
        groupIndex += 1;
      }

      const available = fleet * tripsPerVehicle;
      const feasible = totalTrips <= available;
      outputs.trips.textContent = String(totalTrips);
      outputs.available.textContent = String(available);
      outputs.distance.textContent = totalKm > 0 ? `${totalKm.toFixed(1)} km` : "—";
      outputs.time.textContent = `${(totalMinutes / 60).toFixed(1)} h`;
      status.textContent = `${copy.ready}. ${feasible ? copy.feasible : copy.infeasible}.`;
      status.className = `geo4__fleet-status ${feasible ? "ok" : "bad"}`;
      list.innerHTML = summaries.map((item) => `<div><strong>${item.hubName}</strong>${item.trips} trips · ${item.method === "exact" ? copy.exact : copy.heuristic} · ${item.objective.toFixed(0)} min road-tour objective</div>`).join("");
    } catch (error) {
      globalThis.console?.warn("[Fleet planner]", error);
      status.textContent = copy.unavailable;
      status.className = "geo4__fleet-status bad";
    } finally {
      button.disabled = false;
    }
  }

  button.addEventListener("click", build);
  for (const id of ["geo4-run", "geo4-reset", "geo4-engine", "geo4-road-mode", "geo4-vehicle-capacity", "geo4-trips"]) {
    const element = D.getElementById(id);
    element?.addEventListener("click", clearLayers);
    element?.addEventListener("change", clearLayers);
  }
}

boot();
