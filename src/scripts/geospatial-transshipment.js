import {
  graphOdMatrix,
  nearestGraphNode,
  parseOverpassGraph,
} from "../lib/geospatial/decisionEngine.js";
import { reconstructGraphPath } from "../lib/geospatial/pathTools.js";

const D = globalThis.document;
const F = (...args) => globalThis.fetch(...args);

function minCostFlow({ factories, warehouses, demands, fwCosts, wdCosts, factoryCapacity, warehouseCapacity }) {
  const source = 0;
  const factoryStart = 1;
  const warehouseStart = factoryStart + factories.length;
  const demandStart = warehouseStart + warehouses.length;
  const sink = demandStart + demands.length;
  const count = sink + 1;
  const graph = Array.from({ length: count }, () => []);
  const forward = [];

  const addEdge = (from, to, capacity, cost, meta = null) => {
    const a = { to, rev: graph[to].length, capacity, cost, initial: capacity, meta };
    const b = { to: from, rev: graph[from].length, capacity: 0, cost: -cost, initial: 0, meta: null };
    graph[from].push(a);
    graph[to].push(b);
    if (meta) forward.push({ from, edge: a });
  };

  factories.forEach((_, index) => addEdge(source, factoryStart + index, factoryCapacity, 0));
  factories.forEach((_, fi) => warehouses.forEach((__, wi) => {
    if (Number.isFinite(fwCosts[fi]?.[wi])) {
      addEdge(factoryStart + fi, warehouseStart + wi, Infinity, fwCosts[fi][wi], { stage: "fw", fi, wi });
    }
  }));
  warehouses.forEach((_, wi) => {
    // Node-splitting preserves a warehouse throughput capacity.
    // The outbound total is constrained separately through the demand arcs below
    // by tracking aggregate residual throughput after every augmentation.
    demands.forEach((__, di) => {
      if (Number.isFinite(wdCosts[wi]?.[di])) {
        addEdge(warehouseStart + wi, demandStart + di, warehouseCapacity, wdCosts[wi][di], { stage: "wd", wi, di });
      }
    });
  });
  demands.forEach((demand, di) => addEdge(demandStart + di, sink, demand.demand, 0));

  const totalDemand = demands.reduce((sum, item) => sum + item.demand, 0);
  const warehouseUsed = Array(warehouses.length).fill(0);
  let flow = 0;
  let cost = 0;
  const parentNode = Array(count).fill(-1);
  const parentEdge = Array(count).fill(-1);

  while (flow + 1e-9 < totalDemand) {
    const distance = Array(count).fill(Infinity);
    distance[source] = 0;
    parentNode.fill(-1);
    parentEdge.fill(-1);
    // Bellman-Ford is sufficient for this small, browser-side residual graph and
    // correctly handles reverse edges with negative residual costs.
    for (let iteration = 0; iteration < count - 1; iteration += 1) {
      let changed = false;
      for (let from = 0; from < count; from += 1) {
        if (!Number.isFinite(distance[from])) continue;
        for (let ei = 0; ei < graph[from].length; ei += 1) {
          const edge = graph[from][ei];
          if (!(edge.capacity > 1e-9)) continue;
          const candidate = distance[from] + edge.cost;
          if (candidate + 1e-9 < distance[edge.to]) {
            distance[edge.to] = candidate;
            parentNode[edge.to] = from;
            parentEdge[edge.to] = ei;
            changed = true;
          }
        }
      }
      if (!changed) break;
    }
    if (!Number.isFinite(distance[sink])) break;

    let amount = totalDemand - flow;
    let node = sink;
    let warehouseIndex = -1;
    while (node !== source) {
      const from = parentNode[node];
      if (from < 0) { amount = 0; break; }
      const edge = graph[from][parentEdge[node]];
      amount = Math.min(amount, edge.capacity);
      if (from >= warehouseStart && from < demandStart && node >= demandStart && node < sink) {
        warehouseIndex = from - warehouseStart;
      }
      node = from;
    }
    if (warehouseIndex >= 0) amount = Math.min(amount, warehouseCapacity - warehouseUsed[warehouseIndex]);
    if (!(amount > 1e-9)) {
      // Saturated warehouse: disable its remaining outbound arcs for this solve.
      if (warehouseIndex >= 0) {
        for (const edge of graph[warehouseStart + warehouseIndex]) {
          if (edge.to >= demandStart && edge.to < sink) edge.capacity = 0;
        }
        continue;
      }
      break;
    }

    node = sink;
    while (node !== source) {
      const from = parentNode[node];
      const edge = graph[from][parentEdge[node]];
      edge.capacity -= amount;
      graph[node][edge.rev].capacity += amount;
      node = from;
    }
    if (warehouseIndex >= 0) warehouseUsed[warehouseIndex] += amount;
    flow += amount;
    cost += amount * distance[sink];
  }

  const fw = [];
  const wd = [];
  for (const item of forward) {
    const used = Number.isFinite(item.edge.initial) ? item.edge.initial - item.edge.capacity : graph[item.edge.to][item.edge.rev].capacity;
    if (!(used > 1e-6)) continue;
    if (item.edge.meta.stage === "fw") fw.push({ ...item.edge.meta, flow: used });
    if (item.edge.meta.stage === "wd") wd.push({ ...item.edge.meta, flow: used });
  }
  return { feasible: flow + 1e-6 >= totalDemand, flow, totalDemand, cost, fw, wd, warehouseUsed };
}

function boot() {
  const root = D?.getElementById("geo-v4");
  const editorBlock = D?.getElementById("geo4-custom-list")?.closest(".geo4__block");
  const L = globalThis.L;
  if (!root || !editorBlock || !L) {
    globalThis.setTimeout(boot, 80);
    return;
  }
  if (root.dataset.transshipmentReady === "true") return;
  root.dataset.transshipmentReady = "true";

  const zh = (root.dataset.locale || "zh") === "zh";
  const copy = zh ? {
    title: "两级转运网络",
    run: "运行 Factory → Warehouse → Demand",
    note: "708 转运扩展：工厂供给 → 当前开启仓库 → 需求点；道路成本来自当前路网引擎与当前扰动情景。",
    needFactory: "至少需要一个 Factory。可用地址输入或地图点击新增。",
    needWarehouse: "请先运行主模型，确保至少有一个开启的 Warehouse。",
    solving: "正在求解两级道路转运…",
    feasible: "两级转运可行",
    infeasible: "两级转运不可行：工厂或仓库容量不足，或当前路网无法满足全部需求。",
    factories: "工厂",
    warehouses: "仓库",
    flow: "完成流量",
    cost: "道路转运成本",
  } : {
    title: "Two-Echelon Transshipment",
    run: "Run Factory → Warehouse → Demand",
    note: "BUSINFO 708 transshipment extension: factory supply → currently open warehouses → demand nodes, using the active road engine and disruption scenario.",
    needFactory: "At least one Factory is required. Add one by address or map click.",
    needWarehouse: "Run the main model first so at least one Warehouse is open.",
    solving: "Solving two-echelon road transshipment…",
    feasible: "Two-echelon transshipment is feasible",
    infeasible: "Two-echelon transshipment is infeasible: factory/warehouse capacity or current road access cannot satisfy all demand.",
    factories: "Factories",
    warehouses: "Warehouses",
    flow: "Flow served",
    cost: "Road transshipment cost",
  };

  const style = D.createElement("style");
  style.textContent = `
    .geo4__transshipment{margin-top:.75rem;padding-top:.68rem;border-top:1px solid rgba(98,236,255,.16)}.geo4__trans-head{display:flex;justify-content:space-between;align-items:center;gap:.5rem}.geo4__trans-head span{color:#62ecff;font:700 .5rem monospace;letter-spacing:.1em}.geo4__trans-head strong{font-size:.65rem}.geo4__trans-run{width:100%;margin-top:.45rem;border-color:rgba(98,236,255,.3)!important;color:#bdefff!important}.geo4__trans-note{margin:.4rem 0;color:#698892;font-size:.52rem;line-height:1.42}.geo4__trans-kpis{display:grid;grid-template-columns:1fr 1fr;gap:.3rem;margin-top:.45rem}.geo4__trans-kpis div{padding:.34rem .38rem;border:1px solid rgba(98,236,255,.11);background:rgba(8,35,46,.42)}.geo4__trans-kpis span{display:block;color:#718e98;font-size:.44rem}.geo4__trans-kpis b{display:block;margin-top:.13rem;color:#e9fbfe;font:700 .62rem monospace}.geo4__trans-status{margin:.4rem 0 0;color:#718e98;font-size:.53rem;line-height:1.4}.geo4__trans-status.ok{color:#d8ff6b}.geo4__trans-status.bad{color:#ff759a}.geo4__transshipment-route.stage-fw{filter:drop-shadow(0 0 4px rgba(255,204,102,.35))}.geo4__transshipment-route.stage-wd{filter:drop-shadow(0 0 4px rgba(98,236,255,.32))}
  `;
  D.head.appendChild(style);

  const panel = D.createElement("section");
  panel.className = "geo4__transshipment";
  panel.innerHTML = `<div class="geo4__trans-head"><span>TRANSSHIPMENT / LP</span><strong>${copy.title}</strong></div><button type="button" class="geo4__trans-run">${copy.run}</button><p class="geo4__trans-note">${copy.note}</p><div class="geo4__trans-kpis"><div><span>${copy.factories}</span><b data-trans-f>—</b></div><div><span>${copy.warehouses}</span><b data-trans-w>—</b></div><div><span>${copy.flow}</span><b data-trans-flow>—</b></div><div><span>${copy.cost}</span><b data-trans-cost>—</b></div></div><p class="geo4__trans-status">—</p>`;
  editorBlock.appendChild(panel);
  const button = panel.querySelector(".geo4__trans-run");
  const status = panel.querySelector(".geo4__trans-status");
  const fOut = panel.querySelector("[data-trans-f]");
  const wOut = panel.querySelector("[data-trans-w]");
  const flowOut = panel.querySelector("[data-trans-flow]");
  const costOut = panel.querySelector("[data-trans-cost]");

  const state = { map: null, graph: null, layers: [], routeCache: new Map() };
  function captureMap(layer) {
    if (state.map || typeof layer?.addTo !== "function") return;
    const original = layer.addTo;
    layer.addTo = function capture(target) {
      const result = original.call(this, target);
      if (!state.map && target?._map) state.map = target._map;
      return result;
    };
  }
  if (!L.circleMarker.__acidchTransshipmentWrapped) {
    const original = L.circleMarker;
    const wrapped = (...args) => { const layer = original.apply(L, args); captureMap(layer); return layer; };
    wrapped.__acidchTransshipmentWrapped = true;
    wrapped.__acidchTransshipmentOriginal = original;
    L.circleMarker = wrapped;
  }

  const originalFetch = globalThis.fetch;
  if (typeof originalFetch === "function" && !originalFetch.__acidchTransshipmentWrapped) {
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
    wrappedFetch.__acidchTransshipmentWrapped = true;
    wrappedFetch.__acidchTransshipmentOriginal = originalFetch;
    globalThis.fetch = wrappedFetch;
  }

  const clear = () => {
    state.layers.forEach((layer) => { try { layer.remove(); } catch { /* visual cleanup */ } });
    state.layers = [];
  };

  function entities() {
    if (!state.map) return { factories: [], warehouses: [], demands: [] };
    const open = new Set([...D.querySelectorAll("#geo4-open-list strong")].map((node) => node.textContent?.trim()).filter(Boolean));
    const factories = [];
    const warehouses = [];
    const demands = [];
    for (const layer of Object.values(state.map._layers || {})) {
      if (typeof layer?.getLatLng !== "function" || typeof layer?.getTooltip !== "function") continue;
      const content = String(layer.getTooltip()?.getContent?.() || "");
      const name = content.match(/<strong>(.*?)<\/strong>/)?.[1]?.trim();
      const point = layer.getLatLng?.();
      if (!name || !point) continue;
      if (/<br>factory/i.test(content)) factories.push({ name, lat: point.lat, lon: point.lng });
      else if (/<br>warehouse/i.test(content) && open.has(name)) warehouses.push({ name, lat: point.lat, lon: point.lng });
      else if (/Demand:\s*[\d,.]+/i.test(content)) {
        const demand = Number(content.match(/Demand:\s*([\d,.]+)/i)?.[1]?.replaceAll(",", "")) || 0;
        demands.push({ name, lat: point.lat, lon: point.lng, demand: demand * Number(D.getElementById("geo4-demand-multiplier")?.value || 1) });
      }
    }
    return { factories, warehouses, demands };
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

  async function osrmMatrix(sources, destinations) {
    const points = [...sources, ...destinations];
    const coords = points.map((point) => `${point.lon},${point.lat}`).join(";");
    const src = sources.map((_, index) => index).join(";");
    const dst = destinations.map((_, index) => index + sources.length).join(";");
    const response = await F(`https://router.project-osrm.org/table/v1/driving/${coords}?sources=${src}&destinations=${dst}&annotations=distance,duration`);
    const data = await response.json();
    if (!response.ok || !Array.isArray(data.durations)) throw new Error("OSRM table unavailable");
    return { matrix: data.durations.map((row) => row.map((value) => Number.isFinite(value) ? value / 60 : Infinity)), scenario: null };
  }

  function roadMatrix(sources, destinations) {
    if (D.getElementById("geo4-engine")?.value !== "osm" || !state.graph) return null;
    const result = graphOdMatrix({ graph: state.graph, sources, destinations, scenarioParams: scenarioParams(), metric: "time" });
    return { matrix: result.matrix, scenario: result.scenario };
  }

  async function osrmRoute(a, b) {
    const key = `${a.lon.toFixed(5)},${a.lat.toFixed(5)};${b.lon.toFixed(5)},${b.lat.toFixed(5)}`;
    if (state.routeCache.has(key)) return state.routeCache.get(key);
    const response = await F(`https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=full&geometries=geojson&steps=false`);
    const data = await response.json();
    if (!response.ok || !data.routes?.[0]) throw new Error("OSRM route unavailable");
    const coords = data.routes[0].geometry.coordinates.map(([lon, lat]) => [lat, lon]);
    state.routeCache.set(key, coords);
    return coords;
  }

  function graphRoute(a, b, scenario) {
    const source = nearestGraphNode(state.graph, a);
    const target = nearestGraphNode(state.graph, b);
    if (!source?.nodeId || !target?.nodeId) return [];
    const path = reconstructGraphPath(state.graph, source.nodeId, target.nodeId, scenario, "time");
    return path?.coordinates?.map((point) => [point.lat, point.lon]) || [];
  }

  async function drawFlow(a, b, flow, scenario, stage) {
    const coords = scenario ? graphRoute(a, b, scenario) : await osrmRoute(a, b);
    if (!state.map || coords.length < 2) return;
    const colour = stage === "fw" ? "#ffcc66" : "#62ecff";
    const layer = L.polyline(coords, { color: colour, weight: 1.4 + Math.min(4, Math.sqrt(flow) / 18), opacity: .75, className: `geo4__transshipment-route stage-${stage}` }).bindTooltip(`${a.name} → ${b.name}<br>Flow: ${flow.toFixed(0)} · ${stage === "fw" ? "Factory → Warehouse" : "Warehouse → Demand"}`).addTo(state.map);
    state.layers.push(layer);
  }

  async function run() {
    clear();
    const { factories, warehouses, demands } = entities();
    fOut.textContent = String(factories.length);
    wOut.textContent = String(warehouses.length);
    if (!factories.length) { status.textContent = copy.needFactory; status.className = "geo4__trans-status bad"; return; }
    if (!warehouses.length) { status.textContent = copy.needWarehouse; status.className = "geo4__trans-status bad"; return; }
    button.disabled = true;
    status.textContent = copy.solving;
    status.className = "geo4__trans-status";
    try {
      const fw = roadMatrix(factories, warehouses) || await osrmMatrix(factories, warehouses);
      const wd = roadMatrix(warehouses, demands) || await osrmMatrix(warehouses, demands);
      // Both calls derive the same deterministic scenario from the same inputs/seed.
      const scenario = fw.scenario || wd.scenario;
      const capacity = Math.max(1, Number(D.getElementById("geo4-facility-capacity")?.value || 6000));
      const transportCost = Math.max(0, Number(D.getElementById("geo4-transport-cost")?.value || .72));
      const solved = minCostFlow({ factories, warehouses, demands, fwCosts: fw.matrix.map((row) => row.map((value) => value * transportCost)), wdCosts: wd.matrix.map((row) => row.map((value) => value * transportCost)), factoryCapacity: capacity, warehouseCapacity: capacity });
      flowOut.textContent = `${solved.flow.toFixed(0)} / ${solved.totalDemand.toFixed(0)}`;
      costOut.textContent = `NZ$${solved.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
      status.textContent = solved.feasible ? copy.feasible : copy.infeasible;
      status.className = `geo4__trans-status ${solved.feasible ? "ok" : "bad"}`;
      for (const arc of solved.fw.filter((item) => item.flow > 1e-6)) await drawFlow(factories[arc.fi], warehouses[arc.wi], arc.flow, scenario, "fw");
      for (const arc of solved.wd.filter((item) => item.flow > 1e-6)) await drawFlow(warehouses[arc.wi], demands[arc.di], arc.flow, scenario, "wd");
    } catch (error) {
      globalThis.console?.warn("[Transshipment]", error);
      status.textContent = copy.infeasible;
      status.className = "geo4__trans-status bad";
    } finally {
      button.disabled = false;
    }
  }

  button.addEventListener("click", run);
  for (const id of ["geo4-run", "geo4-reset", "geo4-engine", "geo4-road-mode", "geo4-demand-multiplier", "geo4-facility-capacity", "geo4-transport-cost"]) {
    const element = D.getElementById(id);
    element?.addEventListener("click", clear);
    element?.addEventListener("change", clear);
  }
}

boot();
