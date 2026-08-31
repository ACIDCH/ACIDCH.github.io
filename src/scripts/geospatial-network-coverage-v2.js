import {
  buildEdgeScenario,
  nearestGraphNode,
} from "../lib/geospatial/decisionEngine.js";
import { getGeospatialStore } from "../lib/geospatial/geospatialStore.js";
import { createDisruptionEvent } from "../lib/geospatial/disruptionEvents.js";

const D = globalThis.document;

class Heap {
  constructor() {
    this.a = [];
  }
  push(item) {
    const a = this.a;
    a.push(item);
    let i = a.length - 1;
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (a[p].cost <= item.cost) break;
      a[i] = a[p];
      i = p;
    }
    a[i] = item;
  }
  pop() {
    const a = this.a;
    if (!a.length) return null;
    const root = a[0],
      last = a.pop();
    if (a.length && last) {
      let i = 0;
      while (true) {
        const l = i * 2 + 1,
          r = l + 1;
        if (l >= a.length) break;
        const c = r < a.length && a[r].cost < a[l].cost ? r : l;
        if (a[c].cost >= last.cost) break;
        a[i] = a[c];
        i = c;
      }
      a[i] = last;
    }
    return root;
  }
  get size() {
    return this.a.length;
  }
}

function boundedDijkstra(graph, startNode, scenario, limitMin) {
  const dist = new Map([[String(startNode), 0]]);
  const heap = new Heap();
  heap.push({ node: String(startNode), cost: 0 });
  const shortcuts = new Map();
  for (const edge of scenario.shortcuts || []) {
    const from = String(edge.from);
    if (!shortcuts.has(from)) shortcuts.set(from, []);
    shortcuts.get(from).push(edge);
  }
  while (heap.size) {
    const current = heap.pop();
    if (!current || current.cost > limitMin) continue;
    if (current.cost > (dist.get(current.node) ?? Infinity) + 1e-9) continue;
    const outgoing = [
      ...(graph.adjacency.get(current.node) || []).map((edgeId) => graph.edges[edgeId]),
      ...(shortcuts.get(current.node) || []),
    ];
    for (const edge of outgoing) {
      if (!edge || scenario.disabled.has(edge.segmentKey)) continue;
      const baseMinutes = Number(edge.timeMin);
      if (!Number.isFinite(baseMinutes)) continue;
      const weight = baseMinutes * (scenario.factors.get(edge.segmentKey) || 1);
      const nextCost = current.cost + weight;
      if (nextCost > limitMin) continue;
      const to = String(edge.to);
      if (nextCost + 1e-9 < (dist.get(to) ?? Infinity)) {
        dist.set(to, nextCost);
        heap.push({ node: to, cost: nextCost });
      }
    }
  }
  return new Set(dist.keys());
}

function boot() {
  const root = D?.getElementById("geo-v4");
  const shell = root?.querySelector(".geo4__shell");
  const mapBox = D?.getElementById("geo4-map");
  const L = globalThis.L;
  if (!root || !shell || !mapBox || !L) {
    globalThis.setTimeout(boot, 80);
    return;
  }
  if (root.dataset.networkCoverageV2Ready === "true") return;
  root.dataset.networkCoverageV2Ready = "true";

  const zh = (root.dataset.locale || "zh") === "zh";
  const t = zh
    ? {
        title: "道路网络覆盖",
        waiting: "OSM 路网加载后计算真实时间可达范围。",
        threshold: "时间阈值",
        hubs: "服务设施",
        reachable: "可达节点",
        overlap: "重叠覆盖",
      }
    : {
        title: "Network Service Reach",
        waiting: "Load the OSM graph to calculate true time-based reachability.",
        threshold: "Time threshold",
        hubs: "Service facilities",
        reachable: "Reachable nodes",
        overlap: "Overlap coverage",
      };

  const style = D.createElement("style");
  style.textContent = `
    .geo4__coverage-canvas-v2{position:absolute;inset:0;z-index:375;width:100%;height:100%;pointer-events:none;mix-blend-mode:screen;opacity:0;transition:opacity .25s}.geo4__shell[data-analysis-layer="coverage"] .geo4__coverage-canvas-v2{opacity:1}
    .geo4__coverage-hud-v2{position:absolute;z-index:666;left:1rem;top:20.7rem;width:246px;padding:.58rem .66rem;border:1px solid rgba(216,255,107,.24);background:linear-gradient(135deg,rgba(4,19,28,.92),rgba(4,19,28,.76));backdrop-filter:blur(12px);box-shadow:0 13px 38px rgba(0,0,0,.2);pointer-events:none;opacity:.42;transition:opacity .25s}.geo4__shell[data-analysis-layer="coverage"] .geo4__coverage-hud-v2{opacity:1}.geo4__coverage-hud-v2>span{display:block;color:#d8ff6b;font:700 .5rem monospace;letter-spacing:.12em}.geo4__coverage-hud-v2>strong{display:block;margin-top:.24rem;color:#efffd0;font-size:.66rem}.geo4__coverage-hud-v2>small{display:block;margin-top:.2rem;color:#718e98;font-size:.52rem;line-height:1.4}.geo4__coverage-stats-v2{display:grid;grid-template-columns:1fr 1fr;gap:.3rem;margin-top:.52rem}.geo4__coverage-stats-v2 div{padding:.32rem .36rem;border:1px solid rgba(216,255,107,.11);background:rgba(27,46,33,.28)}.geo4__coverage-stats-v2 span{display:block;color:#728e96;font-size:.44rem}.geo4__coverage-stats-v2 b{display:block;margin-top:.13rem;color:#e9ffd1;font:700 .62rem monospace}.geo4__coverage-scale-v2{display:flex;align-items:center;gap:.35rem;margin-top:.45rem;color:#6d8992;font:600 .46rem monospace}.geo4__coverage-scale-v2 i{flex:1;height:4px;border-radius:99px;background:linear-gradient(90deg,rgba(98,236,255,.55),#62ecff 45%,#d8ff6b);box-shadow:0 0 12px rgba(216,255,107,.14)}
  `;
  D.head.appendChild(style);

  const canvas = D.createElement("canvas");
  canvas.className = "geo4__coverage-canvas-v2";
  canvas.setAttribute("aria-hidden", "true");
  mapBox.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const hud = D.createElement("section");
  hud.className = "geo4__coverage-hud-v2";
  hud.innerHTML = `<span>SERVICE AREA / DIJKSTRA</span><strong>${t.title}</strong><small data-detail>${t.waiting}</small><div class="geo4__coverage-stats-v2"><div><span>${t.threshold}</span><b data-threshold>—</b></div><div><span>${t.hubs}</span><b data-hubs>—</b></div><div><span>${t.reachable}</span><b data-reachable>—</b></div><div><span>${t.overlap}</span><b data-overlap>—</b></div></div><div class="geo4__coverage-scale-v2"><span>1×</span><i></i><span>2×+</span></div>`;
  shell.appendChild(hud);
  const ui = {
    detail: hud.querySelector("[data-detail]"),
    threshold: hud.querySelector("[data-threshold]"),
    hubs: hud.querySelector("[data-hubs]"),
    reachable: hud.querySelector("[data-reachable]"),
    overlap: hud.querySelector("[data-overlap]"),
  };
  const store = getGeospatialStore();
  const initial = store.getState();
  const state = {
    graph: initial.graph,
    map: initial.presentation.map,
    segments: [],
    sets: [],
    coveredSegments: [],
    key: "",
    pending: false,
  };
  if (state.graph) state.segments = prepare(state.graph);
  state.map?.on("move zoom resize", scheduleDraw);

  function params() {
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
  }

  function selectedFacilities() {
    const snapshot = store.getState();
    if (snapshot.freshness.main !== "current") return [];
    return snapshot.mainSolution.selected
      .map((index) => snapshot.entities.facilities[index])
      .filter((facility) => facility?.point)
      .map((facility) => ({ name: facility.name, ...facility.point }));
  }

  function prepare(graph) {
    const unique = new Map();
    for (const edge of graph.edges || []) {
      if (unique.has(edge.segmentKey)) continue;
      const a = graph.nodes.get(String(edge.from)),
        b = graph.nodes.get(String(edge.to));
      if (a && b)
        unique.set(edge.segmentKey, {
          from: String(edge.from),
          to: String(edge.to),
          a,
          b,
        });
    }
    return [...unique.values()];
  }

  function recalc() {
    const engine = D.getElementById("geo4-engine")?.value || "od";
    const layer = D.getElementById("geo4-layer")?.value || "network";
    if (!state.graph || !state.map || engine !== "osm" || layer !== "coverage") {
      state.sets = [];
      return;
    }
    const threshold = Math.max(
      1,
      Number(D.getElementById("geo4-threshold")?.value || 30),
    );
    const facilities = selectedFacilities();
    const scenarioParams = params();
    const key = JSON.stringify({
      threshold,
      facilities: facilities.map((p) => [p.name, p.lat, p.lon]),
      scenarioParams,
    });
    if (key === state.key) return;
    state.key = key;
    const scenario = buildEdgeScenario(state.graph, scenarioParams);
    state.sets = facilities.map((point) => {
      const snap = nearestGraphNode(state.graph, point);
      return snap?.nodeId
        ? boundedDijkstra(state.graph, snap.nodeId, scenario, threshold)
        : new Set();
    });
    state.coveredSegments = state.segments.flatMap((segment) => {
      const coverage = state.sets.reduce(
        (sum, set) => sum + (set.has(segment.from) && set.has(segment.to) ? 1 : 0),
        0,
      );
      return coverage ? [{ ...segment, coverage }] : [];
    });
    const union = new Set(state.sets.flatMap((set) => [...set]));
    let overlap = 0;
    for (const node of union)
      if (state.sets.reduce((sum, set) => sum + (set.has(node) ? 1 : 0), 0) >= 2)
        overlap += 1;
    ui.detail.textContent = `${facilities.length} ${t.hubs.toLowerCase()} · ${threshold.toFixed(0)} min`;
    ui.threshold.textContent = `${threshold.toFixed(0)} min`;
    ui.hubs.textContent = String(facilities.length);
    ui.reachable.textContent = union.size.toLocaleString();
    ui.overlap.textContent = union.size
      ? `${Math.round((overlap / union.size) * 100)}%`
      : "0%";
  }

  function fit() {
    const rect = mapBox.getBoundingClientRect(),
      dpr = Math.min(2, globalThis.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(rect.width * dpr)),
      h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    }
    return { rect, dpr };
  }

  function draw() {
    state.pending = false;
    if (!ctx) return;
    const { rect, dpr } = fit();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    const engine = D.getElementById("geo4-engine")?.value || "od",
      layer = D.getElementById("geo4-layer")?.value || "network";
    if (!state.graph || !state.map || engine !== "osm" || layer !== "coverage") {
      if (engine !== "osm") ui.detail.textContent = t.waiting;
      return;
    }
    recalc();
    if (!state.sets.length) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    let drawn = 0;
    for (const segment of state.coveredSegments) {
      const p1 = state.map.latLngToContainerPoint([segment.a.lat, segment.a.lon]),
        p2 = state.map.latLngToContainerPoint([segment.b.lat, segment.b.lon]);
      const overlap = segment.coverage >= 2;
      ctx.strokeStyle = overlap ? "rgba(216,255,107,.96)" : "rgba(98,236,255,.82)";
      ctx.globalAlpha = overlap ? 0.7 : 0.34;
      ctx.lineWidth = overlap ? 2.2 : 1.15;
      ctx.shadowColor = overlap ? "rgba(216,255,107,.75)" : "rgba(98,236,255,.45)";
      ctx.shadowBlur = overlap ? 8 : 3;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      drawn += 1;
      if (drawn > 18000) break;
    }
    ctx.restore();
  }
  function scheduleDraw() {
    if (state.pending) return;
    state.pending = true;
    globalThis.requestAnimationFrame(draw);
  }

  function invalidateCoverage() {
    state.key = "";
    scheduleDraw();
  }

  store.subscribe((snapshot, reason) => {
    const nextMap = snapshot.presentation.map;
    if (nextMap && nextMap !== state.map) {
      state.map = nextMap;
      state.map.on("move zoom resize", scheduleDraw);
    }
    if (snapshot.graph && snapshot.graph !== state.graph) {
      state.graph = snapshot.graph;
      state.segments = prepare(snapshot.graph);
    }
    if (
      ["commit:mainSolution", "graph", "entities"].some((value) =>
        String(reason).includes(value),
      )
    )
      invalidateCoverage();
  });

  for (const id of ["geo4-layer"]) {
    const el = D.getElementById(id);
    el?.addEventListener("input", scheduleDraw);
    el?.addEventListener("change", scheduleDraw);
  }
  for (const id of [
    "geo4-engine",
    "geo4-threshold",
    "geo4-road-mode",
    "geo4-event",
    "geo4-congestion",
    "geo4-congestion-share",
    "geo4-closure",
    "geo4-seed",
    "geo4-run",
  ]) {
    const el = D.getElementById(id);
    el?.addEventListener("input", invalidateCoverage);
    el?.addEventListener("change", invalidateCoverage);
    el?.addEventListener("click", () => globalThis.setTimeout(invalidateCoverage, 40));
  }
  D.querySelectorAll('[data-step="newRoads"]').forEach((b) =>
    b.addEventListener("click", () => globalThis.setTimeout(invalidateCoverage, 0)),
  );
  if (globalThis.ResizeObserver)
    new globalThis.ResizeObserver(scheduleDraw).observe(mapBox);
  scheduleDraw();
}

boot();
