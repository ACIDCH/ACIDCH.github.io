import { graphNetworkMatrix, nearestGraphNode } from "../lib/geospatial/decisionEngine.js";
import { reconstructGraphPath } from "../lib/geospatial/pathTools.js";
import {
  assignTripsToVehicles,
  buildSplitDeliveryRoutes,
  validateFleetPlan,
} from "../lib/geospatial/fleetEngine.js";
import { totalTripFlow } from "../lib/geospatial/fleetTour.js";
import { getGeospatialStore } from "../lib/geospatial/geospatialStore.js";
import { getGisServices } from "../lib/geospatial/gisServices.js";
import { createDisruptionEvent } from "../lib/geospatial/disruptionEvents.js";

const D = globalThis.document;

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
        note: "Fleet/TSP 会直接读取当前分配与道路情景；Split-delivery Clarke–Wright 与 2-opt 形成容量可行路线，再将每趟分配到满足班次时长与趟数上限的具体车辆。",
        need: "请先初始化 GIS、运行优化并加载当前最优路径。",
        running: "正在计算道路 TSP 顺序与容量 trips…",
        ready: "车队计划已生成",
        unavailable: "当前路线或道路服务不可用。",
        trips: "需要 Trips",
        available: "可用 Trips",
        minimum: "建议最少车辆",
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
        note: "Split-delivery Clarke–Wright construction and 2-opt create capacity-feasible routes, then each trip is assigned to a vehicle under shift-hour and trip-count limits.",
        need: "Initialise GIS, run optimisation and load current optimal paths first.",
        running: "Calculating road TSP sequence and capacity trips…",
        ready: "Fleet plan generated",
        unavailable: "Current route or road service is unavailable.",
        trips: "Trips required",
        available: "Trips available",
        minimum: "Minimum vehicles",
        distance: "Planned distance",
        time: "Planned time",
        feasible: "Fleet feasible",
        infeasible: "Fleet shortfall",
        exact: "Exact TSP",
        heuristic: "Heuristic TSP",
      };

  const style = D.createElement("style");
  style.textContent = `
    .geo4__fleet-planner{margin-top:.7rem;padding-top:.65rem;border-top:1px solid rgba(116,190,213,.16)}.geo4__fleet-planner-head{display:flex;justify-content:space-between;gap:.5rem;align-items:center}.geo4__fleet-planner-head strong{font-size:.65rem;color:#eafaff}.geo4__fleet-planner-head span{color:#ffcc66;font:700 .5rem monospace;letter-spacing:.1em}.geo4__fleet-build{width:100%;margin-top:.45rem;border-color:rgba(255,204,102,.3)!important;color:#ffdb86!important;white-space:nowrap}.geo4__fleet-note{margin:.4rem 0 0;color:#698892;font-size:.52rem;line-height:1.42}.geo4__fleet-summary{display:grid;grid-template-columns:1fr 1fr;gap:.3rem;margin-top:.48rem}.geo4__fleet-summary>div{padding:.36rem .4rem;border:1px solid rgba(255,204,102,.11);background:rgba(53,42,18,.16)}.geo4__fleet-summary span{display:block;color:#728d95;font-size:.45rem}.geo4__fleet-summary b{display:block;margin-top:.15rem;color:#f6fbfc;font:700 .65rem monospace}.geo4__fleet-status{margin:.42rem 0 0;color:#728e98;font-size:.53rem;line-height:1.4}.geo4__fleet-status.ok{color:#d8ff6b}.geo4__fleet-status.bad{color:#ff759a}.geo4__fleet-tour-list{display:grid;gap:.28rem;margin-top:.45rem}.geo4__fleet-tour-list>div{padding:.34rem .4rem;border-left:2px solid rgba(255,204,102,.5);background:rgba(8,33,43,.42);color:#78959f;font-size:.49rem;line-height:1.4}.geo4__fleet-tour-list strong{display:block;color:#e7f8fb;font-size:.55rem}.geo4__fleet-route{filter:drop-shadow(0 0 4px rgba(255,204,102,.32))}
  `;
  D.head.appendChild(style);

  const panel = D.createElement("div");
  panel.className = "geo4__fleet-planner";
  panel.innerHTML = `<div class="geo4__fleet-planner-head"><span>FLEET / SD-CVRP</span><strong>${copy.title}</strong></div><button type="button" class="geo4__fleet-build">${copy.build}</button><p class="geo4__fleet-note">${copy.note}</p><div class="geo4__fleet-summary"><div><span>${copy.trips}</span><b data-fleet-trips>—</b></div><div><span>${copy.available}</span><b data-fleet-available>—</b></div><div><span>${copy.minimum}</span><b data-fleet-minimum>—</b></div><div><span>${copy.distance}</span><b data-fleet-distance>—</b></div><div><span>${copy.time}</span><b data-fleet-time>—</b></div></div><p class="geo4__fleet-status">${copy.need}</p><div class="geo4__fleet-tour-list"></div>`;
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
  const store = getGeospatialStore();
  const services = getGisServices();
  const initial = store.getState();
  const state = {
    map: initial.presentation.map,
    graph: initial.graph,
    layers: [],
    routeCache: new Map(),
  };
  store.subscribe((next) => {
    state.map = next.presentation.map;
    state.graph = next.graph;
    if (next.freshness.main !== "current") {
      clearLayers();
      Object.values(outputs).forEach((output) => (output.textContent = "—"));
      list.innerHTML = "";
      status.textContent = copy.need;
      status.className = "geo4__fleet-status bad";
    }
  });

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
    const snapshot = store.getState();
    if (snapshot.freshness.main !== "current" || !snapshot.mainSolution) return [];
    return snapshot.mainSolution.assignments.map((assignment) => {
      const facility = snapshot.entities.facilities[assignment.hub];
      const demand = snapshot.entities.demands[assignment.demand];
      return {
        hub: facility.name,
        demand: demand.name,
        flow: assignment.flow,
        hubPoint: facility.point,
        demandPoint: demand.point,
      };
    });
  }

  const scenarioParams = () => {
    const snapshot = store.getState();
    const seed = Number(D.getElementById("geo4-seed")?.value || 708709);
    const event = createDisruptionEvent({
      eventId: snapshot.scenarioInputs.disruptionEvent || "none",
      seed,
      facilities: snapshot.entities.facilities,
      demands: snapshot.entities.demands,
    });
    return {
      mode: D.getElementById("geo4-road-mode")?.value || "baseline",
      congestionSeverity: Number(D.getElementById("geo4-congestion")?.value || 0) / 100,
      congestionShare:
        Number(D.getElementById("geo4-congestion-share")?.value || 0) / 100,
      closureShare: Number(D.getElementById("geo4-closure")?.value || 0) / 100,
      improvement: 0.25,
      improvementShare: 0.3,
      newRoadLinks: Number(snapshot.scenarioInputs.newRoads || 0),
      maxNewRoadKm: 0.65,
      newRoadSpeedKph: 50,
      seed,
      ...event.networkScenario,
    };
  };

  async function osrmMatrix(points) {
    const data = await services.osrmTable(points, points);
    return {
      matrix: data.durationMin,
      distance: data.distanceKm,
      scenario: null,
    };
  }

  function currentMatrix(points) {
    if (D.getElementById("geo4-engine")?.value !== "osm" || !state.graph) return null;
    const result = graphNetworkMatrix({
      graph: state.graph,
      sources: points,
      destinations: points,
      scenarioParams: scenarioParams(),
      costPerKm: 0,
      costPerMinute: 0,
    });
    return {
      matrix: result.networkMatrix.durationMin,
      distance: result.networkMatrix.distanceKm,
      scenario: result.scenario,
    };
  }

  async function osrmGeometry(points) {
    const route = await services.osrmRoute(points);
    return {
      coords: route.coordinates.map((point) => [point.lat, point.lon]),
      km: route.distanceKm,
      minutes: route.durationMin,
      complete: route.coordinates.length >= 2,
    };
  }

  function graphGeometry(points, scenario) {
    const coords = [];
    let km = 0;
    let minutes = 0;
    let complete = true;
    for (let index = 0; index < points.length - 1; index += 1) {
      const source = nearestGraphNode(state.graph, points[index]);
      const target = nearestGraphNode(state.graph, points[index + 1]);
      if (!source?.nodeId || !target?.nodeId) {
        complete = false;
        continue;
      }
      const path = reconstructGraphPath(
        state.graph,
        source.nodeId,
        target.nodeId,
        scenario,
        "time",
      );
      if (!path) {
        complete = false;
        continue;
      }
      const leg = path.coordinates.map((point) => [point.lat, point.lon]);
      if (coords.length && leg.length) leg.shift();
      coords.push(...leg);
      km += path.distanceKm || 0;
      minutes += path.travelTimeMin || 0;
    }
    // A co-located hub and demand legitimately snap to the same road node. The
    // resulting zero-length tour is complete even though it has no drawable line.
    return { coords, km, minutes, complete: complete && coords.length >= 1 };
  }

  function validateTripFlow(trips, expected) {
    return Math.abs(totalTripFlow(trips) - expected) <= 1e-6;
  }

  function renderRoute(route, hubName, names, count, colour) {
    if (!state.map || route.coords.length < 2) return;
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
  }

  async function build() {
    clearLayers();
    state.routeCache.clear();
    const assignments = verifiedAssignments();
    if (!assignments.length || !state.map) {
      status.textContent = copy.need;
      status.className = "geo4__fleet-status bad";
      return;
    }
    button.disabled = true;
    status.textContent = copy.running;
    status.className = "geo4__fleet-status";
    const token = store.begin("fleet");
    try {
      const capacity = Math.max(
        1,
        Number(D.getElementById("geo4-vehicle-capacity")?.value || 1),
      );
      const fleet = Math.max(0, Number(store.getState().scenarioInputs.fleet || 0));
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
      let geometryComplete = true;
      const summaries = [];
      const scheduledTrips = [];
      let groupIndex = 0;
      for (const [hubName, demandMap] of groups) {
        const deliveries = [...demandMap.values()];
        const points = [
          deliveries[0].hubPoint,
          ...deliveries.map((item) => item.demandPoint),
        ];
        const matrixData = currentMatrix(points) || (await osrmMatrix(points));
        const plan = buildSplitDeliveryRoutes({
          deliveries: deliveries.map((item) => ({
            id: item.demand,
            name: item.demand,
            demand: item.flow,
          })),
          durationMatrix: matrixData.matrix,
          distanceMatrix: matrixData.distance,
          vehicleCapacity: capacity,
        });
        const tsp = {
          complete:
            plan.feasible &&
            plan.trips.every(
              (trip) => trip.depotStart && trip.depotReturn && trip.reachable,
            ),
        };
        if (!tsp.complete) {
          const error = new Error("Fleet road tour is incomplete");
          error.code = "fleet-road-incomplete";
          throw error;
        }
        if (
          !validateTripFlow(
            plan.trips.map((trip) => trip.stops),
            deliveries.reduce((sum, item) => sum + item.flow, 0),
          )
        ) {
          throw new Error("Fleet allocated-flow conservation failed");
        }
        const signatures = new Map();
        let hubKm = 0;
        let hubMinutes = 0;
        for (const trip of plan.trips) {
          const tripDeliveries = trip.stops.map(
            (stop) => deliveries[stop.deliveryIndex],
          );
          const names = tripDeliveries.map((stop) => stop.demand).join(" → ");
          const key = `${hubName}|${names}`;
          if (!signatures.has(key)) {
            signatures.set(key, {
              names,
              count: 0,
              points: [
                deliveries[0].hubPoint,
                ...tripDeliveries.map((stop) => stop.demandPoint),
                deliveries[0].hubPoint,
              ],
            });
          }
          signatures.get(key).count += 1;
          hubMinutes += trip.durationMin;
          hubKm += trip.distanceKm || 0;
          scheduledTrips.push({ ...trip, hubName, names });
        }

        for (const entry of [...signatures.values()].slice(0, 18)) {
          const route = matrixData.scenario
            ? graphGeometry(entry.points, matrixData.scenario)
            : await osrmGeometry(entry.points);
          if (!route.complete) {
            // Route geometry is presentation-only. The fleet plan has already
            // been validated against the road matrix, so an inability to draw
            // one polyline must not invalidate conserved, capacity-feasible flow.
            geometryComplete = false;
            continue;
          }
          renderRoute(
            route,
            hubName,
            entry.names,
            entry.count,
            groupIndex % 2 ? "#ffcc66" : "#ffb85c",
          );
        }
        totalTrips += plan.trips.length;
        totalKm += hubKm;
        totalMinutes += hubMinutes;
        summaries.push({
          hubName,
          trips: plan.trips.length,
          method: plan.method,
          objective: plan.trips.reduce((sum, trip) => sum + trip.durationMin, 0),
        });
        groupIndex += 1;
      }

      const available = fleet * tripsPerVehicle;
      const shiftHours = Math.max(
        0,
        Number(D.getElementById("geo4-shift-hours")?.value || 8),
      );
      const schedule = assignTripsToVehicles(scheduledTrips, {
        vehicleCount: fleet,
        tripsPerVehicle,
        shiftHours,
      });
      const assignedDemand = assignments.reduce((sum, item) => sum + item.flow, 0);
      const routeValidation = validateFleetPlan(
        {
          feasible: scheduledTrips.every((trip) => trip.reachable),
          trips: scheduledTrips,
        },
        assignedDemand,
      );
      const minimumFleet = tripsPerVehicle
        ? Math.max(
            Math.ceil(totalTrips / tripsPerVehicle),
            Math.ceil(totalMinutes / Math.max(1, shiftHours * 60)),
          )
        : null;
      const feasible = schedule.feasible && routeValidation.valid;
      if (!feasible) root.dataset.fleetPlanState = "capacity-shortfall";
      else root.dataset.fleetPlanState = "ready";
      root.dataset.fleetGeometryState = geometryComplete ? "complete" : "partial";
      outputs.trips.textContent = String(totalTrips);
      outputs.available.textContent = String(available);
      outputs.minimum.textContent = minimumFleet == null ? "—" : String(minimumFleet);
      outputs.distance.textContent = totalKm > 0 ? `${totalKm.toFixed(1)} km` : "—";
      outputs.time.textContent = `${(totalMinutes / 60).toFixed(1)} h`;
      status.textContent = `${copy.ready}. ${feasible ? copy.feasible : copy.infeasible}.${
        geometryComplete
          ? ""
          : zh
            ? " 路线图层部分降级，决策结果仍有效。"
            : " Some route geometry could not be drawn; the decision result remains valid."
      }`;
      status.className = `geo4__fleet-status ${feasible ? "ok" : "bad"}`;
      list.innerHTML = [
        ...summaries.map(
          (item) =>
            `<div><strong>${item.hubName}</strong>${item.trips} trips · ${copy.heuristic} · ${item.objective.toFixed(0)} min · SD-CVRP</div>`,
        ),
        ...schedule.vehicles
          .filter((vehicle) => vehicle.trips.length)
          .map(
            (vehicle) =>
              `<div><strong>${vehicle.vehicleId.replace("vehicle-", zh ? "车辆 " : "Vehicle ")}</strong>${vehicle.trips.length} trips · ${(vehicle.durationMin / 60).toFixed(1)} / ${shiftHours.toFixed(1)} h · ${(vehicle.remainingShiftMin / 60).toFixed(1)} h ${zh ? "剩余" : "remaining"}</div>`,
          ),
      ].join("");
      store.commit(
        token,
        "fleetSolution",
        {
          feasible,
          solverMode: "heuristic",
          method: "split-delivery-clarke-wright+2opt",
          trips: scheduledTrips,
          schedule,
          totalKm,
          totalMinutes,
          routedDemand: routeValidation.routedDemand,
          geometryComplete,
        },
        "fleet",
      );
    } catch (error) {
      globalThis.console?.warn("[Fleet planner]", error);
      root.dataset.fleetPlanState =
        error?.code === "fleet-road-incomplete" ? "road-infeasible" : "degraded";
      root.dataset.fleetGeometryState = "failed";
      status.textContent = copy.unavailable;
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
