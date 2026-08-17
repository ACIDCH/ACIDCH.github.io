import {
  graphOdMatrix,
  nearestGraphNode,
  parseOverpassGraph,
} from "../lib/geospatial/decisionEngine.js";
import { reconstructGraphPath } from "../lib/geospatial/pathTools.js";

const D = globalThis.document;
const F = (...args) => globalThis.fetch(...args);

function solveTwoEchelon({ factories, warehouses, demands, fwCosts, wdCosts, factoryCapacity, warehouseCapacity }) {
  const source = 0;
  const f0 = 1;
  const wi0 = f0 + factories.length;
  const wo0 = wi0 + warehouses.length;
  const d0 = wo0 + warehouses.length;
  const sink = d0 + demands.length;
  const nodeCount = sink + 1;
  const graph = Array.from({ length: nodeCount }, () => []);
  const tracked = [];
  const totalDemand = demands.reduce((sum, item) => sum + item.demand, 0);

  const addEdge = (from, to, capacity, cost, meta = null) => {
    const forward = { to, rev: graph[to].length, capacity, initial: capacity, cost, meta };
    const reverse = { to: from, rev: graph[from].length, capacity: 0, initial: 0, cost: -cost, meta: null };
    graph[from].push(forward);
    graph[to].push(reverse);
    if (meta) tracked.push(forward);
  };

  factories.forEach((_, fi) => addEdge(source, f0 + fi, factoryCapacity, 0));
  warehouses.forEach((_, wi) => addEdge(wi0 + wi, wo0 + wi, warehouseCapacity, 0, { stage: "throughput", wi }));
  factories.forEach((_, fi) => warehouses.forEach((__, wi) => {
    const cost = fwCosts[fi]?.[wi];
    if (Number.isFinite(cost)) addEdge(f0 + fi, wi0 + wi, totalDemand, cost, { stage: "fw", fi, wi });
  }));
  warehouses.forEach((_, wi) => demands.forEach((__, di) => {
    const cost = wdCosts[wi]?.[di];
    if (Number.isFinite(cost)) addEdge(wo0 + wi, d0 + di, totalDemand, cost, { stage: "wd", wi, di });
  }));
  demands.forEach((item, di) => addEdge(d0 + di, sink, item.demand, 0));

  let totalFlow = 0;
  let totalCost = 0;
  const parentNode = Array(nodeCount).fill(-1);
  const parentEdge = Array(nodeCount).fill(-1);

  while (totalFlow + 1e-9 < totalDemand) {
    const dist = Array(nodeCount).fill(Infinity);
    dist[source] = 0;
    parentNode.fill(-1);
    parentEdge.fill(-1);
    for (let iteration = 0; iteration < nodeCount - 1; iteration += 1) {
      let changed = false;
      for (let from = 0; from < nodeCount; from += 1) {
        if (!Number.isFinite(dist[from])) continue;
        for (let ei = 0; ei < graph[from].length; ei += 1) {
          const edge = graph[from][ei];
          if (!(edge.capacity > 1e-9)) continue;
          const candidate = dist[from] + edge.cost;
          if (candidate + 1e-9 < dist[edge.to]) {
            dist[edge.to] = candidate;
            parentNode[edge.to] = from;
            parentEdge[edge.to] = ei;
            changed = true;
          }
        }
      }
      if (!changed) break;
    }
    if (!Number.isFinite(dist[sink])) break;

    let amount = totalDemand - totalFlow;
    for (let node = sink; node !== source;) {
      const from = parentNode[node];
      if (from < 0) { amount = 0; break; }
      amount = Math.min(amount, graph[from][parentEdge[node]].capacity);
      node = from;
    }
    if (!(amount > 1e-9)) break;

    for (let node = sink; node !== source;) {
      const from = parentNode[node];
      const edge = graph[from][parentEdge[node]];
      edge.capacity -= amount;
      graph[node][edge.rev].capacity += amount;
      node = from;
    }
    totalFlow += amount;
    totalCost += amount * dist[sink];
  }

  const used = (stage) => tracked
    .filter((edge) => edge.meta.stage === stage && edge.initial - edge.capacity > 1e-6)
    .map((edge) => ({ ...edge.meta, flow: edge.initial - edge.capacity }));
  return {
    feasible: totalFlow + 1e-6 >= totalDemand,
    flow: totalFlow,
    totalDemand,
    cost: totalCost,
    fw: used("fw"),
    wd: used("wd"),
    throughput: used("throughput"),
  };
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
  const t = zh ? {
    title: "两级转运网络",
    run: "运行 Factory → Warehouse → Demand",
    note: "708 转运扩展：工厂供给 → 当前开启仓库 → 需求点。仓库采用严格总吞吐容量约束，道路成本来自当前路网与扰动情景。",
    needFactory: "至少需要一个 Factory。可用地址输入或地图点击新增。",
    needWarehouse: "请先运行主模型，确保至少有一个开启的 Warehouse。",
    solving: "正在求解两级道路转运…",
    feasible: "两级转运可行",
    infeasible: "两级转运不可行：工厂/仓库容量或当前道路可达性不足。",
    factories: "工厂", warehouses: "仓库", flow: "完成流量", cost: "转运成本",
  } : {
    title: "Two-Echelon Transshipment",
    run: "Run Factory → Warehouse → Demand",
    note: "BUSINFO 708 transshipment extension: factory supply → currently open warehouses → demand, with strict warehouse throughput capacity and the active road scenario.",
    needFactory: "At least one Factory is required. Add one by address or map click.",
    needWarehouse: "Run the main model first so at least one Warehouse is open.",
    solving: "Solving two-echelon road transshipment…",
    feasible: "Two-echelon transshipment is feasible",
    infeasible: "Two-echelon transshipment is infeasible: factory/warehouse capacity or road accessibility is insufficient.",
    factories: "Factories", warehouses: "Warehouses", flow: "Flow served", cost: "Transshipment cost",
  };

  const style = D.createElement("style");
  style.textContent = `
    .geo4__transshipment{margin-top:.75rem;padding-top:.68rem;border-top:1px solid rgba(98,236,255,.16)}.geo4__trans-head{display:flex;justify-content:space-between;align-items:center;gap:.5rem}.geo4__trans-head span{color:#62ecff;font:700 .5rem monospace;letter-spacing:.1em}.geo4__trans-head strong{font-size:.65rem}.geo4__trans-run{width:100%;margin-top:.45rem;border-color:rgba(98,236,255,.3)!important;color:#bdefff!important}.geo4__trans-note{margin:.4rem 0;color:#698892;font-size:.52rem;line-height:1.42}.geo4__trans-kpis{display:grid;grid-template-columns:1fr 1fr;gap:.3rem;margin-top:.45rem}.geo4__trans-kpis div{padding:.34rem .38rem;border:1px solid rgba(98,236,255,.11);background:rgba(8,35,46,.42)}.geo4__trans-kpis span{display:block;color:#718e98;font-size:.44rem}.geo4__trans-kpis b{display:block;margin-top:.13rem;color:#e9fbfe;font:700 .62rem monospace}.geo4__trans-status{margin:.4rem 0 0;color:#718e98;font-size:.53rem;line-height:1.4}.geo4__trans-status.ok{color:#d8ff6b}.geo4__trans-status.bad{color:#ff759a}.geo4__transshipment-route.stage-fw{filter:drop-shadow(0 0 5px rgba(255,204,102,.4))}.geo4__transshipment-route.stage-wd{filter:drop-shadow(0 0 5px rgba(98,236,255,.35))}
  `;
  D.head.appendChild(style);
  const panel = D.createElement("section");
  panel.className = "geo4__transshipment";
  panel.innerHTML = `<div class="geo4__trans-head"><span>TRANSSHIPMENT / LP</span><strong>${t.title}</strong></div><button type="button" class="geo4__trans-run">${t.run}</button><p class="geo4__trans-note">${t.note}</p><div class="geo4__trans-kpis"><div><span>${t.factories}</span><b data-trans-f>—</b></div><div><span>${t.warehouses}</span><b data-trans-w>—</b></div><div><span>${t.flow}</span><b data-trans-flow>—</b></div><div><span>${t.cost}</span><b data-trans-cost>—</b></div></div><p class="geo4__trans-status">—</p>`;
  editorBlock.appendChild(panel);

  const button = panel.querySelector(".geo4__trans-run");
  const status = panel.querySelector(".geo4__trans-status");
  const out = {
    f: panel.querySelector("[data-trans-f]"), w: panel.querySelector("[data-trans-w]"),
    flow: panel.querySelector("[data-trans-flow]"), cost: panel.querySelector("[data-trans-cost]"),
  };
  const state = { map: null, graph: null, layers: [], routeCache: new Map() };

  function captureMap(layer) {
    if (state.map || typeof layer?.addTo !== "function") return;
    const original = layer.addTo;
    layer.addTo = function transCapture(target) {
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
    state.layers.forEach((layer) => { try { layer.remove(); } catch { /* presentation cleanup */ } });
    state.layers = [];
  };

  function entities() {
    if (!state.map) return { factories: [], warehouses: [], demands: [] };
    const open = new Set([...D.querySelectorAll("#geo4-open-list strong")].map((n) => n.textContent?.trim()).filter(Boolean));
    const factories = [], warehouses = [], demands = [];
    for (const layer of Object.values(state.map._layers || {})) {
      if (typeof layer?.getLatLng !== "function" || typeof layer?.getTooltip !== "function") continue;
      const content = String(layer.getTooltip()?.getContent?.() || "");
      const name = content.match(/<strong>(.*?)<\/strong>/)?.[1]?.trim();
      const point = layer.getLatLng?.();
      if (!name || !point) continue;
      if (/<br>factory/i.test(content)) factories.push({ name, lat: point.lat, lon: point.lng });
      else if (/<br>warehouse/i.test(content) && open.has(name)) warehouses.push({ name, lat: point.lat, lon: point.lng });
      else if (/Demand:\s*[\d,.]+/i.test(content)) {
        const base = Number(content.match(/Demand:\s*([\d,.]+)/i)?.[1]?.replaceAll(",", "")) || 0;
        demands.push({ name, lat: point.lat, lon: point.lng, demand: base * Number(D.getElementById("geo4-demand-multiplier")?.value || 1) });
      }
    }
    return { factories, warehouses, demands };
  }

  const scenarioParams = () => ({
    mode: D.getElementById("geo4-road-mode")?.value || "baseline",
    congestionSeverity: Number(D.getElementById("geo4-congestion")?.value || 0) / 100,
    congestionShare: Number(D.getElementById("geo4-congestion-share")?.value || 0) / 100,
    closureShare: Number(D.getElementById("geo4-closure")?.value || 0) / 100,
    improvement: .25, improvementShare: .3,
    newRoadLinks: Number(D.getElementById("geo4-new-roads-out")?.textContent || 0),
    maxNewRoadKm: .65, newRoadSpeedKph: 50,
    seed: Number(D.getElementById("geo4-seed")?.value || 708709),
  });

  async function osrmMatrix(sources, destinations) {
    const points = [...sources, ...destinations];
    const coords = points.map((p) => `${p.lon},${p.lat}`).join(";");
    const src = sources.map((_, i) => i).join(";");
    const dst = destinations.map((_, i) => i + sources.length).join(";");
    const response = await F(`https://router.project-osrm.org/table/v1/driving/${coords}?sources=${src}&destinations=${dst}&annotations=duration`);
    const data = await response.json();
    if (!response.ok || !Array.isArray(data.durations)) throw new Error("OSRM table unavailable");
    return { matrix: data.durations.map((row) => row.map((value) => Number.isFinite(value) ? value / 60 : Infinity)), scenario: null };
  }

  function currentMatrix(sources, destinations) {
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
    const source = nearestGraphNode(state.graph, a), target = nearestGraphNode(state.graph, b);
    if (!source?.nodeId || !target?.nodeId) return [];
    return reconstructGraphPath(state.graph, source.nodeId, target.nodeId, scenario, "time")?.coordinates?.map((p) => [p.lat, p.lon]) || [];
  }
  async function drawArc(a, b, flow, scenario, stage) {
    const coords = scenario ? graphRoute(a, b, scenario) : await osrmRoute(a, b);
    if (!state.map || coords.length < 2) return;
    const colour = stage === "fw" ? "#ffcc66" : "#62ecff";
    const layer = L.polyline(coords, { color: colour, weight: 1.5 + Math.min(4, Math.sqrt(flow) / 18), opacity: .76, className: `geo4__transshipment-route stage-${stage}` })
      .bindTooltip(`${a.name} → ${b.name}<br>Flow: ${flow.toFixed(0)} · ${stage === "fw" ? "Factory → Warehouse" : "Warehouse → Demand"}`).addTo(state.map);
    state.layers.push(layer);
  }

  async function run() {
    clear();
    const { factories, warehouses, demands } = entities();
    out.f.textContent = String(factories.length); out.w.textContent = String(warehouses.length);
    if (!factories.length) { status.textContent = t.needFactory; status.className = "geo4__trans-status bad"; return; }
    if (!warehouses.length) { status.textContent = t.needWarehouse; status.className = "geo4__trans-status bad"; return; }
    button.disabled = true; status.textContent = t.solving; status.className = "geo4__trans-status";
    try {
      const fw = currentMatrix(factories, warehouses) || await osrmMatrix(factories, warehouses);
      const wd = currentMatrix(warehouses, demands) || await osrmMatrix(warehouses, demands);
      const scenario = fw.scenario || wd.scenario;
      const capacity = Math.max(1, Number(D.getElementById("geo4-facility-capacity")?.value || 6000));
      const unitCost = Math.max(0, Number(D.getElementById("geo4-transport-cost")?.value || .72));
      const solved = solveTwoEchelon({
        factories, warehouses, demands,
        fwCosts: fw.matrix.map((row) => row.map((value) => value * unitCost)),
        wdCosts: wd.matrix.map((row) => row.map((value) => value * unitCost)),
        factoryCapacity: capacity, warehouseCapacity: capacity,
      });
      out.flow.textContent = `${solved.flow.toFixed(0)} / ${solved.totalDemand.toFixed(0)}`;
      out.cost.textContent = `NZ$${solved.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
      status.textContent = solved.feasible ? t.feasible : t.infeasible;
      status.className = `geo4__trans-status ${solved.feasible ? "ok" : "bad"}`;
      for (const arc of solved.fw) await drawArc(factories[arc.fi], warehouses[arc.wi], arc.flow, scenario, "fw");
      for (const arc of solved.wd) await drawArc(warehouses[arc.wi], demands[arc.di], arc.flow, scenario, "wd");
    } catch (error) {
      globalThis.console?.warn("[Transshipment]", error);
      status.textContent = t.infeasible; status.className = "geo4__trans-status bad";
    } finally { button.disabled = false; }
  }

  button.addEventListener("click", run);
  for (const id of ["geo4-run", "geo4-reset", "geo4-engine", "geo4-road-mode", "geo4-demand-multiplier", "geo4-facility-capacity", "geo4-transport-cost"]) {
    const element = D.getElementById(id); element?.addEventListener("click", clear); element?.addEventListener("change", clear);
  }
}

boot();
