import {
  graphOdMatrix,
  nearestGraphNode,
  parseOverpassGraph,
} from "../lib/geospatial/decisionEngine.js";
import {
  solveTspTour,
  splitByCapacity,
  totalTripFlow,
} from "../lib/geospatial/fleetTour.js";
import { reconstructGraphPath } from "../lib/geospatial/pathTools.js";

const D = globalThis.document;
const F = (...args) => globalThis.fetch(...args);

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
        note: "道路 TSP 访问顺序与单车容量拆分共同形成车队行程；只有覆盖全部当前分配需求并能返回出发设施的完整道路 tour 才会被接受。",
        need: "请先运行主模型优化；Fleet/TSP 会直接读取当前分配与道路情景。",
        running: "正在计算道路 TSP 顺序与容量 trips…",
        runningHub: "正在验证完整道路 tour",
        ready: "车队计划已生成",
        unavailable: "当前路线或道路服务不可用，未生成车队方案。",
        roadIncomplete: "当前道路情景无法形成覆盖全部已分配需求并返回出发设施的完整 tour",
        roadAdvice: "请降低封路比例、切换道路情景或增加可达道路后重新运行主模型与 Fleet/TSP。",
        splitMismatch: "车队容量拆分未覆盖完整分配流量，已阻止输出不完整方案。",
        trips: "需要 Trips",
        available: "可用 Trips",
        minimum: "建议最少车辆",
        distance: "计划距离",
        time: "计划时间",
        feasible: "运力可行",
        infeasible: "运力不足",
        shortfall: "Trips 缺口",
        exact: "Exact TSP",
        heuristic: "Heuristic TSP",
      }
    : {
        title: "Fleet Road Planner",
        build: "Build fleet tours",
        note: "Road-based TSP sequencing and vehicle-capacity splitting form the fleet trips. A plan is accepted only when every allocated demand can be visited and the tour can return to its origin facility.",
        need: "Run the main optimisation first; Fleet/TSP reads the current allocation and road scenario directly.",
        running: "Calculating road TSP sequence and capacity trips…",
        runningHub: "Validating a complete road tour",
        ready: "Fleet plan generated",
        unavailable: "The current route or road service is unavailable; no fleet plan was produced.",
        roadIncomplete: "The active road scenario cannot form a complete tour that serves every allocated demand and returns to the origin facility",
        roadAdvice: "Reduce closures, change the road scenario or add reachable roads, then rerun the main optimisation and Fleet/TSP.",
        splitMismatch: "Fleet capacity splitting did not preserve the complete allocated flow, so the incomplete plan was blocked.",
        trips: "Trips required",
        available: "Trips available",
        minimum: "Minimum vehicles",
        distance: "Planned distance",
        time: "Planned time",
        feasible: "Fleet feasible",
        infeasible: "Fleet shortfall",
        shortfall: "Trip shortfall",
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
  panel.innerHTML = `<div class="geo4__fleet-planner-head"><span>FLEET / TSP</span><strong>${copy.title}</strong></div><button type="button" class="geo4__fleet-build">${copy.build}</button><p class="geo4__fleet-note">${copy.note}</p><div class="geo4__fleet-summary"><div><span>${copy.trips}</span><b data-fleet-trips>—</b></div><div><span>${copy.available}</span><b data-fleet-available>—</b></div><div><span>${copy.minimum}</span><b data-fleet-minimum>—</b></div><div><span>${copy.distance}</span><b data-fleet-distance>—</b></div><div><span>${copy.time}</span><b data-fleet-time>—</b></div></div><p class="geo4__fleet-status">${copy.need}</p><div class="geo4__fleet-tour-list"></div>`;
  fleetBlock.appendChild(panel);

  const button = panel.querySelector(".geo4__fleet-build");
  const status = panel.querySelector(".geo4__fleet-status");
  const list = panel.querySelector(".geo4__fleet-tour-list");
  const outputs = {
    trips: panel.querySelector("[data-fleet-trips]"),
    available: panel.querySelector("[data-fleet-available]"),
    minimum: panel.querySelector("[data-fleet-minimum]"),
    distance: panel.querySelector("[data-fleet-distance]"),
    time: panel.querySelector("[data-fleet-time]"),
  };
  const state = { map: null, graph: null, layers: [], routeCache: new Map() };

  function resetOutputs() {
    Object.values(outputs).forEach((node) => {
      if (node) node.textContent = "—";
    });
    if (list) list.innerHTML = "";
  }

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
        response
          .clone()
          .json()
          .then((payload) => {
            if (!Array.isArray(payload?.elements) || !payload.elements.length) return;
            const graph = parseOverpassGraph(payload.elements);
            if (graph?.edges?.length) state.graph = graph;
          })
          .catch(() => {});
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
      if (
        typeof layer?.getLatLngs !== "function" ||
        typeof layer?.getTooltip !== "function"
      )
        continue;
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
    congestionShare:
      Number(D.getElementById("geo4-congestion-share")?.value || 0) / 100,
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
    const response = await F(
      `https://router.project-osrm.org/table/v1/driving/${coords}?annotations=distance,duration`,
    );
    const data = await response.json();
    if (!response.ok || !Array.isArray(data.durations))
      throw new Error("OSRM table unavailable");
    return {
      matrix: data.durations.map((row) =>
        row.map((value) => (Number.isFinite(value) ? value / 60 : Infinity)),
      ),
      distance:
        data.distances?.map((row) =>
          row.map((value) => (Number.isFinite(value) ? value / 1000 : Infinity)),
        ) || null,
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
      const legMinutes = matrix[current]?.[next];
      if (!Number.isFinite(legMinutes)) return { minutes: Infinity, km: Infinity };
      minutes += legMinutes;
      if (distance) {
        const legKm = distance[current]?.[next];
        if (!Number.isFinite(legKm)) return { minutes: Infinity, km: Infinity };
        km += legKm;
      }
      current = next;
    }
    const backMinutes = matrix[current]?.[0];
    if (!Number.isFinite(backMinutes)) return { minutes: Infinity, km: Infinity };
    minutes += backMinutes;
    if (distance) {
      const backKm = distance[current]?.[0];
      if (!Number.isFinite(backKm)) return { minutes: Infinity, km: Infinity };
      km += backKm;
    }
    return { minutes, km };
  }

  async function osrmGeometry(points) {
    const key = points
      .map((point) => `${point.lon.toFixed(5)},${point.lat.toFixed(5)}`)
      .join(";");
    if (state.routeCache.has(key)) return state.routeCache.get(key);
    const coords = points.map((point) => `${point.lon},${point.lat}`).join(";");
    const response = await F(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`,
    );
    const data = await response.json();
    if (!response.ok || !data.routes?.[0]) throw new Error("OSRM route unavailable");
    const route = {
      coords: data.routes[0].geometry.coordinates.map(([lon, lat]) => [lat, lon]),
      km: data.routes[0].distance / 1000,
      minutes: data.routes[0].duration / 60,
      complete: true,
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
      if (!source?.nodeId || !target?.nodeId) {
        return { coords, km, minutes, complete: false, failedLeg: index };
      }
      const path = reconstructGraphPath(
        state.graph,
        source.nodeId,
        target.nodeId,
        scenario,
        "time",
      );
      if (!path) return { coords, km, minutes, complete: false, failedLeg: index };
      const leg = path.coordinates.map((point) => [point.lat, point.lon]);
      if (coords.length && leg.length) leg.shift();
      coords.push(...leg);
      km += path.distanceKm || 0;
      minutes += path.travelTimeMin || 0;
    }
    return { coords, km, minutes, complete: true, failedLeg: null };
  }

  function renderRoute(route, hubName, names, count, colour) {
    if (!state.map || !route.complete || route.coords.length < 2) return false;
    const layer = L.polyline(route.coords, {
      color: colour,
      weight: 2.05,
      opacity: 0.74,
      dashArray: "9 6",
      className: "geo4__fleet-route",
    })
      .bindTooltip(
        `${hubName}<br>${names}<br>${count}× trip · ${route.km.toFixed(1)} km · ${route.minutes.toFixed(0)} min`,
      )
      .addTo(state.map);
    state.layers.push(layer);
    return true;
  }

  function roadTourError(hubName, demands = []) {
    const error = new Error("fleet-road-incomplete");
    error.code = "fleet-road-incomplete";
    error.hubName = hubName;
    error.demands = [...new Set(demands.filter(Boolean))];
    return error;
  }

  async function build() {
    clearLayers();
    resetOutputs();
    const assignments = verifiedAssignments();
    if (!assignments.length || !state.map) {
      root.dataset.fleetPlanState = "needs-main";
      status.textContent = copy.need;
      status.className = "geo4__fleet-status bad";
      return;
    }

    button.disabled = true;
    root.dataset.fleetPlanState = "running";
    delete root.dataset.fleetFailureReason;
    status.textContent = copy.running;
    status.className = "geo4__fleet-status";

    try {
      const capacity = Math.max(
        1,
        Number(D.getElementById("geo4-vehicle-capacity")?.value || 1),
      );
      const fleet = Math.max(
        0,
        Number(D.getElementById("geo4-fleet-out")?.textContent || 0),
      );
      const tripsPerVehicle = Math.max(
        0,
        Number(D.getElementById("geo4-trips")?.value || 0),
      );
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
        status.textContent = `${copy.runningHub} ${groupIndex + 1}/${groups.size} · ${hubName}`;
        const deliveries = [...demandMap.values()];
        const points = [
          deliveries[0].hubPoint,
          ...deliveries.map((item) => item.demandPoint),
        ];
        const matrixData = currentMatrix(points) || (await osrmMatrix(points));
        const tsp = solveTspTour(matrixData.matrix);
        if (!tsp.complete) {
          const unresolved = tsp.unvisited
            .map((node) => deliveries[node - 1]?.demand)
            .filter(Boolean);
          if (tsp.returnBlocked && !unresolved.length) {
            unresolved.push(...deliveries.map((item) => item.demand));
          }
          throw roadTourError(hubName, unresolved);
        }

        const trips = splitByCapacity(tsp.order, deliveries, capacity);
        const expectedFlow = deliveries.reduce((sum, item) => sum + item.flow, 0);
        const plannedFlow = totalTripFlow(trips);
        if (Math.abs(plannedFlow - expectedFlow) > 1e-6) {
          const error = new Error("fleet-split-mismatch");
          error.code = "fleet-split-mismatch";
          throw error;
        }

        const indexByDemand = new Map(
          deliveries.map((item, index) => [item.demand, index + 1]),
        );
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
              points: [
                deliveries[0].hubPoint,
                ...trip.map((stop) => stop.demandPoint),
                deliveries[0].hubPoint,
              ],
            });
          }
          signatures.get(key).count += 1;
          const metrics = tripMatrixMetrics(
            trip,
            indexByDemand,
            matrixData.matrix,
            matrixData.distance,
          );
          if (!Number.isFinite(metrics.minutes)) {
            throw roadTourError(hubName, trip.map((stop) => stop.demand));
          }
          hubMinutes += metrics.minutes;
          hubKm += metrics.km;
        }

        for (const entry of [...signatures.values()].slice(0, 18)) {
          const route = matrixData.scenario
            ? graphGeometry(entry.points, matrixData.scenario)
            : await osrmGeometry(entry.points);
          if (!route.complete) {
            throw roadTourError(hubName, entry.names.split(" → "));
          }
          renderRoute(
            route,
            hubName,
            entry.names,
            entry.count,
            groupIndex % 2 ? "#ffcc66" : "#ffb85c",
          );
          if (!matrixData.distance) hubKm += route.km * entry.count;
        }

        totalTrips += trips.length;
        totalKm += hubKm;
        totalMinutes += hubMinutes;
        summaries.push({
          hubName,
          trips: trips.length,
          method: tsp.method,
          objective: tsp.cost,
        });
        groupIndex += 1;
      }

      const available = fleet * tripsPerVehicle;
      const minimumFleet =
        tripsPerVehicle > 0 ? Math.ceil(totalTrips / tripsPerVehicle) : null;
      const feasible = totalTrips <= available;
      const shortfall = Math.max(0, totalTrips - available);

      outputs.trips.textContent = String(totalTrips);
      outputs.available.textContent = String(available);
      outputs.minimum.textContent = minimumFleet == null ? "—" : String(minimumFleet);
      outputs.distance.textContent = totalKm > 0 ? `${totalKm.toFixed(1)} km` : "—";
      outputs.time.textContent = `${(totalMinutes / 60).toFixed(1)} h`;

      if (feasible) {
        root.dataset.fleetPlanState = "ready";
        status.textContent = `${copy.ready}. ${copy.feasible}: ${totalTrips} trips / ${available} available.`;
        status.className = "geo4__fleet-status ok";
      } else {
        root.dataset.fleetPlanState = "capacity-shortfall";
        root.dataset.fleetFailureReason = "capacity-shortfall";
        const minimumText =
          minimumFleet == null
            ? ""
            : zh
              ? ` 按当前每车 ${tripsPerVehicle} trips，建议至少 ${minimumFleet} 辆车。`
              : ` At ${tripsPerVehicle} trips per vehicle, at least ${minimumFleet} vehicles are recommended.`;
        status.textContent = `${copy.ready}. ${copy.infeasible}: ${totalTrips} trips / ${available} available · ${copy.shortfall} ${shortfall}.${minimumText}`;
        status.className = "geo4__fleet-status bad";
      }

      list.innerHTML = summaries
        .map(
          (item) =>
            `<div><strong>${item.hubName}</strong>${item.trips} trips · ${item.method === "exact" ? copy.exact : copy.heuristic} · ${item.objective.toFixed(0)} min road-tour objective</div>`,
        )
        .join("");
    } catch (error) {
      globalThis.console?.warn("[Fleet planner]", error);
      clearLayers();
      resetOutputs();
      if (error?.code === "fleet-road-incomplete") {
        root.dataset.fleetPlanState = "road-infeasible";
        root.dataset.fleetFailureReason = "road-infeasible";
        const names = error.demands?.length ? `: ${error.demands.join("、")}` : "";
        status.textContent = `${copy.roadIncomplete}${names}. ${copy.roadAdvice}`;
      } else if (error?.code === "fleet-split-mismatch") {
        root.dataset.fleetPlanState = "invalid";
        root.dataset.fleetFailureReason = "split-mismatch";
        status.textContent = copy.splitMismatch;
      } else {
        root.dataset.fleetPlanState = "service-unavailable";
        root.dataset.fleetFailureReason = "service-unavailable";
        status.textContent = copy.unavailable;
      }
      status.className = "geo4__fleet-status bad";
    } finally {
      button.disabled = false;
    }
  }

  button.addEventListener("click", build);
  for (const id of [
    "geo4-run",
    "geo4-reset",
    "geo4-engine",
    "geo4-road-mode",
    "geo4-vehicle-capacity",
    "geo4-trips",
  ]) {
    const element = D.getElementById(id);
    element?.addEventListener("click", clearLayers);
    element?.addEventListener("change", clearLayers);
  }
}

boot();
