import {
  applyOdScenario,
  compareScenarioResults,
  graphOdMatrix,
  inventoryPolicy,
  parseOverpassGraph,
  runMonteCarlo,
  simulateInventoryStockout,
  solveFacilityNetwork,
} from "../lib/geospatial/decisionEngine.js";
import { reconstructGraphPath } from "../lib/geospatial/pathTools.js";

const D = globalThis.document,
  F = (...a) => globalThis.fetch(...a),
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
    T = zh
      ? {
          ready: "轻量 GIS 场景已就绪。OSM 道路网络将自动加载；失败时仍可使用快速 OD 网络。",
          coords: "GIS 场景点位已就绪。",
          coordsOk: "GIS 场景点位已就绪。",
          coordsFail: "GIS 点位不可用；快速 OD 网络仍可继续使用。",
          graph: "正在加载精简 OSM 可驾驶道路网络…",
          graphCached: "已从本次会话缓存恢复 OSM 道路网络。",
          graphOk: "OSM 道路网络已加载。",
          graphFail: "OSM 道路网络暂时不可用，已自动切换至快速 OD 网络。可稍后重试。",
          graphReload: "新增点位超出当前 OSM 覆盖范围，正在重新加载道路网络…",
          solve: "正在计算当前情景…",
          solved: "当前情景已完成重新优化。",
          none: "当前设施、覆盖、容量或车队约束下没有可行方案。",
          geo: "正在解析地点并更新道路矩阵…",
          addFail: "地点添加失败，请检查地址或网络服务。",
          on: "点击地图添加：开启",
          off: "点击地图添加",
          remove: "删除",
          keepOne: "场景至少需要保留 1 个设施和 1 个需求点。",
          auto: "自动",
          must: "必须开启",
          exclude: "排除",
          warehouse: "仓库",
          factory: "工厂",
          demand: "需求点",
          sim: "正在运行 Monte Carlo 稳健性模拟…",
          simOk: "Monte Carlo 稳健性模拟完成。",
          route: "正在加载当前最优分配路径…",
          routeOk: "最优路径已加载；OSM 模式与本次 Dijkstra 情景一致。",
          routePart: "部分路径不可用，保留分配线作为降级显示。",
          a: "已保存情景 A。",
          b: "已保存情景 B。",
          ab: "A / B 对比已生成。",
          need: "需要先分别保存 A 和 B。",
          covered: "已覆盖",
          uncovered: "未覆盖",
          redundant: "2×+ 重叠覆盖",
          baseline: "基线",
          vsBaseline: "较基线",
        }
      : {
          ready:
            "Compact GIS scene ready. The OSM Road Network will load automatically; Fast OD remains available as fallback.",
          coords: "GIS scene points are ready.",
          coordsOk: "GIS scene points are ready.",
          coordsFail: "GIS points unavailable; the Fast OD Network remains available.",
          graph: "Loading a compact OSM drivable road network…",
          graphCached: "OSM Road Network restored from this session cache.",
          graphOk: "OSM Road Network loaded.",
          graphFail:
            "OSM Road Network is temporarily unavailable. Switched to Fast OD automatically; retry later.",
          graphReload: "The new point is outside the current OSM extent; reloading the road network…",
          solve: "Calculating scenario…",
          solved: "Scenario re-optimised.",
          none: "No feasible solution under current facility, coverage, capacity or fleet constraints.",
          geo: "Resolving the location and updating the road matrix…",
          addFail: "Location add failed. Check the address or network service.",
          on: "Map add: on",
          off: "Add by clicking map",
          remove: "Remove",
          keepOne: "Keep at least one facility and one demand node in the scene.",
          auto: "Auto",
          must: "Must open",
          exclude: "Exclude",
          warehouse: "Warehouse",
          factory: "Factory",
          demand: "Demand",
          sim: "Running Monte Carlo robustness simulation…",
          simOk: "Monte Carlo robustness simulation complete.",
          route: "Loading current optimal paths…",
          routeOk:
            "Optimal paths loaded; OSM mode matches the current Dijkstra scenario.",
          routePart:
            "Some paths were unavailable; allocation links remain as fallback.",
          a: "Scenario A saved.",
          b: "Scenario B saved.",
          ab: "A / B comparison generated.",
          need: "Save both A and B first.",
          covered: "Covered",
          uncovered: "Uncovered",
          redundant: "2×+ coverage",
          baseline: "Baseline",
          vsBaseline: "vs baseline",
        };

  const FACILITY_REGIONS = [
    { name: "North", points: [["Albany",-36.7245,174.6978],["Browns Bay",-36.7167,174.75],["Takapuna",-36.787,174.775],["Silverdale",-36.6167,174.675]] },
    { name: "West", points: [["Henderson",-36.879,174.63],["Westgate",-36.819,174.613],["Te Atatu",-36.866,174.657],["New Lynn",-36.91,174.684]] },
    { name: "Central", points: [["Auckland CBD",-36.8485,174.7633],["Mount Eden",-36.877,174.764],["Epsom",-36.889,174.797],["Onehunga",-36.921,174.785],["Newmarket",-36.869,174.777]] },
    { name: "East", points: [["Orakei",-36.8585,174.811],["Panmure",-36.896,174.855],["Pakuranga",-36.883,174.915],["Howick",-36.895,174.93]] },
    { name: "South", points: [["Manukau",-36.992,174.879],["Manurewa",-37.021,174.901],["Takanini",-37.041,174.921],["Papakura",-37.066,174.943],["Drury",-37.101,174.956]] },
  ],
    DEMAND_REGIONS = [
      { name: "North", points: [["Albany Demand",-36.735,174.698],["Rosedale Demand",-36.742,174.717],["Browns Bay Demand",-36.715,174.748],["Northcross Demand",-36.703,174.733]] },
      { name: "West", points: [["Henderson Demand",-36.879,174.63],["Massey Demand",-36.814,174.606],["New Lynn Demand",-36.909,174.681],["Glen Eden Demand",-36.923,174.65]] },
      { name: "Central", points: [["CBD Demand",-36.8485,174.7633],["Kingsland Demand",-36.882,174.719],["Epsom Demand",-36.889,174.797],["One Tree Hill Demand",-36.901,174.785]] },
      { name: "East", points: [["Orakei Demand",-36.8585,174.811],["Panmure Demand",-36.895,174.854],["Pakuranga Demand",-36.883,174.915],["Howick Demand",-36.895,174.93]] },
      { name: "South", points: [["Manukau Demand",-36.992,174.879],["Manurewa Demand",-37.021,174.901],["Takanini Demand",-37.041,174.921],["Papakura Demand",-37.066,174.943]] },
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
    const stored = Number(globalThis.sessionStorage?.getItem("acidch-geo-v4-scene-seed"));
    let seed = Number.isInteger(stored) && stored > 0 ? stored : ((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0);
    if (forceDifferent || !Number.isInteger(stored) || stored <= 0) {
      seed = ((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0);
      if (seed === stored) seed = (seed + 104729) >>> 0;
      globalThis.sessionStorage?.setItem("acidch-geo-v4-scene-seed", String(seed));
    }
    const random = rng(seed);
    const facilities = [];
    FACILITY_REGIONS.forEach((region) => {
      const p = shuffled(region.points, random)[0];
      facilities.push({ region: region.name, name: p[0], lat: p[1], lon: p[2] });
    });
    const facilityPool = FACILITY_REGIONS.flatMap((region) => region.points.map((p) => ({ region: region.name, name: p[0], lat: p[1], lon: p[2] })));
    for (const candidate of shuffled(facilityPool, random)) {
      if (facilities.length >= 10) break;
      if (!facilities.some((x) => x.name === candidate.name)) facilities.push(candidate);
    }
    const typedFacilities = shuffled(facilities, random).map((x, index) => ({ ...x, type: index < 3 ? "factory" : "warehouse" }));
    const demands = [];
    DEMAND_REGIONS.forEach((region) => {
      const p = shuffled(region.points, random)[0];
      demands.push({ region: region.name, name: p[0], lat: p[1], lon: p[2] });
    });
    const demandPool = DEMAND_REGIONS.flatMap((region) => region.points.map((p) => ({ region: region.name, name: p[0], lat: p[1], lon: p[2] })));
    for (const candidate of shuffled(demandPool, random)) {
      if (demands.length >= 12) break;
      if (!demands.some((x) => x.name === candidate.name)) demands.push(candidate);
    }
    const H = typedFacilities.map((x) => x.name);
    const HQ = typedFacilities.map((x) => x.name + ", Auckland, New Zealand");
    const HC = typedFacilities.map((x) => ({ lat: x.lat, lon: x.lon }));
    const HT = typedFacilities.map((x) => x.type);
    const N = demands.map((x) => x.name);
    const NQ = demands.map((x) => x.name + ", Auckland, New Zealand");
    const NC = demands.map((x) => ({ lat: x.lat, lon: x.lon }));
    const DM = demands.map(() => Math.round((400 + random() * 700) / 50) * 50);
    const M = HC.map((a) => NC.map((b) => {
      const lat = ((b.lat - a.lat) * Math.PI) / 180;
      const lon = ((b.lon - a.lon) * Math.PI) / 180;
      const aa = Math.sin(lat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(lon / 2) ** 2;
      return 2 * 6371 * Math.asin(Math.sqrt(Math.min(1, aa)));
    }));
    return { H, HQ, HC, HT, N, NQ, NC, DM, M, seed };
  }

  let baseScene = chooseRandomScene(false);

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
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    maxZoom: 20,
    subdomains: "abcd",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; CARTO',
  }).addTo(map);

  const fl = L.layerGroup().addTo(map),
    dl = L.layerGroup().addTo(map),
    al = L.layerGroup().addTo(map),
    cl = L.layerGroup().addTo(map),
    rl = L.layerGroup().addTo(map);

  let H = [],
    HQ = [],
    HT = [],
    N = [],
    NQ = [],
    DM = [],
    M = [],
    HC = [],
    NC = [],
    P = [],
    custom = [],
    maxOpen = 2,
    fleet = 20,
    newRoads = 4,
    solution = null,
    baselineSolution = null,
    activeGraph = null,
    graph = null,
    graphBounds = null,
    lastMC = null,
    mapAdd = false;

  const slots = { A: null, B: null };
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
    inv = () => inventoryPolicy(invIn());

  function applyBaseScene(scene = baseScene) {
    H = [...scene.H];
    HQ = [...scene.HQ];
    HT = [...scene.HT];
    N = [...scene.N];
    NQ = [...scene.NQ];
    DM = [...scene.DM];
    M = scene.M.map((row) => [...row]);
    HC = scene.HC.map((p) => ({ ...p }));
    NC = scene.NC.map((p) => ({ ...p }));
    P = H.map(() => "auto");
    custom = [];
    maxOpen = Math.max(1, Math.min(2, H.length));
  }
  applyBaseScene();

  const sc = (off = 0) => ({
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
  });

  function sp(mx) {
    const mult = +q("geo4-demand-multiplier").value,
      fc = fleet * +q("geo4-vehicle-capacity").value * +q("geo4-trips").value,
      ip = inv();
    return {
      matrix: mx,
      demands: DM,
      policies: P,
      maxOpen,
      redundancy: +q("geo4-redundancy").value,
      threshold: +q("geo4-threshold").value,
      facilityCapacity: +q("geo4-facility-capacity").value,
      fixedCost:
        +q("geo4-fixed-cost").value + ip.safetyStock * +q("geo4-holding-cost").value,
      transportCost: +q("geo4-transport-cost").value,
      objective: q("geo4-objective").value,
      demandMultiplier: mult,
      fleetCapacity: fc,
      enforceFleet: q("geo4-enforce-fleet").checked,
    };
  }

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
  }

  async function geo(s) {
    const u = new globalThis.URL("https://nominatim.openstreetmap.org/search");
    u.searchParams.set("q", s);
    u.searchParams.set("format", "jsonv2");
    u.searchParams.set("limit", "1");
    u.searchParams.set("countrycodes", "nz");
    const r = await F(u.toString(), {
        headers: { "Accept-Language": zh ? "zh,en;q=0.8" : "en" },
      }),
      d = await r.json();
    if (!r.ok || !d.length) throw Error("geocode");
    return { lat: +d[0].lat, lon: +d[0].lon, label: d[0].display_name || s };
  }

  async function reverse(p) {
    const u = new globalThis.URL("https://nominatim.openstreetmap.org/reverse");
    u.searchParams.set("lat", p.lat);
    u.searchParams.set("lon", p.lon);
    u.searchParams.set("format", "jsonv2");
    const r = await F(u.toString(), {
      headers: { "Accept-Language": zh ? "zh,en;q=0.8" : "en" },
    });
    if (!r.ok) return `${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}`;
    const d = await r.json();
    return d.display_name || `${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}`;
  }

  function fit() {
    const a = [...HC, ...NC].filter(Boolean);
    if (a.length)
      map.fitBounds(
        a.map((p) => [p.lat, p.lon]),
        { padding: [34, 34], maxZoom: 13.5 },
      );
  }

  async function table(src, dst) {
    const p = [...src, ...dst],
      cs = p.map((x) => `${x.lon},${x.lat}`).join(";"),
      ss = src.map((_, i) => i).join(";"),
      ds = dst.map((_, i) => i + src.length).join(";"),
      u = `https://router.project-osrm.org/table/v1/driving/${cs}?sources=${ss}&destinations=${ds}&annotations=distance,duration`,
      r = await F(u),
      d = await r.json();
    if (!r.ok || !Array.isArray(d.distances)) throw Error("OSRM table");
    return d.distances.map((row) =>
      row.map((v) => (Number.isFinite(v) ? v / 1000 : Infinity)),
    );
  }

  function entityCustomLabel(type, index) {
    return custom.some((x) => x.type === type && x.modelIndex === index)
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
      }),
    );
    D.querySelectorAll("[data-demand-edit]").forEach((input) =>
      input.addEventListener("change", () => {
        DM[+input.dataset.demandEdit] = Math.max(0, +input.value || 0);
        input.value = String(DM[+input.dataset.demandEdit]);
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
      ? `<p>${zh ? "自定义实体已合并显示在上方实体清单中。" : "Custom entities are listed in the unified entity list above."}</p>`
      : "<p>—</p>";
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
      L.circleMarker([p.lat, p.lon], {
        radius: rad,
        weight: on ? 3 : 1.4,
        color: col,
        fillColor: col,
        fillOpacity: on ? 0.92 : 0.5,
        className: `geo4-facility-node${on ? " is-open" : ""}`,
      })
        .bindTooltip(`<strong>${H[i]}</strong><br>${detail}`)
        .addTo(fl);
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
      L.circleMarker([p.lat, p.lon], {
        radius: Math.max(4, Math.min(10, 4 + (DM[i] || 0) / 900)),
        color: covered ? (count >= 2 ? "#d8ff6b" : "#62ecff") : "#ff759a",
        weight: covered ? 1.6 : 2,
        fillColor: covered ? (count >= 2 ? "#d8ff6b" : "#62ecff") : "#ff3d78",
        fillOpacity: 0.62,
        className: `geo4-demand-node ${state}`,
      })
        .bindTooltip(
          `<strong>${N[i]}</strong><br>Demand: ${(DM[i] || 0).toLocaleString()}<br>${status}`,
        )
        .addTo(dl);
    });
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
    const ip = inv(),
      td = DM.reduce((a, b) => a + b, 0) * +q("geo4-demand-multiplier").value,
      fc = fleet * +q("geo4-vehicle-capacity").value * +q("geo4-trips").value,
      osm = q("geo4-engine").value === "osm" && Boolean(graph),
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

  async function active(off = 0) {
    if (q("geo4-engine").value === "osm") {
      if (!graph) throw Error("no graph");
      activeGraph = graphOdMatrix({
        graph,
        sources: HC,
        destinations: NC,
        scenarioParams: sc(off),
        metric: "time",
      });
      return activeGraph.matrix;
    }
    activeGraph = null;
    return applyOdScenario(M, sc(off));
  }

  async function baseline() {
    if (q("geo4-engine").value !== "osm" || !graph) return solveFacilityNetwork(sp(M));
    const baselineGraph = graphOdMatrix({
      graph,
      sources: HC,
      destinations: NC,
      scenarioParams: { ...sc(), mode: "baseline" },
      metric: "time",
    });
    return solveFacilityNetwork(sp(baselineGraph.matrix));
  }

  async function solve() {
    q("geo4-status").textContent = T.solve;
    rl.clearLayers();
    if (q("geo4-engine").value === "osm" && !graph) {
      const loaded = await loadGraph(false);
      if (!loaded && q("geo4-engine").value === "osm") q("geo4-engine").value = "od";
    }
    try {
      solution = solveFacilityNetwork(sp(await active()));
      baselineSolution = await baseline();
    } catch (e) {
      globalThis.console?.warn("[Geo V4] solve", e);
      solution = null;
      baselineSolution = null;
    }
    results();
    draw();
    q("geo4-routes").disabled = !solution;
  }

  function robust(r) {
    lastMC = r;
    q("geo4-robust").hidden = false;
    q("geo4-mc-runs").textContent = r.runs;
    q("geo4-mc-expected").textContent = cash(r.expectedCost);
    q("geo4-mc-p95").textContent = cash(r.p95Cost);
    q("geo4-mc-failure").textContent = pct(r.failureRate);
    const osm = q("geo4-engine").value === "osm" && Boolean(graph);
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
    draw();
  }

  async function edgeMC(n) {
    const costs = [],
      net = [],
      cnt = Array(H.length).fill(0);
    let fail = 0;
    for (let i = 0; i < n; i++) {
      const s = solveFacilityNetwork(sp(await active(i * 7919)));
      if (!s) fail++;
      else {
        costs.push(s.score);
        net.push(s.averageNetworkCost);
        s.selected.forEach((j) => cnt[j]++);
      }
      if (i % 2 === 0) await wait(0);
    }
    const sorted = [...costs].sort((a, b) => a - b),
      iv = simulateInventoryStockout({
        ...invIn(),
        runs: Math.max(200, n * 10),
        seed: +q("geo4-seed").value + 104729,
      });
    return {
      runs: n,
      successfulRuns: n - fail,
      expectedCost: costs.length ? costs.reduce((a, b) => a + b, 0) / costs.length : null,
      p95Cost: sorted.length
        ? sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)]
        : null,
      failureRate: fail / n,
      averageNetworkCost: net.length ? net.reduce((a, b) => a + b, 0) / net.length : null,
      stockoutProbability: iv.stockoutProbability,
      facilityStability: cnt
        .map((c, i) => ({ index: i, name: H[i], probability: c / n }))
        .sort((a, b) => b.probability - a.probability),
    };
  }

  async function simulate() {
    q("geo4-status").textContent = T.sim;
    q("geo4-simulate").disabled = true;
    try {
      const n = +q("geo4-runs").value,
        r =
          q("geo4-engine").value === "osm" && graph
            ? await edgeMC(n)
            : runMonteCarlo({
                baseMatrix: M,
                solverParams: sp(M),
                scenarioParams: sc(),
                runs: n,
                seed: +q("geo4-seed").value,
                facilityNames: H,
                inventory: invIn(),
              });
      robust(r);
      q("geo4-status").textContent = T.simOk;
    } catch (e) {
      globalThis.console?.warn("[Geo V4] MC", e);
      q("geo4-status").textContent = T.none;
    } finally {
      q("geo4-simulate").disabled = false;
    }
  }

  async function addMatrix(p, type) {
    if (type === "demand") {
      const x = await table(HC, [p]);
      M.forEach((r, i) => r.push(x[i][0]));
      NC.push(p);
    } else {
      const x = await table([p], NC);
      M.push(x[0]);
      HC.push(p);
    }
  }

  function insideGraphBounds(p) {
    return (
      graphBounds &&
      p.lat >= graphBounds[0] &&
      p.lon >= graphBounds[1] &&
      p.lat <= graphBounds[2] &&
      p.lon <= graphBounds[3]
    );
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
      maxOpen = Math.max(1, Math.min(maxOpen, H.length));
    }
    custom.push({ id, name, type, lat: p.lat, lon: p.lon, modelIndex: mi });
    activeGraph = null;
    policies();
    customs();
    labels();
    runs();
    fit();

    if (wantedOsm && graph && insideGraphBounds(p)) {
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
    await solve();
  }

  async function removeEntity(kind, index) {
    if ((kind === "facility" && H.length <= 1) || (kind === "demand" && N.length <= 1)) {
      q("geo4-status").textContent = T.keepOne;
      return;
    }
    if (kind === "demand") {
      N.splice(index, 1);
      NQ.splice(index, 1);
      DM.splice(index, 1);
      NC.splice(index, 1);
      M.forEach((row) => row.splice(index, 1));
      custom = custom.filter((x) => !(x.type === "demand" && x.modelIndex === index));
      custom.forEach((x) => {
        if (x.type === "demand" && x.modelIndex > index) x.modelIndex--;
      });
    } else {
      H.splice(index, 1);
      HQ.splice(index, 1);
      HT.splice(index, 1);
      HC.splice(index, 1);
      P.splice(index, 1);
      M.splice(index, 1);
      custom = custom.filter((x) => !(x.type !== "demand" && x.modelIndex === index));
      custom.forEach((x) => {
        if (x.type !== "demand" && x.modelIndex > index) x.modelIndex--;
      });
      maxOpen = Math.max(1, Math.min(maxOpen, H.length));
    }
    activeGraph = null;
    policies();
    customs();
    labels();
    await solve();
    fit();
  }

  function graphRequestBounds() {
    const pts = [...HC, ...NC],
      la = pts.map((p) => p.lat),
      lo = pts.map((p) => p.lon),
      pad = 0.006;
    return [
      Math.min(...la) - pad,
      Math.min(...lo) - pad,
      Math.max(...la) + pad,
      Math.max(...lo) + pad,
    ];
  }

  function graphCacheKey(bounds) {
    return `acidch-osm-compact-v2:${bounds.map((v) => v.toFixed(3)).join(":")}`;
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
      const raw = JSON.stringify(data);
      if (raw.length <= 4_200_000)
        globalThis.sessionStorage?.setItem(graphCacheKey(bounds), raw);
    } catch {
      // Session cache is an optimisation only.
    }
  }

  async function loadGraph(solveAfter = true) {
    q("geo4-graph-status").textContent = T.graph;
    q("geo4-load-graph").disabled = true;
    const bounds = graphRequestBounds();
    try {
      let data = readGraphCache(bounds);
      if (data) q("geo4-graph-status").textContent = T.graphCached;
      if (!data) {
        const query = `[out:json][timeout:20];way["highway"~"motorway|motorway_link|trunk|trunk_link|primary|primary_link|secondary|secondary_link|tertiary|tertiary_link|unclassified|residential|living_street|service"]["access"!="no"]["access"!="private"]["motor_vehicle"!="no"](${bounds.join(",")});out body;>;out skel qt;`,
          configured = globalThis.__ACIDCH_GIS_RUNTIME__?.getEndpoints?.() || {},
          eps = [
            configured.overpassPrimary || "https://overpass-api.de/api/interpreter",
            configured.overpassSecondary ||
              "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
          ].filter((value, index, array) => value && array.indexOf(value) === index);
        for (const ep of eps) {
          try {
            const r = await F(ep, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
              },
              body: `data=${encodeURIComponent(query)}`,
            });
            if (!r.ok) throw Error(`overpass ${r.status}`);
            data = await r.json();
            if (data?.elements?.length) {
              writeGraphCache(bounds, data);
              break;
            }
          } catch (e) {
            globalThis.console?.warn("[Geo V4] Overpass", ep, e);
          }
        }
      }
      if (!data?.elements?.length) throw Error("graph");
      graph = parseOverpassGraph(data.elements);
      if (graph.edges.length < 80) throw Error("small graph");
      graphBounds = bounds;
      activeGraph = null;
      q("geo4-engine").value = "osm";
      q("geo4-graph-status").textContent =
        `${T.graphOk} ${graph.nodeList.length.toLocaleString()} nodes / ${graph.edges.length.toLocaleString()} edges.`;
      runs();
      labels();
      if (+q("geo4-threshold").value < 10) q("geo4-threshold").value = "30";
      labels();
      if (solveAfter) await solve();
      return true;
    } catch (e) {
      globalThis.console?.warn("[Geo V4] graph", e);
      graph = null;
      graphBounds = null;
      activeGraph = null;
      q("geo4-engine").value = "od";
      q("geo4-graph-status").textContent = T.graphFail;
      runs();
      q("geo4-threshold").value = "6";
      labels();
      if (solveAfter) await solve();
      return false;
    } finally {
      q("geo4-load-graph").disabled = false;
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
      q("geo4-engine").value = "osm";
      q("geo4-threshold").value = "30";
      q("geo4-road-mode").value = "baseline";
      policies();
      customs();
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
    if (!solution) return;
    q("geo4-status").textContent = T.route;
    q("geo4-routes").disabled = true;
    rl.clearLayers();
    let fails = 0;
    try {
      for (const x of solution.assignments) {
        if (q("geo4-engine").value === "osm" && graph && activeGraph) {
          const s = activeGraph.sourceSnaps[x.hub]?.nodeId,
            d = activeGraph.destinationSnaps[x.demand]?.nodeId,
            p =
              s && d
                ? reconstructGraphPath(graph, s, d, activeGraph.scenario, "time")
                : null;
          if (!p) {
            fails++;
            continue;
          }
          L.polyline(
            p.coordinates.map((v) => [v.lat, v.lon]),
            { color: "#142126", weight: 8, opacity: 0.82, lineCap: "round", lineJoin: "round" },
          )
            .addTo(rl);
          L.polyline(
            p.coordinates.map((v) => [v.lat, v.lon]),
            { color: "#d8ff6b", weight: 4.2, opacity: 0.96, lineCap: "round", lineJoin: "round" },
          )
            .bindTooltip(
              `${H[x.hub]} → ${N[x.demand]}<br>Flow: ${x.flow.toFixed(0)} · ${p.cost.toFixed(1)} min`,
            )
            .addTo(rl);
          continue;
        }
        const a = HC[x.hub],
          b = NC[x.demand];
        if (!a || !b) {
          fails++;
          continue;
        }
        try {
          const u = `https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=simplified&geometries=geojson&steps=false`,
            r = await F(u),
            d = await r.json(),
            cs = d.routes?.[0]?.geometry?.coordinates;
          if (!r.ok || !cs?.length) throw Error("route");
          L.polyline(
            cs.map(([lon, lat]) => [lat, lon]),
            { color: "#142126", weight: 7.5, opacity: 0.82, lineCap: "round", lineJoin: "round" },
          )
            .addTo(rl);
          L.polyline(
            cs.map(([lon, lat]) => [lat, lon]),
            { color: "#d8ff6b", weight: 4, opacity: 0.95, lineCap: "round", lineJoin: "round" },
          )
            .bindTooltip(`${H[x.hub]} → ${N[x.demand]}<br>Flow: ${x.flow.toFixed(0)}`)
            .addTo(rl);
        } catch {
          fails++;
        }
        await wait(90);
      }
      q("geo4-status").textContent = fails ? T.routePart : T.routeOk;
    } catch (e) {
      globalThis.console?.warn("[Geo V4] routes", e);
      q("geo4-status").textContent = T.routePart;
    } finally {
      q("geo4-routes").disabled = false;
    }
  }

  const snap = () => ({
    result: solution ? JSON.parse(JSON.stringify(solution)) : null,
  });

  function compare() {
    if (!slots.A?.result || !slots.B?.result) {
      q("geo4-ab").textContent = T.need;
      return;
    }
    const d = compareScenarioResults(slots.A.result, slots.B.result);
    q("geo4-ab").innerHTML =
      `<div><span>Δ Facilities</span><strong>${d.hubs > 0 ? "+" : ""}${d.hubs ?? "—"}</strong></div><div><span>Δ Cost</span><strong>${d.cost == null ? "—" : `${d.cost >= 0 ? "+" : "−"}${cash(Math.abs(d.cost))}`}</strong></div><div><span>Δ Network</span><strong>${d.averageNetworkCost == null ? "—" : `${d.averageNetworkCost >= 0 ? "+" : ""}${d.averageNetworkCost.toFixed(2)}`}</strong></div>`;
    q("geo4-status").textContent = T.ab;
  }

  async function reset() {
    applyBaseScene(baseScene);
    fleet = 20;
    newRoads = 4;
    solution = null;
    baselineSolution = null;
    activeGraph = null;
    lastMC = null;
    mapAdd = false;
    slots.A = slots.B = null;
    q("geo4-engine").value = graph ? "osm" : "od";
    q("geo4-road-mode").value = "baseline";
    q("geo4-objective").value = "minHubs";
    q("geo4-threshold").value = graph ? "30" : "6";
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
    q("geo4-layer").value = "network";
    q("geo4-robust").hidden = true;
    q("geo4-ab").innerHTML = "";
    q("geo4-map-add").textContent = T.off;
    q("geo4-map-add").classList.remove("is-active");
    rl.clearLayers();
    runs();
    labels();
    customs();
    policies();
    await solve();
    fit();
  }

  [
    "geo4-congestion",
    "geo4-congestion-share",
    "geo4-closure",
    "geo4-threshold",
    "geo4-demand-multiplier",
  ].forEach((id) => q(id).addEventListener("input", labels));

  D.querySelectorAll("[data-step]").forEach((b) =>
    b.addEventListener("click", () => {
      const d = +b.dataset.delta;
      if (b.dataset.step === "maxOpen")
        maxOpen = Math.max(1, Math.min(H.length, maxOpen + d));
      else if (b.dataset.step === "fleet") fleet = Math.max(0, fleet + d);
      else newRoads = Math.max(0, Math.min(40, newRoads + d));
      labels();
    }),
  );

  q("geo4-engine").addEventListener("change", async () => {
    if (q("geo4-engine").value === "osm" && !graph) await loadGraph(true);
    runs();
    labels();
  });
  q("geo4-layer").addEventListener("change", draw);
  q("geo4-init").addEventListener("click", init);
  q("geo4-load-graph").addEventListener("click", () => loadGraph(true));
  q("geo4-run").addEventListener("click", solve);
  q("geo4-simulate").addEventListener("click", simulate);
  q("geo4-routes").addEventListener("click", routes);
  q("geo4-reset").addEventListener("click", reset);
  q("geo4-save-a").addEventListener("click", () => {
    slots.A = snap();
    q("geo4-status").textContent = T.a;
  });
  q("geo4-save-b").addEventListener("click", () => {
    slots.B = snap();
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

  q("geo4-engine").value = "osm";
  q("geo4-threshold").value = "30";
  q("geo4-graph-status").textContent = T.ready;
  runs();
  labels();
  customs();
  policies();
  draw();
  fit();
  globalThis.setTimeout(() => loadGraph(true), 120);
}

boot();
