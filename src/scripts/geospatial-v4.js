import {
  compareScenarioResults,
  graphNetworkMatrix,
  inventoryPolicy,
  solveTwoEchelonNetwork,
} from "../lib/geospatial/decisionEngine.js";
import {
  connectRouteEndpoints,
  reconstructGraphPath,
  routeGraphNeedsRefresh,
} from "../lib/geospatial/pathTools.js";
import {
  applyNetworkScenario,
  createNetworkMatrix,
  networkMatrixFromDistance,
  repriceNetworkMatrix,
} from "../lib/geospatial/networkMatrix.js";
import { getGeospatialStore } from "../lib/geospatial/geospatialStore.js";
import { getGisServices } from "../lib/geospatial/gisServices.js";
import { attachMapAdapter } from "../lib/geospatial/mapAdapter.js";
import { createDisruptionEvent } from "../lib/geospatial/disruptionEvents.js";
import {
  getAnalysisWorkerClient,
  StaleWorkerResultError,
  WorkerTaskError,
} from "../lib/geospatial/analysisWorkerClient.js";
import { getBasemapConfig } from "../lib/geospatial/basemapConfig.js";
import {
  AUCKLAND_BASELINE_METADATA,
  loadAucklandBaselineGraph,
} from "../data/geospatial/aucklandBaselineSnapshot.js";

const GRAPH_RETRY_COOLDOWN_MS = 5 * 60 * 1000;
const MAX_SESSION_GRAPH_ELEMENTS = 25_000;
const D = globalThis.document,
  wait = (n) => new Promise((r) => globalThis.setTimeout(r, n));
function boot() {
  const root = D?.getElementById("geo-v4"),
    L = globalThis.L;
  if (!root) return;
  if (!L) {
    globalThis.setTimeout(boot, 60);
    return;
  }
  const zh = (root.dataset.locale || "zh") === "zh",
    store = getGeospatialStore(),
    services = getGisServices(),
    analysisWorker = getAnalysisWorkerClient(),
    T = zh
      ? {
          ready: "基础网络已就绪，可直接运行优化。",
          coords: "正在解析 Auckland GIS 点位…",
          coordsOk: "GIS 点位已加载并缓存。",
          coordsFail: "GIS 点位加载失败；快速 OD 网络仍可继续使用。",
          graph: "正在构建 OSM 可驾驶道路图…",
          graphOk: "OSM 路网已加载。",
          graphFail: "在线 OSM 路网不可用；继续使用内置 Auckland 基线路网。",
          solve: "正在计算当前情景…",
          solved: "当前情景已完成重新优化。",
          none: "当前设施、覆盖、容量或车队约束下没有可行方案。",
          geo: "正在解析地点并用批量道路矩阵更新网络…",
          addFail: "地点添加失败，请检查地址或网络服务。",
          on: "地图添加：开启",
          off: "地图点击添加",
          remove: "删除",
          auto: "自动",
          must: "必须开启",
          exclude: "排除",
          warehouse: "仓库",
          factory: "工厂",
          demand: "需求点",
          keepOne: "设施与需求点至少各保留一个。",
          graphReload: "实体超出当前路网范围，正在重新加载道路图…",
          graphCached: "正在使用本次会话缓存的道路图…",
          sim: "正在运行 Monte Carlo 稳健性模拟…",
          simOk: "Monte Carlo 稳健性模拟完成。",
          route: "正在加载当前最优分配路径…",
          routeOk: "最优路径已加载；OSM 模式与本次 Dijkstra 情景一致。",
          routePart: "部分路径不可用，保留分配线作为降级显示。",
          routeRefresh:
            "正在按当前实体范围刷新 OSM 路网并重新优化，完成后将自动加载路径…",
          routeFallback:
            "完整路径已加载；在线 OSM 路网不可用，部分路径使用 OSRM 降级几何。",
          a: "已保存情景 A。",
          b: "已保存情景 B。",
          ab: "A / B 对比已生成。",
          need: "需要先分别保存 A 和 B。",
          stale: "参数已改变；旧结果已失效，请重新运行优化。",
          covered: "已覆盖",
          uncovered: "未覆盖",
          redundant: "2×+ 重叠覆盖",
          baseline: "基线",
          vsBaseline: "较基线",
        }
      : {
          ready: "Baseline network ready for optimisation.",
          coords: "Resolving Auckland GIS points…",
          coordsOk: "GIS points loaded and cached.",
          coordsFail: "GIS points failed; the Fast OD Network remains available.",
          graph: "Building the OSM drivable road graph…",
          graphOk: "OSM Road Network loaded.",
          graphFail:
            "Live OSM unavailable; retained the built-in Auckland baseline graph.",
          solve: "Calculating scenario…",
          solved: "Scenario re-optimised.",
          none: "No feasible solution under current facility, coverage, capacity or fleet constraints.",
          geo: "Resolving the location and updating the batched road matrix…",
          addFail: "Location add failed. Check the address or network service.",
          on: "Map add: on",
          off: "Map-click add",
          remove: "Remove",
          auto: "Auto",
          must: "Must open",
          exclude: "Exclude",
          warehouse: "Warehouse",
          factory: "Factory",
          demand: "Demand",
          keepOne: "Keep at least one facility and one demand node.",
          graphReload: "Entity is outside the current graph; reloading roads…",
          graphCached: "Using the road graph cached for this session…",
          sim: "Running Monte Carlo robustness simulation…",
          simOk: "Monte Carlo robustness simulation complete.",
          route: "Loading current optimal paths…",
          routeOk:
            "Optimal paths loaded; OSM mode matches the current Dijkstra scenario.",
          routePart:
            "Some paths were unavailable; allocation links remain as fallback.",
          routeRefresh:
            "Refreshing the OSM graph for the current entity extent and re-optimising before paths are drawn…",
          routeFallback:
            "Paths loaded; the live OSM graph was unavailable, so some routes use OSRM fallback geometry.",
          a: "Scenario A saved.",
          b: "Scenario B saved.",
          ab: "A / B comparison generated.",
          need: "Save both A and B first.",
          stale: "Inputs changed; previous results are stale. Run optimisation again.",
          covered: "Covered",
          uncovered: "Uncovered",
          redundant: "2×+ coverage",
          baseline: "Baseline",
          vsBaseline: "vs baseline",
        };
  const FACILITY_REGIONS = [
      {
        name: "North",
        points: [
          ["Albany", -36.7245, 174.6978],
          ["Browns Bay", -36.7167, 174.75],
          ["Takapuna", -36.787, 174.775],
          ["Silverdale", -36.6167, 174.675],
        ],
      },
      {
        name: "West",
        points: [
          ["Henderson", -36.879, 174.63],
          ["Westgate", -36.819, 174.613],
          ["Te Atatu", -36.866, 174.657],
          ["New Lynn", -36.91, 174.684],
        ],
      },
      {
        name: "Central",
        points: [
          ["Auckland CBD", -36.8485, 174.7633],
          ["Mount Eden", -36.877, 174.764],
          ["Epsom", -36.889, 174.797],
          ["Onehunga", -36.921, 174.785],
          ["Newmarket", -36.869, 174.777],
        ],
      },
      {
        name: "East",
        points: [
          ["Orakei", -36.8585, 174.811],
          ["Panmure", -36.896, 174.855],
          ["Pakuranga", -36.883, 174.915],
          ["Howick", -36.895, 174.93],
        ],
      },
      {
        name: "South",
        points: [
          ["Manukau", -36.992, 174.879],
          ["Manurewa", -37.021, 174.901],
          ["Takanini", -37.041, 174.921],
          ["Papakura", -37.066, 174.943],
          ["Drury", -37.101, 174.956],
        ],
      },
    ],
    DEMAND_REGIONS = [
      {
        name: "North",
        points: [
          ["Albany Demand", -36.735, 174.698],
          ["Rosedale Demand", -36.742, 174.717],
          ["Browns Bay Demand", -36.715, 174.748],
          ["Northcross Demand", -36.703, 174.733],
        ],
      },
      {
        name: "West",
        points: [
          ["Henderson Demand", -36.879, 174.63],
          ["Massey Demand", -36.814, 174.606],
          ["New Lynn Demand", -36.909, 174.681],
          ["Glen Eden Demand", -36.923, 174.65],
        ],
      },
      {
        name: "Central",
        points: [
          ["CBD Demand", -36.8485, 174.7633],
          ["Kingsland Demand", -36.882, 174.719],
          ["Epsom Demand", -36.889, 174.797],
          ["One Tree Hill Demand", -36.901, 174.785],
        ],
      },
      {
        name: "East",
        points: [
          ["Orakei Demand", -36.8585, 174.811],
          ["Panmure Demand", -36.895, 174.854],
          ["Pakuranga Demand", -36.883, 174.915],
          ["Howick Demand", -36.895, 174.93],
        ],
      },
      {
        name: "South",
        points: [
          ["Manukau Demand", -36.992, 174.879],
          ["Manurewa Demand", -37.021, 174.901],
          ["Takanini Demand", -37.041, 174.921],
          ["Papakura Demand", -37.066, 174.943],
        ],
      },
    ];

  function rng(seed) {
    let value = seed >>> 0;
    return () => {
      value = (value * 1664525 + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }
  function shuffled(items, random) {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
  function chooseRandomScene(forceDifferent = false) {
    const stored = Number(
      globalThis.sessionStorage?.getItem("acidch-geo-v4-scene-seed"),
    );
    let seed =
      Number.isInteger(stored) && stored > 0
        ? stored
        : (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
    if (forceDifferent || !Number.isInteger(stored) || stored <= 0) {
      seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
      if (seed === stored) seed = (seed + 104729) >>> 0;
      globalThis.sessionStorage?.setItem("acidch-geo-v4-scene-seed", String(seed));
    }
    const random = rng(seed);
    const facilities = [];
    FACILITY_REGIONS.forEach((region) => {
      const [name, lat, lon] = shuffled(region.points, random)[0];
      facilities.push({ region: region.name, name, lat, lon });
    });
    const facilityPool = FACILITY_REGIONS.flatMap((region) =>
      region.points.map(([name, lat, lon]) => ({
        region: region.name,
        name,
        lat,
        lon,
      })),
    );
    for (const candidate of shuffled(facilityPool, random)) {
      if (facilities.length >= 10) break;
      if (!facilities.some((item) => item.name === candidate.name))
        facilities.push(candidate);
    }
    const regionalWarehouseNames = new Set(
      facilities.slice(0, FACILITY_REGIONS.length).map((item) => item.name),
    );
    const factoryNames = new Set(
      shuffled(
        facilities.filter((item) => !regionalWarehouseNames.has(item.name)),
        random,
      )
        .slice(0, 3)
        .map((item) => item.name),
    );
    const typedFacilities = shuffled(facilities, random).map((item) => ({
      ...item,
      type: factoryNames.has(item.name) ? "factory" : "warehouse",
    }));
    const demands = [];
    DEMAND_REGIONS.forEach((region) => {
      const [name, lat, lon] = shuffled(region.points, random)[0];
      demands.push({ region: region.name, name, lat, lon });
    });
    const demandPool = DEMAND_REGIONS.flatMap((region) =>
      region.points.map(([name, lat, lon]) => ({
        region: region.name,
        name,
        lat,
        lon,
      })),
    );
    for (const candidate of shuffled(demandPool, random)) {
      if (demands.length >= 12) break;
      if (!demands.some((item) => item.name === candidate.name))
        demands.push(candidate);
    }
    const H = typedFacilities.map((item) => item.name);
    const HQ = H.map((name) => `${name}, Auckland, New Zealand`);
    const HC = typedFacilities.map(({ lat, lon }) => ({ lat, lon }));
    const HT = typedFacilities.map((item) => item.type);
    const N = demands.map((item) => item.name);
    const NQ = N.map((name) => `${name}, Auckland, New Zealand`);
    const NC = demands.map(({ lat, lon }) => ({ lat, lon }));
    const DM = demands.map(() => Math.round((350 + random() * 400) / 50) * 50);
    const M = HC.map((a) =>
      NC.map((b) => {
        const lat = ((b.lat - a.lat) * Math.PI) / 180;
        const lon = ((b.lon - a.lon) * Math.PI) / 180;
        const halfChord =
          Math.sin(lat / 2) ** 2 +
          Math.cos((a.lat * Math.PI) / 180) *
            Math.cos((b.lat * Math.PI) / 180) *
            Math.sin(lon / 2) ** 2;
        return 2 * 6371 * Math.asin(Math.sqrt(Math.min(1, halfChord)));
      }),
    );
    return { H, HQ, HC, HT, N, NQ, NC, DM, M, seed };
  }

  let baseScene = chooseRandomScene(false);
  const H0 = baseScene.H,
    HQ0 = baseScene.HQ,
    N0 = baseScene.N,
    NQ0 = baseScene.NQ,
    DM0 = baseScene.DM,
    M0 = baseScene.M,
    HC0 = baseScene.HC,
    NC0 = baseScene.NC;
  const q = (id) => D.getElementById(id),
    map = L.map("geo4-map", {
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      touchZoom: true,
      boxZoom: true,
      keyboard: true,
      zoomSnap: 0.25,
      maxZoom: 20,
    }).setView([-36.873, 174.766], 12);
  const basemap = getBasemapConfig();
  L.tileLayer(basemap.url, basemap.options).addTo(map);
  attachMapAdapter(map, L);
  store.attachPresentation(map, L);
  const fl = L.layerGroup().addTo(map),
    dl = L.layerGroup().addTo(map),
    al = L.layerGroup().addTo(map),
    cl = L.layerGroup().addTo(map),
    rl = L.layerGroup().addTo(map);
  let H = [...H0],
    HQ = [...HQ0],
    HT = [...baseScene.HT],
    N = [...N0],
    NQ = [...NQ0],
    DM = [...DM0],
    M = M0.map((r) => [...r]),
    HC = HC0.map((point) => ({ ...point })),
    NC = NC0.map((point) => ({ ...point })),
    P = H0.map(() => "auto"),
    custom = [],
    maxOpen = Math.max(1, Math.min(5, H.length)),
    fleet = 20,
    newRoads = 4,
    solution = null,
    baselineSolution = null,
    activeGraph = null,
    graph = null,
    graphBounds = null,
    baselineGraph = null,
    fastMatrix = null,
    lastMC = null,
    mapAdd = false,
    graphLoadPromise = null;
  let initialRoutesLoaded = false;
  const slots = { A: null, B: null };
  function applyBaseScene(scene = baseScene) {
    H = [...scene.H];
    HQ = [...scene.HQ];
    HT = [...scene.HT];
    N = [...scene.N];
    NQ = [...scene.NQ];
    DM = [...scene.DM];
    M = scene.M.map((row) => [...row]);
    HC = scene.HC.map((point) => ({ ...point }));
    NC = scene.NC.map((point) => ({ ...point }));
    P = H.map(() => "auto");
    custom = [];
    fastMatrix = null;
    maxOpen = Math.max(1, Math.min(5, H.length));
  }
  services.subscribe((event) => {
    store.setServiceHealth(event.service, {
      state: event.state,
      message: event.error?.message || "",
      latencyMs: event.latencyMs ?? null,
    });
  });
  store.subscribe((state, reason) => {
    const presentationOnly =
      String(reason).startsWith("matrix:") ||
      String(reason).startsWith("service:") ||
      reason === "presentation";
    if (state.freshness.main !== "current" && !presentationOnly) {
      solution = null;
      activeGraph = null;
      root.dataset.routeGeometrySignature = "";
      root.dataset.routeScenarioMode = "";
      root.dataset.routeViewportAction = "";
      q("geo4-routes").disabled = true;
      rl.clearLayers();
      results();
      draw();
      q("geo4-status").textContent = T.stale;
    }
    const complete = {
      network: Boolean(state.graph),
      optimise: state.freshness.main === "current" && Boolean(state.mainSolution),
      fleet: state.freshness.fleet === "current" && Boolean(state.fleetSolution),
      risk: state.freshness.monteCarlo === "current" && Boolean(state.monteCarloResult),
      compare: Boolean(state.scenarioSlots.A?.result && state.scenarioSlots.B?.result),
    };
    const order = ["network", "optimise", "fleet", "risk", "compare"];
    const current = order.find((stage) => !complete[stage]) || "compare";
    D.querySelectorAll("[data-workflow-stage]").forEach((node) => {
      const stage = node.dataset.workflowStage;
      node.classList.toggle("is-complete", Boolean(complete[stage]));
      node.classList.toggle("is-current", stage === current);
    });
  });
  const cash = (v) =>
      Number.isFinite(v)
        ? `NZ$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
        : "—",
    pct = (v) => (Number.isFinite(v) ? `${(v * 100).toFixed(1)}%` : "—"),
    invIn = () => ({
      mean: +q("geo4-inv-mean").value,
      sd: +q("geo4-inv-sd").value,
      leadTime: +q("geo4-lead-time").value,
      z: +q("geo4-service").value,
    }),
    inv = () => inventoryPolicy(invIn()),
    pricing = () => ({
      costPerKm: Math.max(0, +q("geo4-transport-cost").value || 0),
      costPerMinute: Math.max(0, +q("geo4-time-cost")?.value || 0),
    }),
    entities = () => ({
      facilities: H.map((name, index) => ({
        id: `facility-${index}`,
        index,
        name,
        role: HT[index],
        policy: P[index],
        point: HC[index],
      })),
      demands: N.map((name, index) => ({
        id: `demand-${index}`,
        index,
        name,
        demand: DM[index],
        point: NC[index],
      })),
    }),
    publishEntities = () => store.setEntities(entities());
  const eventAt = (off = 0, eventId = q("geo4-event").value) =>
      createDisruptionEvent({
        eventId,
        seed: +q("geo4-seed").value + off,
        facilities: entities().facilities,
        demands: entities().demands,
      }),
    sc = (off = 0) => ({
      mode: q("geo4-road-mode").value,
      congestionSeverity: +q("geo4-congestion").value / 100,
      congestionShare: +q("geo4-congestion-share").value / 100,
      closureShare: +q("geo4-closure").value / 100,
      improvement: 0.25,
      improvementShare: 0.3,
      newRoadLinks: newRoads,
      maxNewRoadKm: 0.65,
      newRoadSpeedKph: 50,
      seed: +q("geo4-seed").value + off,
      ...eventAt(off).networkScenario,
    });
  function runs() {
    const osm = q("geo4-engine").value === "osm",
      vs = osm ? [5, 10, 15, 25] : [50, 100, 250, 500, 1000],
      d = osm ? 10 : 100;
    q("geo4-runs").innerHTML = vs
      .map(
        (v) =>
          `<option value="${v}" ${v === d ? "selected" : ""}>${v}${osm ? " edge-level" : ""}</option>`,
      )
      .join("");
  }
  function labels() {
    q("geo4-congestion-out").textContent = `${q("geo4-congestion").value}%`;
    q("geo4-congestion-share-out").textContent = `${q("geo4-congestion-share").value}%`;
    q("geo4-closure-out").textContent = `${q("geo4-closure").value}%`;
    q("geo4-new-roads-out").textContent = String(newRoads);
    q("geo4-max-open-out").textContent = String(maxOpen);
    q("geo4-fleet-out").textContent = String(fleet);
    q("geo4-demand-multiplier-out").textContent =
      `${(+q("geo4-demand-multiplier").value).toFixed(2)}×`;
    const x = q("geo4-threshold"),
      osm = q("geo4-engine").value === "osm";
    if (osm) {
      x.min = "5";
      x.max = "60";
      x.step = "1";
      if (+x.value < 5 || +x.value > 60) x.value = "30";
      q("geo4-threshold-out").textContent = `${(+x.value).toFixed(0)} min`;
    } else {
      x.min = "3";
      x.max = "15";
      x.step = "0.5";
      if (+x.value < 3 || +x.value > 15) x.value = "6";
      q("geo4-threshold-out").textContent = `${(+x.value).toFixed(1)} km`;
    }
    store.setScenarioInputs({
      maxOpen,
      fleet,
      newRoads,
      disruptionEvent: q("geo4-event").value,
      facilityCapacity: Math.max(0, +q("geo4-facility-capacity").value || 0),
      fixedCost: Math.max(0, +q("geo4-fixed-cost").value || 0),
      serviceThreshold: +x.value,
      demandMultiplier: +q("geo4-demand-multiplier").value,
      costPerKm: pricing().costPerKm,
      costPerMinute: pricing().costPerMinute,
    });
  }
  function setEngineThreshold(engine, value) {
    q("geo4-engine").value = engine;
    const threshold = q("geo4-threshold");
    if (engine === "osm") {
      threshold.min = "5";
      threshold.max = "60";
      threshold.step = "1";
    } else {
      threshold.min = "3";
      threshold.max = "15";
      threshold.step = "0.5";
    }
    threshold.value = String(value);
    labels();
  }
  function cache() {
    try {
      const c = JSON.parse(
        globalThis.localStorage?.getItem("acidch-geo-v4-base-coords") || "null",
      );
      if (c?.hubs?.length === H0.length && c?.demands?.length === N0.length) {
        HC = [...c.hubs];
        NC = [...c.demands];
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }
  async function geo(s) {
    return services.geocode(s, { locale: zh ? "zh,en;q=0.8" : "en" });
  }
  async function reverse(p) {
    try {
      return await services.reverseGeocode(p, {
        locale: zh ? "zh,en;q=0.8" : "en",
      });
    } catch {
      return `${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}`;
    }
  }
  async function coords() {
    if (HC.length >= H0.length && NC.length >= N0.length) return true;
    if (cache()) return true;
    q("geo4-graph-status").textContent = T.coords;
    const h = [],
      n = [];
    try {
      for (const s of HQ0) {
        h.push(await geo(s));
        await wait(1050);
      }
      for (const s of NQ0) {
        n.push(await geo(s));
        await wait(1050);
      }
      HC = h;
      NC = n;
      globalThis.localStorage?.setItem(
        "acidch-geo-v4-base-coords",
        JSON.stringify({ hubs: h, demands: n }),
      );
      return true;
    } catch (e) {
      globalThis.console?.warn("[Geo V4] coords", e);
      q("geo4-graph-status").textContent = T.coordsFail;
      return false;
    }
  }
  function fit() {
    const a = [...HC, ...NC].filter(Boolean);
    if (a.length)
      map.fitBounds(
        a.map((p) => [p.lat, p.lon]),
        { padding: [28, 28] },
      );
  }
  async function fitRoutesIfNeeded(routeVisuals) {
    const coordinates = routeVisuals
      .flatMap((route) => route.coordinates || [])
      .filter((point) => Number.isFinite(point?.lat) && Number.isFinite(point?.lon));
    if (coordinates.length < 2) return false;

    const container = map.getContainer();
    const mapRect = container.getBoundingClientRect();
    const mapSize = map.getSize();
    const minimumPadding = 24;
    const intersectsMap = (rect) =>
      rect.width > 0 &&
      rect.height > 0 &&
      rect.right > mapRect.left &&
      rect.left < mapRect.right &&
      rect.bottom > mapRect.top &&
      rect.top < mapRect.bottom;
    let rightPadding = minimumPadding;
    for (const overlay of root.querySelectorAll(".geo4__console,.geo4__results")) {
      const rect = overlay.getBoundingClientRect();
      if (intersectsMap(rect) && rect.left > mapRect.left + mapRect.width / 2) {
        rightPadding = Math.max(
          rightPadding,
          mapRect.right - rect.left + minimumPadding,
        );
      }
    }
    let bottomPadding = minimumPadding;
    const flowPanel = root.querySelector(".geo4__flow-panel");
    const flowRect = flowPanel?.getBoundingClientRect();
    if (
      flowRect &&
      intersectsMap(flowRect) &&
      flowRect.top > mapRect.top + mapRect.height / 2
    ) {
      bottomPadding = Math.max(
        bottomPadding,
        mapRect.bottom - flowRect.top + minimumPadding,
      );
    }
    rightPadding = Math.max(minimumPadding, Math.min(rightPadding, mapSize.x * 0.45));
    bottomPadding = Math.max(minimumPadding, Math.min(bottomPadding, mapSize.y * 0.45));

    const outsideSafeViewport =
      coordinates.some((point) => {
        const projected = map.latLngToContainerPoint([point.lat, point.lon]);
        return (
          projected.x < minimumPadding ||
          projected.x > mapSize.x - rightPadding ||
          projected.y < minimumPadding ||
          projected.y > mapSize.y - bottomPadding
        );
      }) ||
      rl.getLayers().some((layer) => {
        const rect = layer.getElement?.()?.getBoundingClientRect();
        if (!rect) return false;
        return (
          rect.left < mapRect.left + minimumPadding ||
          rect.right > mapRect.right - rightPadding ||
          rect.top < mapRect.top + minimumPadding ||
          rect.bottom > mapRect.bottom - bottomPadding
        );
      });
    root.dataset.routeViewportAction = outsideSafeViewport ? "fit" : "preserve";
    if (!outsideSafeViewport) return false;

    const bounds = L.latLngBounds(coordinates.map((point) => [point.lat, point.lon]));
    if (!bounds.isValid()) return false;
    map.fitBounds(bounds, {
      paddingTopLeft: [minimumPadding, minimumPadding],
      paddingBottomRight: [rightPadding, bottomPadding],
      maxZoom: map.getZoom(),
      animate: false,
    });
    await new Promise((resolve) => globalThis.requestAnimationFrame(resolve));

    const safeViewport = {
      left: mapRect.left + minimumPadding,
      right: mapRect.right - rightPadding,
      top: mapRect.top + minimumPadding,
      bottom: mapRect.bottom - bottomPadding,
    };
    const renderedExtent = () => {
      const rects = rl
        .getLayers()
        .map((layer) => layer.getElement?.()?.getBoundingClientRect())
        .filter(Boolean);
      if (!rects.length) return null;
      return {
        left: Math.min(...rects.map((rect) => rect.left)),
        right: Math.max(...rects.map((rect) => rect.right)),
        top: Math.min(...rects.map((rect) => rect.top)),
        bottom: Math.max(...rects.map((rect) => rect.bottom)),
      };
    };
    let rendered = renderedExtent();
    for (let attempt = 0; rendered && attempt < 4; attempt++) {
      const routeWidth = rendered.right - rendered.left;
      const routeHeight = rendered.bottom - rendered.top;
      const safeWidth = safeViewport.right - safeViewport.left;
      const safeHeight = safeViewport.bottom - safeViewport.top;
      if (routeWidth <= safeWidth && routeHeight <= safeHeight) break;
      const zoom = map.getZoom();
      if (zoom <= map.getMinZoom()) break;
      map.setZoom(zoom - 1, { animate: false });
      await new Promise((resolve) => globalThis.requestAnimationFrame(resolve));
      rendered = renderedExtent();
    }
    for (let attempt = 0; rendered && attempt < 3; attempt++) {
      const minimumPanX = rendered.right - safeViewport.right;
      const maximumPanX = rendered.left - safeViewport.left;
      const minimumPanY = rendered.bottom - safeViewport.bottom;
      const maximumPanY = rendered.top - safeViewport.top;
      const panX = minimumPanX > 0 ? minimumPanX : maximumPanX < 0 ? maximumPanX : 0;
      const panY = minimumPanY > 0 ? minimumPanY : maximumPanY < 0 ? maximumPanY : 0;
      if (!panX && !panY) break;
      map.panBy([-panX, -panY], { animate: false });
      await new Promise((resolve) => globalThis.requestAnimationFrame(resolve));
      rendered = renderedExtent();
    }
    return true;
  }
  async function table(src, dst) {
    return services.osrmTable(src, dst, pricing());
  }
  function entityCustomLabel(type, index) {
    return custom.some((item) => item.type === type && item.modelIndex === index)
      ? zh
        ? " · 自定义"
        : " · Custom"
      : "";
  }
  function policies() {
    q("geo4-facility-count").textContent = String(H.length + N.length);
    const facilities = H.map(
      (name, i) =>
        `<div class="geo4__policy-row" data-entity-kind="facility" data-entity-index="${i}"><div><strong>${name}</strong><small>${HT[i] === "factory" ? T.factory : T.warehouse}${entityCustomLabel(HT[i], i)}</small></div><div class="geo4__entity-actions"><select data-policy="${i}" aria-label="${name}"><option value="auto" ${P[i] === "auto" ? "selected" : ""}>${T.auto}</option><option value="must" ${P[i] === "must" ? "selected" : ""}>${T.must}</option><option value="exclude" ${P[i] === "exclude" ? "selected" : ""}>${T.exclude}</option></select><button type="button" class="geo4__entity-remove" data-remove-entity="facility:${i}">${T.remove}</button></div></div>`,
    ).join("");
    const demands = N.map(
      (name, i) =>
        `<div class="geo4__policy-row" data-entity-kind="demand" data-entity-index="${i}"><div><strong>${name}</strong><small>${T.demand}${entityCustomLabel("demand", i)}</small></div><div class="geo4__entity-actions"><input data-demand-edit="${i}" type="number" min="0" step="50" value="${DM[i]}" aria-label="${name} demand"><button type="button" class="geo4__entity-remove" data-remove-entity="demand:${i}">${T.remove}</button></div></div>`,
    ).join("");
    q("geo4-policy-list").innerHTML = facilities + demands;
    D.querySelectorAll("[data-policy]").forEach((s) =>
      s.addEventListener("change", () => {
        P[+s.dataset.policy] = s.value;
        publishEntities();
      }),
    );
    D.querySelectorAll("[data-demand-edit]").forEach((input) =>
      input.addEventListener("change", () => {
        DM[+input.dataset.demandEdit] = Math.max(0, +input.value || 0);
        input.value = String(DM[+input.dataset.demandEdit]);
        publishEntities();
        store.updateInputs("demand-edit");
      }),
    );
    D.querySelectorAll("[data-remove-entity]").forEach((button) =>
      button.addEventListener("click", async () => {
        const [kind, rawIndex] = button.dataset.removeEntity.split(":");
        await removeEntity(kind, +rawIndex);
      }),
    );
  }
  function customs() {
    q("geo4-custom-count").textContent = custom.length;
    q("geo4-custom-list").innerHTML = custom.length
      ? custom
          .map(
            (x) =>
              `<div class="geo4__custom-row"><div><strong>${x.name}</strong><small>${x.type} · ${x.lat.toFixed(5)}, ${x.lon.toFixed(5)}</small></div><button data-remove-custom="${x.id}">${T.remove}</button></div>`,
          )
          .join("")
      : "<p>—</p>";
    D.querySelectorAll("[data-remove-custom]").forEach((b) =>
      b.addEventListener("click", () => remove(b.dataset.removeCustom)),
    );
  }
  function makeExplainable(marker, detail, label) {
    const activate = () =>
      root.dispatchEvent(new globalThis.CustomEvent("geo4:explain", { detail }));
    const wireElement = () => {
      const element = marker.getElement?.();
      if (!element || element.dataset.explainable === "true") return;
      element.dataset.explainable = "true";
      element.setAttribute("role", "button");
      element.setAttribute("tabindex", "0");
      element.setAttribute("aria-label", label);
      element.addEventListener("click", activate);
      element.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        activate();
      });
    };
    wireElement();
    marker.on("add", wireElement);
    return marker;
  }
  function draw() {
    fl.clearLayers();
    dl.clearLayers();
    al.clearLayers();
    cl.clearLayers();
    const layer = q("geo4-layer").value,
      ip = inv(),
      stab = new Map(
        (lastMC?.facilityStability || []).map((x) => [x.index, x.probability]),
      ),
      util = new Map(),
      required = +q("geo4-redundancy").value;
    solution?.selected?.forEach((h, i) => util.set(h, solution.utilisation[i]));
    HC.forEach((p, i) => {
      if (!p) return;
      const on = solution?.selected?.includes(i),
        base = HT[i] === "factory" ? "#ffcc66" : "#62ecff",
        col = on ? "#d8ff6b" : base;
      let rad = on ? 9 : 6,
        detail = HT[i];
      if (layer === "utilisation" && on) {
        rad = 6 + 10 * (util.get(i) || 0);
        detail += `<br>Utilisation: ${pct(util.get(i))}`;
      }
      if (layer === "inventory" && on)
        detail += `<br>SS ${ip.safetyStock.toFixed(0)} · ROP ${ip.reorderPoint.toFixed(0)}`;
      if (layer === "risk") {
        rad = 5 + 12 * (stab.get(i) || 0);
        detail += `<br>Selection: ${pct(stab.get(i) || 0)}`;
      }
      const marker = L.circleMarker([p.lat, p.lon], {
        radius: rad,
        weight: on ? 3 : 1.4,
        color: col,
        fillColor: col,
        fillOpacity: on ? 0.92 : 0.5,
        className: `geo4-facility-node${on ? " is-open" : ""}`,
      });
      marker.bindTooltip(`<strong>${H[i]}</strong><br>${detail}`).addTo(fl);
      makeExplainable(
        marker,
        { type: HT[i], index: i },
        `${H[i]} · ${detail.replaceAll("<br>", " · ")}`,
      );
      if (layer === "coverage" && on) {
        L.circleMarker([p.lat, p.lon], {
          radius: 16,
          color: "#d8ff6b",
          weight: 2,
          fill: false,
          opacity: 0.7,
          className: "geo4-coverage-pulse",
        }).addTo(cl);
        L.circleMarker([p.lat, p.lon], {
          radius: 24,
          color: "#62ecff",
          weight: 1.5,
          fill: false,
          opacity: 0.55,
          className: "geo4-coverage-pulse is-delay",
        }).addTo(cl);
      }
    });
    NC.forEach((p, i) => {
      if (!p) return;
      const count = solution?.coverCounts?.[i] || 0,
        covered = count >= required,
        state = !covered
          ? "is-uncovered"
          : count >= 2
            ? "is-covered is-redundant"
            : "is-covered",
        status = !covered ? T.uncovered : count >= 2 ? T.redundant : T.covered;
      const marker = L.circleMarker([p.lat, p.lon], {
        radius: Math.max(4, Math.min(10, 4 + (DM[i] || 0) / 900)),
        color: covered ? (count >= 2 ? "#d8ff6b" : "#62ecff") : "#ff759a",
        weight: covered ? 1.6 : 2,
        fillColor: covered ? (count >= 2 ? "#d8ff6b" : "#62ecff") : "#ff3d78",
        fillOpacity: 0.62,
        className: `geo4-demand-node ${state}`,
      });
      marker
        .bindTooltip(
          `<strong>${N[i]}</strong><br>Demand: ${(DM[i] || 0).toLocaleString()}<br>${status}`,
        )
        .addTo(dl);
      makeExplainable(
        marker,
        { type: "demand", index: i },
        `${N[i]} · ${(DM[i] || 0).toLocaleString()} · ${status}`,
      );
    });
    if (solution?.factoryAssignments) {
      solution.factoryAssignments.forEach((flow) => {
        const from = HC[flow.factory];
        const to = HC[flow.warehouse];
        if (!from || !to) return;
        L.polyline(
          [
            [from.lat, from.lon],
            [to.lat, to.lon],
          ],
          {
            color: "#ffcc66",
            weight: 1.5 + Math.min(4, Math.sqrt(flow.flow) / 22),
            opacity: 0.64,
            dashArray: "7 5",
            className: "geo4-factory-warehouse-flow",
          },
        )
          .bindTooltip(
            `${H[flow.factory]} → ${H[flow.warehouse]}<br>Factory → Warehouse · ${flow.flow.toFixed(0)}`,
          )
          .addTo(al);
      });
    }
    if (solution?.assignments) {
      const mf = Math.max(1, ...solution.assignments.map((x) => x.flow));
      solution.assignments.forEach((x) => {
        const a = HC[x.hub],
          b = NC[x.demand];
        if (!a || !b) return;
        L.polyline(
          [
            [a.lat, a.lon],
            [b.lat, b.lon],
          ],
          {
            color: layer === "cost" ? "#ffcc66" : "#62ecff",
            weight: layer === "flow" ? 1.2 + (x.flow / mf) * 6 : 1.5,
            opacity: layer === "network" ? 0.42 : 0.7,
            dashArray: layer === "network" ? "4 8" : undefined,
          },
        )
          .bindTooltip(
            layer === "cost"
              ? `${H[x.hub]} → ${N[x.demand]}<br>${cash(x.flow * x.networkCost * +q("geo4-transport-cost").value)}`
              : `${H[x.hub]} → ${N[x.demand]}<br>Flow: ${x.flow.toFixed(0)}`,
          )
          .addTo(al);
      });
    }
  }
  function results() {
    root.dataset.routeAssignmentCount = String(solution?.assignments?.length || 0);
    const ip = inv(),
      td = DM.reduce((a, b) => a + b, 0) * +q("geo4-demand-multiplier").value,
      fc = fleet * +q("geo4-vehicle-capacity").value * +q("geo4-trips").value,
      osm = q("geo4-engine").value === "osm",
      networkLabel = zh
        ? osm
          ? "平均行程时间"
          : "平均配送距离"
        : osm
          ? "Average travel time"
          : "Average delivery distance";
    q("geo4-kpi-network-label").textContent = networkLabel;
    q("geo4-mc-network-label").textContent = networkLabel;
    q("geo4-kpi-fleet").textContent =
      `${Math.min(999, (fc / Math.max(1, td)) * 100).toFixed(0)}%`;
    q("geo4-kpi-ss").textContent = ip.safetyStock.toFixed(0);
    q("geo4-kpi-rop").textContent = ip.reorderPoint.toFixed(0);
    const delta = q("geo4-kpi-delta");
    delta.className = "";
    if (!solution) {
      q("geo4-kpi-hubs").textContent = "—";
      q("geo4-kpi-coverage").textContent = "0%";
      q("geo4-kpi-network").textContent = "—";
      q("geo4-kpi-transport").textContent = "—";
      q("geo4-kpi-cost").textContent = "—";
      q("geo4-solver-mode").textContent = "—";
      q("geo4-cost-fixed").textContent = "—";
      q("geo4-cost-variable").textContent = "—";
      q("geo4-cost-inventory").textContent = "—";
      delta.textContent = `${T.vsBaseline} —`;
      q("geo4-open-list").innerHTML = "";
      q("geo4-status").textContent = T.none;
      return;
    }
    q("geo4-kpi-hubs").textContent = solution.selected.length;
    q("geo4-kpi-coverage").textContent = "100%";
    q("geo4-kpi-network").textContent =
      `${solution.averageNetworkCost.toFixed(2)} ${osm ? "min" : "km"}`;
    q("geo4-kpi-transport").textContent = cash(solution.transportCost);
    q("geo4-kpi-cost").textContent = cash(solution.score);
    q("geo4-solver-mode").textContent =
      `${solution.solverMode === "exact" ? "EXACT" : "HEURISTIC"} · 2-ECH`;
    const fixedComponent =
        solution.selected.length * Math.max(0, +q("geo4-fixed-cost").value || 0),
      inventoryComponent =
        solution.selected.length * ip.safetyStock * +q("geo4-holding-cost").value,
      variableComponent = solution.transportCost,
      componentTotal = Math.max(
        1e-9,
        fixedComponent + inventoryComponent + variableComponent,
      );
    q("geo4-cost-fixed").textContent = cash(fixedComponent);
    q("geo4-cost-variable").textContent = cash(variableComponent);
    q("geo4-cost-inventory").textContent = cash(inventoryComponent);
    [
      ["geo4-cost-fixed", fixedComponent],
      ["geo4-cost-variable", variableComponent],
      ["geo4-cost-inventory", inventoryComponent],
    ].forEach(([id, value]) =>
      q(id)
        .closest("div")
        .style.setProperty("--share", value / componentTotal),
    );
    if (q("geo4-road-mode").value === "baseline") {
      delta.textContent = T.baseline;
    } else if (baselineSolution && Number.isFinite(baselineSolution.score)) {
      const change = solution.score - baselineSolution.score,
        rate = baselineSolution.score ? change / baselineSolution.score : 0,
        sign = change > 0 ? "+" : "−";
      delta.textContent = `${T.vsBaseline} ${sign}${cash(Math.abs(change))} (${change > 0 ? "+" : ""}${(rate * 100).toFixed(1)}%)`;
      delta.className = change <= 0 ? "is-saving" : "is-increase";
    } else delta.textContent = `${T.vsBaseline} —`;
    q("geo4-open-list").innerHTML = solution.selected
      .map(
        (i, j) =>
          `<div><span>${String(i + 1).padStart(2, "0")}</span><div><strong>${H[i]}</strong><small>Utilisation ${pct(solution.utilisation[j])}</small></div></div>`,
      )
      .join("");
    q("geo4-status").textContent = T.solved;
  }
  function matrixRows(matrix, rows, provenanceSuffix) {
    return createNetworkMatrix({
      distanceKm: rows.map((index) => matrix.distanceKm[index]),
      durationMin: rows.map((index) => matrix.durationMin[index]),
      costPerKm: matrix.pricing.costPerKm,
      costPerMinute: matrix.pricing.costPerMinute,
      ...matrix.provenance,
      method: `${matrix.provenance.method}:${provenanceSuffix}`,
    });
  }
  async function active(off = 0, modeOverride = null) {
    const scenarioParams = {
      ...sc(off),
      ...(modeOverride ? { mode: modeOverride } : {}),
    };
    if (q("geo4-engine").value === "osm") {
      if (!graph) throw Error("no graph");
      const result = graphNetworkMatrix({
        graph,
        sources: HC,
        destinations: NC,
        scenarioParams,
        ...pricing(),
      });
      if (!modeOverride) activeGraph = result;
      store.setNetworkMatrix(
        modeOverride ? "baseline" : "active",
        result.networkMatrix,
      );
      return result.networkMatrix;
    }
    activeGraph = null;
    const dimensionsMatch =
      fastMatrix?.dimensions?.rows === H.length &&
      fastMatrix?.dimensions?.columns === N.length;
    fastMatrix = dimensionsMatch
      ? repriceNetworkMatrix(fastMatrix, pricing())
      : networkMatrixFromDistance(M, {
          assumedSpeedKph: 35,
          ...pricing(),
          source: custom.length ? "osrm-full-rebuild" : "fast-od-baseline",
          method: custom.length
            ? "single-osrm-road-distance-rebuild"
            : "single-road-distance-baseline",
          version: custom.length
            ? `custom-${store.getState().scenarioRevision}`
            : "fast-od-v1",
        });
    const matrix = applyNetworkScenario(fastMatrix, scenarioParams);
    store.setNetworkMatrix(modeOverride ? "baseline" : "active", matrix);
    return matrix;
  }
  async function solveIntegrated(
    networkMatrix,
    scenarioParams,
    publishRouteContext = false,
    disruptionEvent = eventAt(),
  ) {
    const mult = Math.max(0, +q("geo4-demand-multiplier").value || 0);
    const scaledDemands = DM.map(
      (demand, index) =>
        demand * mult * (disruptionEvent.demandMultipliers[index] ?? 1),
    );
    const totalFleetCapacity =
      fleet * +q("geo4-vehicle-capacity").value * +q("geo4-trips").value;
    if (
      q("geo4-enforce-fleet").checked &&
      totalFleetCapacity + 1e-9 < scaledDemands.reduce((sum, value) => sum + value, 0)
    )
      return null;
    const factoryIndices = H.map((_, index) => index).filter(
      (index) => HT[index] === "factory" && P[index] !== "exclude",
    );
    const warehouseIndices = H.map((_, index) => index).filter(
      (index) => HT[index] === "warehouse",
    );
    if (!factoryIndices.length || !warehouseIndices.length) return null;
    const routingGraph = q("geo4-engine").value === "osm" ? graph : baselineGraph;
    if (!routingGraph) return null;
    const factoryWarehouseResult = graphNetworkMatrix({
      graph: routingGraph,
      sources: factoryIndices.map((index) => HC[index]),
      destinations: warehouseIndices.map((index) => HC[index]),
      scenarioParams,
      ...pricing(),
    });
    const factoryWarehouse = factoryWarehouseResult.networkMatrix;
    if (publishRouteContext) {
      store.setNetworkMatrix("twoEchelonRouteContext", {
        ...factoryWarehouseResult,
        graph: routingGraph,
      });
    }
    const warehouseDemand = matrixRows(
      networkMatrix,
      warehouseIndices,
      "warehouse-demand",
    );
    const capacity = Math.max(0, +q("geo4-facility-capacity").value || 0);
    const ip = inv();
    const result = solveTwoEchelonNetwork({
      factoryWarehouseMatrix: factoryWarehouse,
      warehouseDemandMatrix: warehouseDemand,
      demands: scaledDemands,
      factoryCapacities: factoryIndices.map(
        (index) => capacity * (disruptionEvent.facilityCapacityMultipliers[index] ?? 1),
      ),
      warehouseCapacities: warehouseIndices.map(
        (index) => capacity * (disruptionEvent.facilityCapacityMultipliers[index] ?? 1),
      ),
      warehousePolicies: warehouseIndices.map((index) => P[index]),
      maxOpen,
      fixedCost:
        +q("geo4-fixed-cost").value + ip.safetyStock * +q("geo4-holding-cost").value,
      serviceThreshold: +q("geo4-threshold").value,
      serviceMetric: q("geo4-engine").value === "osm" ? "durationMin" : "distanceKm",
      redundancy: +q("geo4-redundancy").value,
    });
    if (!result) return null;
    const selected = result.selectedWarehouses.map((index) => warehouseIndices[index]);
    const throughputByWarehouse = new Map(
      result.throughput.map((item) => [warehouseIndices[item.warehouse], item]),
    );
    const assignments = result.warehouseDemandFlows.map((flow) => {
      const hub = warehouseIndices[flow.warehouse];
      return {
        hub,
        demand: flow.demand,
        flow: flow.flow,
        networkCost: networkMatrix.generalizedCostNZD[hub][flow.demand],
        distanceKm: networkMatrix.distanceKm[hub][flow.demand],
        durationMin: networkMatrix.durationMin[hub][flow.demand],
      };
    });
    const totalDemand = scaledDemands.reduce((sum, value) => sum + value, 0);
    const weighted = (field) =>
      assignments.reduce((sum, item) => sum + item.flow * item[field], 0) /
      Math.max(1e-9, totalDemand);
    return {
      ...result,
      selected,
      assignments,
      utilisation: selected.map(
        (index) => throughputByWarehouse.get(index)?.utilisation || 0,
      ),
      averageDistanceKm: weighted("distanceKm"),
      averageDurationMin: weighted("durationMin"),
      averageNetworkCost:
        q("geo4-engine").value === "osm"
          ? weighted("durationMin")
          : weighted("distanceKm"),
      factoryAssignments: result.factoryWarehouseFlows.map((flow) => ({
        ...flow,
        factory: factoryIndices[flow.factory],
        warehouse: warehouseIndices[flow.warehouse],
      })),
      model: "two-echelon",
      disruptionEvent: disruptionEvent.id,
      disruptionAffected: disruptionEvent.affected,
    };
  }
  async function baseline() {
    const matrix = await active(0, "baseline");
    return solveIntegrated(
      matrix,
      { ...sc(), mode: "baseline" },
      false,
      eventAt(0, "none"),
    );
  }
  async function solve() {
    root.dataset.routeGeometrySignature = "";
    root.dataset.routeScenarioMode = "";
    root.dataset.routeViewportAction = "";
    store.setRouteVisuals([]);
    q("geo4-status").textContent = T.solve;
    rl.clearLayers();
    const token = store.begin("main");
    try {
      if (q("geo4-engine").value === "osm" && graph) {
        const scenarioParams = sc();
        const ip = inv();
        const execution = await analysisWorker.run(
          "mainOptimisation",
          {
            useGraph: true,
            graph,
            entities: entities(),
            pricing: pricing(),
            baseDemands: [...DM],
            demandMultiplier: +q("geo4-demand-multiplier").value,
            facilityCapacity: +q("geo4-facility-capacity").value,
            maxOpen,
            fixedCost:
              +q("geo4-fixed-cost").value +
              ip.safetyStock * +q("geo4-holding-cost").value,
            serviceThreshold: +q("geo4-threshold").value,
            serviceMetric: "durationMin",
            redundancy: +q("geo4-redundancy").value,
            scenarioParams,
            baselineScenarioParams: { ...scenarioParams, mode: "baseline" },
            eventId: q("geo4-event").value,
            seed: +q("geo4-seed").value,
            enforceFleetCapacity: q("geo4-enforce-fleet").checked,
            totalFleetCapacity:
              fleet * +q("geo4-vehicle-capacity").value * +q("geo4-trips").value,
          },
          {
            revisionId: token.scenarioRevision,
            isCurrent: () =>
              store.getState().scenarioRevision === token.scenarioRevision,
          },
        );
        root.dataset.mainAnalysisExecution = execution.execution;
        solution = execution.result.solution;
        baselineSolution = execution.result.baselineSolution;
        activeGraph = execution.result.activeGraph;
        store.setNetworkMatrix("active", execution.result.networkMatrices.active);
        store.setNetworkMatrix("baseline", execution.result.networkMatrices.baseline);
        store.setNetworkMatrix("twoEchelonRouteContext", {
          ...execution.result.networkMatrices.twoEchelonRouteContext,
          graph,
        });
      } else {
        const event = eventAt();
        const matrix = await active();
        solution = await solveIntegrated(matrix, sc(), true, event);
        baselineSolution = await baseline();
      }
    } catch (e) {
      if (e instanceof StaleWorkerResultError) return;
      globalThis.console?.warn("[Geo V4] solve", e);
      solution = null;
      baselineSolution = null;
    }
    if (!store.setMainSolution(solution, token)) {
      solution = null;
      baselineSolution = null;
    }
    results();
    draw();
    q("geo4-routes").disabled = !solution;
  }

  async function waitForRoutePresentation() {
    for (let attempt = 0; attempt < 12; attempt++) {
      if (root.querySelector(".geo4__flow-panel")) break;
      await wait(50);
    }
    await new Promise((resolve) => globalThis.requestAnimationFrame(resolve));
  }

  async function solveInitialScenario(maxAttempts = 5) {
    root.dataset.initialSolveRetry = "true";
    try {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        root.dataset.initialSolveAttempts = String(attempt);
        await solve();
        if (solution || attempt === maxAttempts) return solution;
        q("geo4-status").textContent = T.solve;
        baseScene = chooseRandomScene(true);
        applyBaseScene(baseScene);
        policies();
        customs();
        publishEntities();
        labels();
        draw();
        fit();
      }
      return null;
    } finally {
      root.dataset.initialSolveRetry = "false";
    }
  }

  function routeGeometrySignature(routeVisuals) {
    let hash = 2166136261;
    const input = routeVisuals
      .map((route) =>
        (route.coordinates || [])
          .map(
            (point) =>
              `${Number(point.lat).toFixed(5)},${Number(point.lon).toFixed(5)}`,
          )
          .join(";"),
      )
      .join("|");
    for (let index = 0; index < input.length; index++) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }
  function robust(r) {
    lastMC = r;
    q("geo4-robust").hidden = false;
    q("geo4-mc-runs").textContent = r.runs;
    q("geo4-mc-expected").textContent = cash(r.expectedCost);
    q("geo4-mc-p95").textContent = cash(r.p95Cost);
    q("geo4-mc-cvar").textContent = cash(r.cvar95Cost);
    q("geo4-mc-failure").textContent = pct(r.failureRate);
    q("geo4-mc-unmet").textContent = Number.isFinite(r.expectedUnmetDemand)
      ? r.expectedUnmetDemand.toLocaleString(undefined, { maximumFractionDigits: 0 })
      : "—";
    const osm = q("geo4-engine").value === "osm";
    q("geo4-mc-network-label").textContent = zh
      ? osm
        ? "平均行程时间"
        : "平均配送距离"
      : osm
        ? "Average travel time"
        : "Average delivery distance";
    q("geo4-mc-network").textContent = Number.isFinite(r.averageNetworkCost)
      ? `${r.averageNetworkCost.toFixed(2)} ${osm ? "min" : "km"}`
      : "—";
    q("geo4-mc-stockout").textContent = pct(r.stockoutProbability);
    q("geo4-stability").innerHTML = r.facilityStability
      .slice(0, 8)
      .map(
        (x) =>
          `<div><span>${x.name}</span><strong>${pct(x.probability)}</strong><i style="--p:${Math.min(1, x.probability)}"></i></div>`,
      )
      .join("");
    const maximumBin = Math.max(1, ...(r.costHistogram || []).map((bin) => bin.count));
    q("geo4-cost-histogram").innerHTML = (r.costHistogram || [])
      .map(
        (bin) =>
          `<i class="${bin.min >= r.p95Cost ? "is-tail" : ""}" style="--height:${bin.count / maximumBin}" title="${cash(bin.min)}–${cash(bin.max)} · ${bin.count}"></i>`,
      )
      .join("");
    draw();
  }
  function analysisPayload(runs) {
    const snapshot = store.getState();
    const routeContext = snapshot.networkMatrices.twoEchelonRouteContext;
    const activeMatrix = snapshot.networkMatrices.active;
    if (!activeMatrix || !routeContext?.networkMatrix || !solution) {
      throw new Error("Current two-echelon matrices are unavailable");
    }
    const ip = inv();
    return {
      useGraph: q("geo4-engine").value === "osm",
      graph: q("geo4-engine").value === "osm" ? graph : null,
      entities: snapshot.entities,
      baseNetworkMatrix: activeMatrix,
      baseFactoryWarehouseMatrix: routeContext.networkMatrix,
      pricing: pricing(),
      baseDemands: [...DM],
      demandMultiplier: +q("geo4-demand-multiplier").value,
      facilityCapacity: +q("geo4-facility-capacity").value,
      maxOpen,
      fixedCost:
        +q("geo4-fixed-cost").value + ip.safetyStock * +q("geo4-holding-cost").value,
      serviceThreshold: +q("geo4-threshold").value,
      serviceMetric: q("geo4-engine").value === "osm" ? "durationMin" : "distanceKm",
      redundancy: +q("geo4-redundancy").value,
      scenarioParams: sc(),
      eventId: q("geo4-event").value,
      runs,
      seed: +q("geo4-seed").value,
      inventory: invIn(),
    };
  }
  async function simulate() {
    q("geo4-status").textContent = T.sim;
    q("geo4-simulate").disabled = true;
    const token = store.begin("monte-carlo");
    try {
      const n = +q("geo4-runs").value;
      const execution = await analysisWorker.run("monteCarlo", analysisPayload(n), {
        revisionId: token.scenarioRevision,
        isCurrent: () => store.getState().scenarioRevision === token.scenarioRevision,
      });
      const r = { ...execution.result, execution: execution.execution };
      if (store.commit(token, "monteCarloResult", r, "monteCarlo")) {
        robust(r);
        q("geo4-status").textContent =
          `${T.simOk} ${execution.execution === "worker" ? "WORKER" : "FALLBACK"}`;
      }
    } catch (e) {
      globalThis.console?.warn("[Geo V4] MC", e);
      q("geo4-status").textContent = T.none;
    } finally {
      q("geo4-simulate").disabled = false;
    }
  }
  async function addMatrix(p, type) {
    if (!(await coords())) throw Error("coords");
    const nextFacilities = type === "demand" ? HC : [...HC, p];
    const nextDemands = type === "demand" ? [...NC, p] : NC;
    const rebuilt = await table(nextFacilities, nextDemands);
    HC = nextFacilities;
    NC = nextDemands;
    M = rebuilt.distanceKm.map((row) => [...row]);
    fastMatrix = rebuilt;
  }
  async function add(p, name, type, dq) {
    const wantedOsm = q("geo4-engine").value === "osm";
    await addMatrix(p, type);
    const id = `c-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    let mi;
    if (type === "demand") {
      mi = N.length;
      N.push(name);
      NQ.push(name);
      DM.push(Math.max(0, +dq || 0));
    } else {
      mi = H.length;
      H.push(name);
      HQ.push(name);
      HT.push(type);
      P.push("auto");
    }
    custom.push({ id, name, type, lat: p.lat, lon: p.lon, modelIndex: mi });
    activeGraph = null;
    q("geo4-event").value = "none";
    runs();
    labels();
    customs();
    policies();
    publishEntities();
    fit();
    if (wantedOsm && graph && insideGraphBounds(p)) {
      q("geo4-engine").value = "osm";
      await solve();
      return;
    }
    if (wantedOsm) {
      graph = null;
      graphBounds = null;
      q("geo4-graph-status").textContent = T.graphReload;
      await loadGraph(true);
      return;
    }
    q("geo4-engine").value = "od";
    q("geo4-graph-status").textContent = T.ready;
    await solve();
  }
  async function removeEntity(kind, index) {
    const removingRole = kind === "facility" ? HT[index] : null;
    const remainingRoleCount = removingRole
      ? HT.filter((role, roleIndex) => role === removingRole && roleIndex !== index)
          .length
      : 1;
    if (
      (kind === "facility" && (H.length <= 2 || remainingRoleCount < 1)) ||
      (kind === "demand" && N.length <= 1)
    ) {
      q("geo4-status").textContent = T.keepOne;
      return;
    }
    if (kind === "demand") {
      N.splice(index, 1);
      NQ.splice(index, 1);
      DM.splice(index, 1);
      NC.splice(index, 1);
      M.forEach((row) => row.splice(index, 1));
      custom = custom.filter(
        (item) => !(item.type === "demand" && item.modelIndex === index),
      );
      custom.forEach((item) => {
        if (item.type === "demand" && item.modelIndex > index) item.modelIndex--;
      });
    } else {
      H.splice(index, 1);
      HQ.splice(index, 1);
      HT.splice(index, 1);
      HC.splice(index, 1);
      P.splice(index, 1);
      M.splice(index, 1);
      custom = custom.filter(
        (item) => !(item.type !== "demand" && item.modelIndex === index),
      );
      custom.forEach((item) => {
        if (item.type !== "demand" && item.modelIndex > index) item.modelIndex--;
      });
      maxOpen = Math.max(1, Math.min(maxOpen, H.length));
    }
    fastMatrix = null;
    activeGraph = null;
    policies();
    customs();
    labels();
    publishEntities();
    store.updateInputs(`remove:${kind}`);
    await solve();
    fit();
  }
  async function remove(id) {
    const x = custom.find((v) => v.id === id);
    if (!x) return;
    const i = x.modelIndex;
    if (fastMatrix) {
      const distanceKm = fastMatrix.distanceKm.map((row) => [...row]);
      const durationMin = fastMatrix.durationMin.map((row) => [...row]);
      if (x.type === "demand") {
        distanceKm.forEach((row) => row.splice(i, 1));
        durationMin.forEach((row) => row.splice(i, 1));
      } else {
        distanceKm.splice(i, 1);
        durationMin.splice(i, 1);
      }
      fastMatrix = createNetworkMatrix({
        distanceKm,
        durationMin,
        ...pricing(),
        ...fastMatrix.provenance,
        version: `custom-${store.getState().scenarioRevision + 1}`,
      });
    }
    if (x.type === "demand") {
      N.splice(i, 1);
      NQ.splice(i, 1);
      DM.splice(i, 1);
      NC.splice(i, 1);
      M.forEach((r) => r.splice(i, 1));
      custom.forEach((v) => {
        if (v.type === "demand" && v.modelIndex > i) v.modelIndex--;
      });
    } else {
      H.splice(i, 1);
      HQ.splice(i, 1);
      HT.splice(i, 1);
      HC.splice(i, 1);
      P.splice(i, 1);
      M.splice(i, 1);
      custom.forEach((v) => {
        if (v.type !== "demand" && v.modelIndex > i) v.modelIndex--;
      });
      maxOpen = Math.max(1, Math.min(maxOpen, H.length));
    }
    custom = custom.filter((v) => v.id !== id);
    activeGraph = null;
    q("geo4-engine").value = "od";
    runs();
    labels();
    customs();
    policies();
    publishEntities();
    await solve();
  }
  function insideGraphBounds(point) {
    return (
      graphBounds &&
      point.lat >= graphBounds[0] &&
      point.lon >= graphBounds[1] &&
      point.lat <= graphBounds[2] &&
      point.lon <= graphBounds[3]
    );
  }
  function graphRequestBounds() {
    const points = [...HC, ...NC];
    const latitudes = points.map((point) => point.lat);
    const longitudes = points.map((point) => point.lon);
    const padding = 0.006;
    return [
      Math.min(...latitudes) - padding,
      Math.min(...longitudes) - padding,
      Math.max(...latitudes) + padding,
      Math.max(...longitudes) + padding,
    ];
  }
  function graphCacheKey(bounds) {
    return `acidch-osm-compact-v2:${bounds.map((value) => value.toFixed(3)).join(":")}`;
  }
  function graphRetryKey(bounds) {
    return `acidch-osm-retry-v1:${bounds.map((value) => value.toFixed(3)).join(":")}`;
  }
  function readGraphCache(bounds) {
    try {
      const raw = globalThis.sessionStorage?.getItem(graphCacheKey(bounds));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.elements?.length ? parsed : null;
    } catch {
      return null;
    }
  }
  function writeGraphCache(bounds, data) {
    try {
      if ((data?.elements?.length || 0) > MAX_SESSION_GRAPH_ELEMENTS) return;
      const raw = JSON.stringify(data);
      if (raw.length <= 4_200_000)
        globalThis.sessionStorage?.setItem(graphCacheKey(bounds), raw);
    } catch {
      // Session caching is an optional performance optimisation.
    }
  }
  function readGraphRetryAfter(bounds) {
    try {
      return Number(globalThis.sessionStorage?.getItem(graphRetryKey(bounds)) || 0);
    } catch {
      return 0;
    }
  }
  function deferGraphRetry(bounds) {
    try {
      globalThis.sessionStorage?.setItem(
        graphRetryKey(bounds),
        String(Date.now() + GRAPH_RETRY_COOLDOWN_MS),
      );
    } catch {
      // Retry throttling is best effort only.
    }
  }
  function clearGraphRetry(bounds) {
    try {
      globalThis.sessionStorage?.removeItem(graphRetryKey(bounds));
    } catch {
      // Retry throttling is best effort only.
    }
  }
  async function loadGraph(solveAfter = true, { force = false } = {}) {
    const bounds = graphRequestBounds();
    if (graphLoadPromise) {
      const refreshed = await graphLoadPromise;
      if (solveAfter) await solveAndShowRoutes();
      return refreshed;
    }
    let data = readGraphCache(bounds);
    if (!data && !force && readGraphRetryAfter(bounds) > Date.now()) {
      graph = baselineGraph;
      graphBounds = baselineGraph?.metadata?.bbox || null;
      activeGraph = null;
      q("geo4-engine").value = graph ? "osm" : "od";
      q("geo4-graph-status").textContent = T.graphFail;
      runs();
      labels();
      if (solveAfter) await solveAndShowRoutes();
      return false;
    }
    q("geo4-graph-status").textContent = T.graph;
    q("geo4-load-graph").disabled = true;
    graphLoadPromise = (async () => {
      let requestedLiveGraph = false;
      try {
        if (data) {
          q("geo4-graph-status").textContent = T.graphCached;
          const parsed = await analysisWorker.run(
            "parseGraph",
            { elements: data.elements },
            { revisionId: 0, isCurrent: () => true },
          );
          graph = parsed.result;
          root.dataset.graphParseExecution = parsed.execution;
        } else {
          requestedLiveGraph = true;
          const query = `[out:json][timeout:12];way["highway"~"motorway|motorway_link|trunk|trunk_link|primary|primary_link|secondary|secondary_link|tertiary|tertiary_link|unclassified|residential|living_street|service"]["access"!="no"]["access"!="private"]["motor_vehicle"!="no"](${bounds.join(",")});out body;>;out skel qt;`;
          const configured =
            globalThis.__ACIDCH_GIS_RUNTIME__?.getEndpoints?.() || services.endpoints;
          store.setServiceHealth("overpass", {
            state: "loading",
            message: "",
            latencyMs: null,
          });
          const loaded = await analysisWorker.run(
            "fetchParseGraph",
            {
              query,
              primary: configured.overpassPrimary,
              secondary: configured.overpassSecondary,
              maxElements: MAX_SESSION_GRAPH_ELEMENTS,
            },
            { revisionId: 0, isCurrent: () => true },
          );
          graph = loaded.result.graph;
          data = { elements: loaded.result.elements };
          writeGraphCache(bounds, data);
          root.dataset.graphParseExecution = loaded.execution;
          store.setServiceHealth("overpass", {
            state: "healthy",
            message: loaded.result.endpoint,
            latencyMs: null,
          });
        }
        if (graph.edges.length < 80) throw Error("small graph");
        clearGraphRetry(bounds);
        graphBounds = bounds;
        activeGraph = null;
        q("geo4-engine").value = "osm";
        store.setGraph(graph, graph.version);
        q("geo4-graph-status").textContent =
          `${T.graphOk} ${graph.nodeList.length.toLocaleString()} nodes / ${graph.edges.length.toLocaleString()} edges.`;
        runs();
        labels();
        if (+q("geo4-threshold").value < 10) q("geo4-threshold").value = "30";
        labels();
        return true;
      } catch (e) {
        if (!(e instanceof WorkerTaskError)) {
          globalThis.console?.warn("[Geo V4] graph", e);
        }
        if (requestedLiveGraph) {
          store.setServiceHealth("overpass", {
            state: "degraded",
            message: e?.message || "",
            latencyMs: null,
          });
        }
        deferGraphRetry(bounds);
        graph = baselineGraph;
        graphBounds = baselineGraph?.metadata?.bbox || null;
        activeGraph = null;
        q("geo4-engine").value = graph ? "osm" : "od";
        q("geo4-graph-status").textContent = T.graphFail;
        runs();
        labels();
        return false;
      } finally {
        q("geo4-load-graph").disabled = false;
      }
    })();
    try {
      const refreshed = await graphLoadPromise;
      if (solveAfter) await solveAndShowRoutes();
      return refreshed;
    } finally {
      graphLoadPromise = null;
    }
  }
  async function init() {
    q("geo4-init").disabled = true;
    try {
      baseScene = chooseRandomScene(true);
      applyBaseScene(baseScene);
      graph = null;
      graphBounds = null;
      activeGraph = null;
      solution = null;
      baselineSolution = null;
      lastMC = null;
      slots.A = slots.B = null;
      setEngineThreshold("osm", 30);
      q("geo4-road-mode").value = "baseline";
      policies();
      customs();
      publishEntities();
      runs();
      labels();
      draw();
      fit();
      q("geo4-graph-status").textContent = T.coordsOk;
      await loadGraph(true);
    } finally {
      q("geo4-init").disabled = false;
    }
  }
  async function routes() {
    if (!solution || store.getState().freshness.main !== "current") return;
    q("geo4-routes").disabled = true;
    root.dataset.routeViewportAction = "pending";
    store.setRouteVisuals([]);
    rl.clearLayers();
    let fallbackGeometry = false;
    try {
      if (!(await coords())) throw Error("coords");
      if (!solution || store.getState().freshness.main !== "current") return;
      const needsRefresh =
        graph !== baselineGraph &&
        routeGraphNeedsRefresh({
          engine: q("geo4-engine").value,
          graph,
          baselineGraph,
          graphBounds,
          points: [...HC, ...NC],
        });
      if (needsRefresh) {
        q("geo4-status").textContent = T.routeRefresh;
        await loadGraph(false);
        await solve();
        if (!solution || store.getState().freshness.main !== "current") return;
        fallbackGeometry = !graph || !activeGraph;
      }

      const token = store.begin("routes");
      const routeVisuals = [];
      q("geo4-status").textContent = T.route;
      let fails = 0;
      let fallbacks = 0;
      for (const x of solution.assignments) {
        if (store.getState().scenarioRevision !== token.scenarioRevision) return;
        const a = HC[x.hub],
          b = NC[x.demand];
        if (!a || !b) {
          fails++;
          continue;
        }
        if (
          q("geo4-engine").value === "osm" &&
          graph &&
          activeGraph &&
          !fallbackGeometry
        ) {
          const s = activeGraph.sourceSnaps[x.hub]?.nodeId,
            d = activeGraph.destinationSnaps[x.demand]?.nodeId,
            p =
              s && d
                ? reconstructGraphPath(graph, s, d, activeGraph.scenario, "time")
                : null;
          const coordinates = p ? connectRouteEndpoints(p.coordinates, a, b) : [];
          if (p && coordinates.length >= 2) {
            L.polyline(
              coordinates.map((v) => [v.lat, v.lon]),
              {
                color: "#d8ff6b",
                weight: 2.7,
                opacity: 0.84,
                className: "geo4__optimal-route",
              },
            )
              .bindTooltip(
                `${H[x.hub]} → ${N[x.demand]}<br>Flow: ${x.flow.toFixed(0)} · ${p.cost.toFixed(1)} min`,
              )
              .addTo(rl);
            routeVisuals.push({
              coordinates,
              flow: x.flow,
              travelMin: p.cost,
              stage: "warehouseDemand",
              geometrySource: "osm-graph",
            });
            continue;
          }
          fallbackGeometry = true;
        }
        try {
          const route = await services.osrmRoute([a, b]);
          const coordinates = connectRouteEndpoints(route.coordinates, a, b);
          if (coordinates.length < 2) throw new Error("invalid route geometry");
          L.polyline(
            coordinates.map((point) => [point.lat, point.lon]),
            {
              color: "#d8ff6b",
              weight: 2.5,
              opacity: 0.82,
              className: "geo4__optimal-route",
            },
          )
            .bindTooltip(`${H[x.hub]} → ${N[x.demand]}<br>Flow: ${x.flow.toFixed(0)}`)
            .addTo(rl);
          routeVisuals.push({
            coordinates,
            flow: x.flow,
            travelMin: route.durationMin ?? null,
            stage: "warehouseDemand",
            geometrySource: q("geo4-engine").value === "osm" ? "osrm-fallback" : "osrm",
          });
          if (q("geo4-engine").value === "osm") fallbacks++;
        } catch {
          fails++;
        }
        await wait(q("geo4-engine").value === "osm" && fallbackGeometry ? 1050 : 90);
      }
      if (!store.setRouteVisuals(routeVisuals, token)) {
        rl.clearLayers();
        return;
      }
      root.dataset.routeGeometrySignature = routeGeometrySignature(routeVisuals);
      root.dataset.routeScenarioMode = q("geo4-road-mode").value;
      await fitRoutesIfNeeded(routeVisuals);
      if (store.getState().scenarioRevision !== token.scenarioRevision) return;
      q("geo4-status").textContent = fails
        ? T.routePart
        : fallbacks
          ? T.routeFallback
          : T.routeOk;
    } catch (e) {
      globalThis.console?.warn("[Geo V4] routes", e);
      q("geo4-status").textContent = T.routePart;
    } finally {
      q("geo4-routes").disabled =
        !solution || store.getState().freshness.main !== "current";
    }
  }
  async function solveAndShowRoutes() {
    await solve();
    if (!solution) return;
    await waitForRoutePresentation();
    await routes();
  }
  const snap = () => {
    const snapshot = store.getState();
    const fixedCost =
      (solution?.selected?.length || 0) * Math.max(0, +q("geo4-fixed-cost").value || 0);
    return {
      result: solution ? JSON.parse(JSON.stringify(solution)) : null,
      metricSignature: solution?.metricSignature || null,
      engine: q("geo4-engine").value,
      graphVersion: snapshot.graphVersion,
      scenarioRevision: snapshot.scenarioRevision,
      metrics: {
        totalCost: solution?.score ?? null,
        fixedCost,
        transportCost: solution?.transportCost ?? null,
        expectedCost: snapshot.monteCarloResult?.expectedCost ?? null,
        p95Cost: snapshot.monteCarloResult?.p95Cost ?? null,
        cvar95Cost: snapshot.monteCarloResult?.cvar95Cost ?? null,
        unmetDemand: snapshot.monteCarloResult?.expectedUnmetDemand ?? null,
        openWarehouses: solution?.selected?.length ?? null,
        fleetTrips: snapshot.fleetSolution?.trips?.length ?? null,
        averageTravelTime: solution?.averageDurationMin ?? null,
      },
    };
  };
  function compare() {
    if (!slots.A?.result || !slots.B?.result) {
      q("geo4-ab").textContent = T.need;
      return;
    }
    const d = compareScenarioResults(slots.A.result, slots.B.result);
    if (!d.comparable) {
      q("geo4-ab").textContent = zh
        ? "A / B 成本定义不同，已阻止不兼容的指标相减。"
        : "A / B use different cost definitions; incompatible deltas were blocked.";
      return;
    }
    const labels = zh
      ? {
          totalCost: "总成本",
          fixedCost: "固定成本",
          transportCost: "运输成本",
          expectedCost: "期望成本",
          p95Cost: "P95",
          cvar95Cost: "CVaR95",
          unmetDemand: "未满足需求",
          openWarehouses: "开启仓库",
          fleetTrips: "车队趟数",
          averageTravelTime: "平均行程时间",
        }
      : {
          totalCost: "Total cost",
          fixedCost: "Fixed cost",
          transportCost: "Transport cost",
          expectedCost: "Expected cost",
          p95Cost: "P95",
          cvar95Cost: "CVaR95",
          unmetDemand: "Unmet demand",
          openWarehouses: "Open warehouses",
          fleetTrips: "Fleet trips",
          averageTravelTime: "Average travel time",
        };
    const moneyFields = new Set([
      "totalCost",
      "fixedCost",
      "transportCost",
      "expectedCost",
      "p95Cost",
      "cvar95Cost",
    ]);
    q("geo4-ab").innerHTML = Object.keys(labels)
      .map((key) => {
        const a = slots.A.metrics[key];
        const b = slots.B.metrics[key];
        const delta = Number.isFinite(a) && Number.isFinite(b) ? b - a : null;
        const value =
          delta == null
            ? "—"
            : moneyFields.has(key)
              ? `${delta >= 0 ? "+" : "−"}${cash(Math.abs(delta))}`
              : `${delta >= 0 ? "+" : "−"}${Math.abs(delta).toFixed(key === "averageTravelTime" ? 1 : 0)}${key === "averageTravelTime" ? " min" : ""}`;
        return `<div><span>${labels[key]}</span><strong>${value}</strong></div>`;
      })
      .join("");
    q("geo4-status").textContent = T.ab;
  }
  async function reset() {
    applyBaseScene(baseScene);
    fleet = 20;
    newRoads = 4;
    solution = null;
    baselineSolution = null;
    graph = baselineGraph;
    graphBounds = baselineGraph?.metadata?.bbox || null;
    activeGraph = null;
    fastMatrix = null;
    lastMC = null;
    mapAdd = false;
    slots.A = slots.B = null;
    store.reset({
      graph: baselineGraph,
      graphVersion: baselineGraph?.version || "none",
      presentation: { map, leaflet: L },
    });
    setEngineThreshold(graph ? "osm" : "od", graph ? 30 : 15);
    q("geo4-road-mode").value = "baseline";
    q("geo4-objective").value = "minHubs";
    q("geo4-redundancy").value = "1";
    q("geo4-congestion").value = "35";
    q("geo4-congestion-share").value = "35";
    q("geo4-closure").value = "1";
    q("geo4-seed").value = "708709";
    q("geo4-demand-multiplier").value = "1";
    q("geo4-facility-capacity").value = "6000";
    q("geo4-fixed-cost").value = "350000";
    q("geo4-enforce-fleet").checked = true;
    q("geo4-vehicle-capacity").value = "120";
    q("geo4-trips").value = "5";
    q("geo4-transport-cost").value = ".72";
    if (q("geo4-time-cost")) q("geo4-time-cost").value = ".35";
    q("geo4-layer").value = "flow";
    q("geo4-robust").hidden = true;
    q("geo4-ab").innerHTML = "";
    q("geo4-map-add").textContent = T.off;
    q("geo4-map-add").classList.remove("is-active");
    q("geo4-graph-status").textContent = T.ready;
    rl.clearLayers();
    runs();
    labels();
    customs();
    policies();
    publishEntities();
    await solve();
    map.setView([-36.873, 174.766], 12);
    if (solution) {
      await waitForRoutePresentation();
      await routes();
    }
  }
  [
    "geo4-congestion",
    "geo4-congestion-share",
    "geo4-closure",
    "geo4-threshold",
    "geo4-demand-multiplier",
  ].forEach((id) =>
    q(id).addEventListener("input", () => {
      labels();
      store.updateInputs(`input:${id}`);
    }),
  );
  [
    "geo4-objective",
    "geo4-road-mode",
    "geo4-event",
    "geo4-redundancy",
    "geo4-facility-capacity",
    "geo4-fixed-cost",
    "geo4-enforce-fleet",
    "geo4-vehicle-capacity",
    "geo4-trips",
    "geo4-transport-cost",
    "geo4-time-cost",
    "geo4-inv-mean",
    "geo4-inv-sd",
    "geo4-lead-time",
    "geo4-service",
    "geo4-holding-cost",
    "geo4-seed",
  ].forEach((id) => {
    const element = q(id);
    const mark = () => {
      if (id === "geo4-event") labels();
      store.updateInputs(`input:${id}`);
    };
    element?.addEventListener("input", mark);
    element?.addEventListener("change", mark);
  });
  D.querySelectorAll("[data-step]").forEach((b) =>
    b.addEventListener("click", () => {
      const d = +b.dataset.delta;
      if (b.dataset.step === "maxOpen")
        maxOpen = Math.max(1, Math.min(H.length, maxOpen + d));
      else if (b.dataset.step === "fleet") fleet = Math.max(0, fleet + d);
      else newRoads = Math.max(0, Math.min(40, newRoads + d));
      labels();
      store.updateInputs(`step:${b.dataset.step}`);
    }),
  );
  q("geo4-engine").addEventListener("change", async () => {
    if (q("geo4-engine").value === "osm" && !graph) {
      await loadGraph(true);
    }
    const threshold = q("geo4-threshold");
    if (q("geo4-engine").value === "osm") {
      threshold.min = "5";
      threshold.max = "60";
      threshold.step = "1";
    } else {
      threshold.min = "3";
      threshold.max = "15";
      threshold.step = "0.5";
    }
    if (q("geo4-engine").value === "osm" && +threshold.value <= 15)
      threshold.value = "30";
    if (q("geo4-engine").value === "od" && +threshold.value > 15) threshold.value = "6";
    runs();
    labels();
    store.updateInputs("engine");
  });
  q("geo4-layer").addEventListener("change", draw);
  q("geo4-init").addEventListener("click", init);
  q("geo4-load-graph").addEventListener("click", () =>
    loadGraph(true, { force: true }),
  );
  q("geo4-run").addEventListener("click", solveAndShowRoutes);
  q("geo4-simulate").addEventListener("click", simulate);
  q("geo4-routes").addEventListener("click", routes);
  q("geo4-reset").addEventListener("click", reset);
  q("geo4-save-a").addEventListener("click", () => {
    if (!solution) {
      q("geo4-status").textContent = T.none;
      return;
    }
    slots.A = snap();
    store.setScenarioSlot("A", slots.A);
    q("geo4-status").textContent = T.a;
  });
  q("geo4-save-b").addEventListener("click", () => {
    if (!solution) {
      q("geo4-status").textContent = T.none;
      return;
    }
    slots.B = snap();
    store.setScenarioSlot("B", slots.B);
    q("geo4-status").textContent = T.b;
  });
  q("geo4-compare").addEventListener("click", compare);
  q("geo4-add-address").addEventListener("click", async () => {
    const s = q("geo4-address").value.trim();
    if (!s) return;
    q("geo4-status").textContent = T.geo;
    q("geo4-add-address").disabled = true;
    try {
      const p = await geo(
        s.toLowerCase().includes("new zealand") ? s : `${s}, Auckland, New Zealand`,
      );
      await add(p, s, q("geo4-role").value, +q("geo4-demand-qty").value);
      q("geo4-address").value = "";
    } catch (e) {
      globalThis.console?.warn("[Geo V4] add", e);
      q("geo4-status").textContent = T.addFail;
    } finally {
      q("geo4-add-address").disabled = false;
    }
  });
  q("geo4-map-add").addEventListener("click", () => {
    mapAdd = !mapAdd;
    q("geo4-map-add").textContent = mapAdd ? T.on : T.off;
    q("geo4-map-add").classList.toggle("is-active", mapAdd);
  });
  map.on("click", async (e) => {
    if (!mapAdd) return;
    const p = { lat: e.latlng.lat, lon: e.latlng.lng };
    q("geo4-status").textContent = T.geo;
    try {
      await add(p, await reverse(p), q("geo4-role").value, +q("geo4-demand-qty").value);
    } catch (err) {
      globalThis.console?.warn("[Geo V4] map add", err);
      q("geo4-status").textContent = T.addFail;
    }
  });
  const cached = cache();
  q("geo4-graph-status").textContent = cached ? T.coordsOk : T.ready;
  runs();
  labels();
  customs();
  policies();
  (async () => {
    try {
      baselineGraph = await loadAucklandBaselineGraph();
      graph = baselineGraph;
      graphBounds = baselineGraph.metadata?.bbox || null;
      setEngineThreshold("osm", 30);
      store.setGraph(baselineGraph, baselineGraph.version);
      publishEntities();
      q("geo4-graph-status").textContent =
        `${T.ready} ${AUCKLAND_BASELINE_METADATA.nodeCount.toLocaleString()} nodes / ${AUCKLAND_BASELINE_METADATA.edgeCount.toLocaleString()} edges · ${AUCKLAND_BASELINE_METADATA.version}.`;
      await solveInitialScenario();
      draw();
      fit();
      if (solution && !initialRoutesLoaded) {
        initialRoutesLoaded = true;
        await waitForRoutePresentation();
        await routes();
      }
    } catch (error) {
      globalThis.console?.warn("[Geo V4] baseline graph", error);
      q("geo4-graph-status").textContent = T.graphFail;
    }
  })();
}
boot();
