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
          ready: "基础网络已就绪，可直接运行优化。",
          coords: "正在解析 Auckland GIS 点位…",
          coordsOk: "GIS 点位已加载并缓存。",
          coordsFail: "GIS 点位加载失败；快速 OD 网络仍可继续使用。",
          graph: "正在构建 OSM 可驾驶道路图…",
          graphOk: "OSM 路网已加载。",
          graphFail: "OSM 路网加载失败，已切换至快速 OD 网络。",
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
          ready: "Baseline network ready for optimisation.",
          coords: "Resolving Auckland GIS points…",
          coordsOk: "GIS points loaded and cached.",
          coordsFail: "GIS points failed; the Fast OD Network remains available.",
          graph: "Building the OSM drivable road graph…",
          graphOk: "OSM Road Network loaded.",
          graphFail: "OSM Road Network failed; switched to the Fast OD Network.",
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
  const H0 = [
      "328 Ponsonby Road",
      "322 Great North Road",
      "214 Green Lane West",
      "151 Beach Road",
      "76 Coates Avenue",
      "151 Neilson Street",
    ],
    HQ0 = [
      "328 Ponsonby Road, Ponsonby, Auckland, New Zealand",
      "322 Great North Road, Grey Lynn, Auckland, New Zealand",
      "214 Green Lane West, Epsom, Auckland, New Zealand",
      "151 Beach Road, Auckland CBD, Auckland, New Zealand",
      "76 Coates Avenue, Orakei, Auckland, New Zealand",
      "151 Neilson Street, Onehunga, Auckland, New Zealand",
    ],
    N0 = [
      "Auckland CBD",
      "Epsom",
      "Grey Lynn",
      "Mount Eden",
      "Newmarket",
      "Onehunga",
      "Orakei",
      "Ponsonby",
      "Remuera",
      "Three Kings",
    ],
    NQ0 = N0.map((x) => `${x}, Auckland, New Zealand`),
    DM0 = [4000, 600, 700, 800, 500, 600, 400, 700, 900, 400],
    M0 = [
      [2.07, 5.8, 2.04, 4.66, 4.12, 10.66, 7.5, 0.31, 7.7, 7.89],
      [4.2, 5.62, 1.29, 4.26, 4.94, 10.03, 9.5, 3.22, 8.51, 6.91],
      [6.45, 1.92, 6.76, 2.79, 3.44, 4.19, 7.26, 7.27, 4.42, 3.23],
      [1.45, 4.95, 4.85, 4.11, 2.47, 9.25, 4.48, 3.52, 4.89, 7.33],
      [5.56, 6.79, 8.98, 7.29, 5.05, 9.13, 0, 7.63, 2.87, 9.6],
      [10.7, 6.17, 10.99, 7.03, 7.69, 1.04, 9.48, 11.52, 6.62, 4.27],
    ];
  const q = (id) => D.getElementById(id),
    map = L.map("geo4-map", { zoomControl: true }).setView([-36.873, 174.766], 12);
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
  let H = [...H0],
    HQ = [...HQ0],
    HT = H0.map(() => "warehouse"),
    N = [...N0],
    NQ = [...NQ0],
    DM = [...DM0],
    M = M0.map((r) => [...r]),
    HC = [],
    NC = [],
    P = H0.map(() => "auto"),
    custom = [],
    maxOpen = 4,
    fleet = 20,
    newRoads = 4,
    solution = null,
    baselineSolution = null,
    activeGraph = null,
    graph = null,
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
  function policies() {
    q("geo4-facility-count").textContent = H.length;
    q("geo4-policy-list").innerHTML = H.map(
      (n, i) =>
        `<div class="geo4__policy-row"><div><strong>${n}</strong><small>${HT[i] === "factory" ? T.factory : T.warehouse}</small></div><select data-policy="${i}"><option value="auto" ${P[i] === "auto" ? "selected" : ""}>${T.auto}</option><option value="must" ${P[i] === "must" ? "selected" : ""}>${T.must}</option><option value="exclude" ${P[i] === "exclude" ? "selected" : ""}>${T.exclude}</option></select></div>`,
    ).join("");
    D.querySelectorAll("[data-policy]").forEach((s) =>
      s.addEventListener("change", () => {
        P[+s.dataset.policy] = s.value;
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
      if (!(await coords())) throw Error("no coords");
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
    if (q("geo4-engine").value !== "osm") return solveFacilityNetwork(sp(M));
    if (!graph || !(await coords())) return null;
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
      expectedCost: costs.length
        ? costs.reduce((a, b) => a + b, 0) / costs.length
        : null,
      p95Cost: sorted.length
        ? sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)]
        : null,
      failureRate: fail / n,
      averageNetworkCost: net.length
        ? net.reduce((a, b) => a + b, 0) / net.length
        : null,
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
          q("geo4-engine").value === "osm"
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
    if (!(await coords())) throw Error("coords");
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
  async function add(p, name, type, dq) {
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
    graph = null;
    activeGraph = null;
    q("geo4-engine").value = "od";
    q("geo4-graph-status").textContent = T.ready;
    runs();
    labels();
    customs();
    policies();
    await solve();
    fit();
  }
  async function remove(id) {
    const x = custom.find((v) => v.id === id);
    if (!x) return;
    const i = x.modelIndex;
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
    graph = null;
    activeGraph = null;
    q("geo4-engine").value = "od";
    runs();
    labels();
    customs();
    policies();
    await solve();
  }
  async function loadGraph() {
    q("geo4-graph-status").textContent = T.graph;
    q("geo4-load-graph").disabled = true;
    try {
      if (!(await coords())) throw Error("coords");
      const pts = [...HC, ...NC],
        la = pts.map((p) => p.lat),
        lo = pts.map((p) => p.lon),
        pad = 0.008,
        b = [
          Math.min(...la) - pad,
          Math.min(...lo) - pad,
          Math.max(...la) + pad,
          Math.max(...lo) + pad,
        ],
        query = `[out:json][timeout:35];way["highway"]["highway"!~"footway|path|cycleway|steps|pedestrian|track"](${b.join(",")});(._;>;);out body;`,
        eps = [
          "https://overpass-api.de/api/interpreter",
          "https://overpass.kumi.systems/api/interpreter",
        ];
      let data = null;
      for (const ep of eps) {
        try {
          const r = await F(ep, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            },
            body: `data=${encodeURIComponent(query)}`,
          });
          if (!r.ok) throw Error("overpass");
          data = await r.json();
          break;
        } catch (e) {
          globalThis.console?.warn("[Geo V4] Overpass", ep, e);
        }
      }
      if (!data?.elements?.length) throw Error("graph");
      graph = parseOverpassGraph(data.elements);
      if (graph.edges.length < 100) throw Error("small graph");
      q("geo4-engine").value = "osm";
      q("geo4-graph-status").textContent =
        `${T.graphOk} ${graph.nodeList.length.toLocaleString()} nodes / ${graph.edges.length.toLocaleString()} edges.`;
      runs();
      labels();
      await solve();
    } catch (e) {
      globalThis.console?.warn("[Geo V4] graph", e);
      graph = null;
      activeGraph = null;
      q("geo4-engine").value = "od";
      q("geo4-graph-status").textContent = T.graphFail;
      runs();
      labels();
    } finally {
      q("geo4-load-graph").disabled = false;
    }
  }
  async function init() {
    q("geo4-init").disabled = true;
    try {
      if (await coords()) {
        draw();
        fit();
        q("geo4-graph-status").textContent = T.coordsOk;
      }
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
      if (!(await coords())) throw Error("coords");
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
            { color: "#d8ff6b", weight: 2.7, opacity: 0.84 },
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
            { color: "#d8ff6b", weight: 2.5, opacity: 0.82 },
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
    H = [...H0];
    HQ = [...HQ0];
    HT = H0.map(() => "warehouse");
    N = [...N0];
    NQ = [...NQ0];
    DM = [...DM0];
    M = M0.map((r) => [...r]);
    HC = HC.slice(0, H0.length);
    NC = NC.slice(0, N0.length);
    P = H0.map(() => "auto");
    custom = [];
    maxOpen = 4;
    fleet = 20;
    newRoads = 4;
    solution = null;
    baselineSolution = null;
    graph = null;
    activeGraph = null;
    lastMC = null;
    mapAdd = false;
    slots.A = slots.B = null;
    q("geo4-engine").value = "od";
    q("geo4-road-mode").value = "baseline";
    q("geo4-objective").value = "minHubs";
    q("geo4-threshold").value = "6";
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
    q("geo4-graph-status").textContent = T.ready;
    rl.clearLayers();
    runs();
    labels();
    customs();
    policies();
    await solve();
    map.setView([-36.873, 174.766], 12);
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
  q("geo4-engine").addEventListener("change", () => {
    if (q("geo4-engine").value === "osm" && !graph) {
      q("geo4-engine").value = "od";
      q("geo4-graph-status").textContent = T.graphFail;
    }
    runs();
    labels();
  });
  q("geo4-layer").addEventListener("change", draw);
  q("geo4-init").addEventListener("click", init);
  q("geo4-load-graph").addEventListener("click", loadGraph);
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
  const cached = cache();
  q("geo4-graph-status").textContent = cached ? T.coordsOk : T.ready;
  runs();
  labels();
  customs();
  policies();
  solve();
  if (cached) {
    draw();
    fit();
  }
}
boot();
