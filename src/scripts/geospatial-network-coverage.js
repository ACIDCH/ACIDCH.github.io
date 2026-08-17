import {
  buildEdgeScenario,
  nearestGraphNode,
  parseOverpassGraph,
} from "../lib/geospatial/decisionEngine.js";

const D = globalThis.document;

class MinHeap {
  constructor() {
    this.items = [];
  }
  push(value) {
    this.items.push(value);
    let index = this.items.length - 1;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.items[parent].cost <= value.cost) break;
      this.items[index] = this.items[parent];
      index = parent;
    }
    this.items[index] = value;
  }
  pop() {
    if (!this.items.length) return null;
    const root = this.items[0];
    const last = this.items.pop();
    if (this.items.length && last) {
      let index = 0;
      while (true) {
        const left = index * 2 + 1;
        const right = left + 1;
        if (left >= this.items.length) break;
        let child = left;
        if (right < this.items.length && this.items[right].cost < this.items[left].cost) child = right;
        if (this.items[child].cost >= last.cost) break;
        this.items[index] = this.items[child];
        index = child;
      }
      this.items[index] = last;
    }
    return root;
  }
  get size() {
    return this.items.length;
  }
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
  if (root.dataset.networkCoverageReady === "true") return;
  root.dataset.networkCoverageReady = "true";

  const zh = (root.dataset.locale || "zh") === "zh";
  const copy = zh
    ? {
        title: "道路网络覆盖",
        waiting: "切换到 OSM 并加载道路图后计算真实服务范围。",
        threshold: "时间阈值",
        hubs: "服务设施",
        reachable: "可达节点",
        overlap: "重叠覆盖",
      }
    : {
        title: "Network Service Reach",
        waiting: "Switch to OSM and load the road graph to calculate true service reach.",
        threshold: "Time threshold",
        hubs: "Service facilities",
        reachable: "Reachable nodes",
        overlap: "Overlap coverage",
      };

  const style = D.createElement("style");
  style.textContent = `
    .geo4__coverage-canvas{position:absolute;inset:0;z-index:375;width:100%;height:100%;pointer-events:none;mix-blend-mode:screen;opacity:0;transition:opacity .25s}.geo4__shell[data-analysis-layer="coverage"] .geo4__coverage-canvas{opacity:1}
    .geo4__coverage-hud{position:absolute;z-index:666;left:1rem;top:20.7rem;width:246px;padding:.58rem .66rem;border:1px solid rgba(216,255,107,.24);background:linear-gradient(135deg,rgba(4,19,28,.92),rgba(4,19,28,.76));backdrop-filter:blur(12px);box-shadow:0 13px 38px rgba(0,0,0,.2);pointer-events:none;opacity:.42;transition:opacity .25s,border-color .25s}.geo4__shell[data-analysis-layer="coverage"] .geo4__coverage-hud{opacity:1}.geo4__coverage-hud>span{display:block;color:#d8ff6b;font:700 .5rem monospace;letter-spacing:.12em}.geo4__coverage-hud>strong{display:block;margin-top:.24rem;color:#efffd0;font-size:.66rem}.geo4__coverage-hud>small{display:block;margin-top:.2rem;color:#718e98;font-size:.52rem;line-height:1.4}.geo4__coverage-stats{display:grid;grid-template-columns:1fr 1fr;gap:.3rem;margin-top:.52rem}.geo4__coverage-stats div{padding:.32rem .36rem;border:1px solid rgba(216,255,107,.11);background:rgba(27,46,33,.28)}.geo4__coverage-stats span{display:block;color:#728e96;font-size:.44rem}.geo4__coverage-stats b{display:block;margin-top:.13rem;color:#e9ffd1;font:700 .62rem monospace}.geo4__coverage-scale{display:flex;align-items:center;gap:.35rem;margin-top:.45rem;color:#6d8992;font:600 .46rem monospace}.geo4__coverage-scale i{flex:1;height:4px;border-radius:99px;background:linear-gradient(90deg,rgba(98,236,255,.55),#62ecff 45%,#d8ff6b);box-shadow:0 0 12px rgba(216,255,107,.14)}
  `;
  D.head.appendChild(style);

  const canvas = D.createElement("canvas");
  canvas.className = "geo4__coverage-canvas";
  canvas.setAttribute("aria-hidden", "true");
  mapBox.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const hud = D.createElement("section");
  hud.className = "geo4__coverage-hud";
  hud.innerHTML = `<span>SERVICE AREA / DIJKSTRA</span><strong>${copy.title}</strong><small data-coverage-detail>${copy.waiting}</small><div class="geo4__coverage-stats"><div><span>${copy.threshold}</span><b data-coverage-threshold>—</b></div><div><span>${copy.hubs}</span><b data-coverage-hubs>—</b></div><div><span>${copy.reachable}</span><b data-coverage-reachable>—</b></div><div><span>${copy.overlap}</span><b data-coverage-overlap>—</b></div></div><div class="geo4__coverage-scale"><span>1×</span><i></i><span>2×+</span></div>`;
  shell.appendChild(hud);

  const detail = hud.querySelector("[data-coverage-detail]");
  const thresholdStat = hud.querySelector("[data-coverage-threshold]");
  const hubStat = hud.querySelector("[data-coverage-hubs]");
  const reachableStat = hud.querySelector("[data-coverage-reachable]");
  const overlapStat = hud.querySelector("[data-coverage-overlap]");

  const state = { graph: null, map: null, segments: [], drawing: false, cacheKey: "", reachSets: [] };

  function prepareSegments(graph) {
    const unique = new Map();
    for (const edge of graph?.edges || []) {
      if (unique.has(edge.segmentKey)) continue;
      const a = graph.nodes.get(String(edge.from));
      const b = graph.nodes.get(String(edge.to));
      if (!a || !b) continue;
      unique.set(edge.segmentKey, { key: edge.segmentKey, from: String(edge.from), to: String(edge.to), a, b });
    }
    return [...unique.values()];
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

  function captureMapFromLayer(layer) {
    if (state.map || !layer) return;
    const originalAdd = layer.addTo;
    if (typeof originalAdd !== "function") return;
    layer.addTo = function coverageCaptureAddTo(target) {
      const result = originalAdd.call(this, target);
      if (!state.map && target?._map) {
        state.map = target._map;
        state.map.on("move zoom resize", scheduleDraw);
        scheduleDraw();
      }
      return result;
    };
  }

  if (!L.circleMarker.__acidchCoverageWrapped) {
    const originalCircleMarker = L.circleMarker;
    const wrappedCircleMarker = (...args) => {
      const layer = originalCircleMarker.apply(L, args);
      captureMapFromLayer(layer);
      return layer;
    };
    wrappedCircleMarker.__acidchCoverageWrapped = true;
    wrappedCircleMarker.__acidchCoverageOriginal = originalCircleMarker;
    L.circleMarker = wrappedCircleMarker;
  }

  function selectedFacilityPoints() {
    if (!state.map) return [];
    const names = [...D.querySelectorAll("#geo4-open-list strong")]
      .map((node) => node.textContent?.trim())
      .filter(Boolean);
    if (!names.length) return [];
    const layers = Object.values(state.map._layers || {});
    const points = [];
    for (const name of names) {
      const marker = layers.find((layer) => {
        if (typeof layer?.getLatLng !== "function" || typeof layer?.getTooltip !== "function") return false;
        const content = String(layer.getTooltip()?.getContent?.() || "");
        return content.includes(`<strong>${name}</strong>`);
      });
      const latlng = marker?.getLatLng?.();
      if (latlng) points.push({ name, lat: latlng.lat, lon: latlng.lng });
    }
    return points;
  }

  function edgeTime(edge, scenario) {
    if (scenario.disabled.has(edge.segmentKey)) return Infinity;
    return edge.travelTimeMin * (scenario.factors.get(edge.segmentKey) || 1);
  }

  function boundedReachable(graph, startNode, scenario, limitMin) {
    const distance = new Map([[String(startNode), 0]]);
    const heap = new MinHeap();
    heap.push({ node: String(startNode), cost: 0 });
    const shortcutAdj = new Map();
    for (const edge of scenario.shortcuts || []) {
      const key = String(edge.from);
      if (!shortcutAdj.has(key)) shortcutAdj.set(key, []);
      shortcutAdj.get(key).push(edge);
    }
    while (heap.size) {
      const current = heap.pop();
      if (!current || current.cost > limitMin) continue;
      if (current.cost > (distance.get(current.node) ?? Infinity) + 1e-9) continue;
      const outgoing = [
        ...(graph.adjacency.get(current.node) || []),
        ...(shortcutAdj.get(current.node) || []),
      ];
      for (const edge of outgoing) {
        const weight = edgeTime(edge, scenario);
        if (!Number.isFinite(weight)) continue;
        const nextCost = current.cost + weight;
        if (nextCost > limitMin) continue;
        const to = String(edge.to);
        if (nextCost + 1e-9 < (distance.get(to) ?? Infinity)) {
          distance.set(to, nextCost);
          heap.push({ node: to, cost: nextCost });
        }
      }
    }
    return new Set(distance.keys());
  }

  function updateReachSets() {
    const engine = D.getElementById("geo4-engine")?.value || "od";
    const layer = D.getElementById("geo4-layer")?.value || "network";
    if (!state.graph || !state.map || engine !== "osm" || layer !== "coverage") {
      state.reachSets = [];
      return;
    }
    const threshold = Math.max(1, Number(D.getElementById("geo4-threshold")?.value || 30));
    const selected = selectedFacilityPoints();
    const params = scenarioParams();
    const key = JSON.stringify({ threshold, selected: selected.map((p) => [p.name, p.lat, p.lon]), params });
    if (key === state.cacheKey) return;
    state.cacheKey = key;
    const scenario = buildEdgeScenario(state.graph, params);
    state.reachSets = selected.map((point) => {
      const snap = nearestGraphNode(state.graph, point);
      return snap?.nodeId ? boundedReachable(state.graph, snap.nodeId, scenario, threshold) : new Set();
    });
    const union = new Set(state.reachSets.flatMap((set) => [...set]));
    let overlap = 0;
    for (const node of union) if (state.reachSets.filter((set) => set.has(node)).length >= 2) overlap += 1;
    detail.textContent = `${selected.length} ${copy.hubs.toLowerCase()} · ${threshold.toFixed(0)} min`;
    thresholdStat.textContent = `${threshold.toFixed(0)} min`;
    hubStat.textContent = String(selected.length);
    reachableStat.textContent = union.size.toLocaleString();
    overlapStat.textContent = union.size ? `${((overlap / union.size) * 100).toFixed(0)}%` : "0%";
  }

  function fitCanvas() {
    const rect = mapBox.getBoundingClientRect();
    const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    }
    return { rect, dpr };
  }

  function draw() {
    state.drawing = false;
    if (!ctx) return;
    const { rect, dpr } = fitCanvas();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    const engine = D.getElementById("geo4-engine")?.value || "od";
    const layer = D.getElementById("geo4-layer")?.value || "network";
    if (!state.graph || !state.map || engine !== "osm" || layer !== "coverage") {
      if (engine !== "osm") detail.textContent = copy.waiting;
      return;
    }
    updateReachSets();
    if (!state.reachSets.length) return;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    let drawn = 0;
    for (const segment of state.segments) {
      const count = state.reachSets.reduce(
        (sum, set) => sum + (set.has(segment.from) && set.has(segment.to) ? 1 : 0),
        0,
      );
      if (!count) continue;
      const p1 = state.map.latLngToContainerPoint([segment.a.lat, segment.a.lon]);
      const p2 = state.map.latLngToContainerPoint([segment.b.lat, segment.b.lon]);
      const overlap = count >= 2;
      ctx.strokeStyle = overlap ? "rgba(216,255,107,.96)" : "rgba(98,236,255,.82)";
      ctx.globalAlpha = overlap ? 0.68 : 0.33;
      ctx.lineWidth = overlap ? 2.15 : 1.15;
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
    state.cacheKey = "";
    if (state.drawing) return;
    state.drawing = true;
    globalThis.requestAnimationFrame(draw);
  }

  const originalFetch = globalThis.fetch;
  if (typeof originalFetch === "function" && !originalFetch.__acidchCoverageWrapped) {
    const wrappedFetch = async (...args) => {
      const response = await originalFetch.apply(globalThis, args);
      const input = args[0];
      const url = typeof input === "string" ? input : input?.url || "";
      if (response.ok && /overpass.*api\/interpreter|api\/interpreter/i.test(url)) {
        response.clone().json().then((payload) => {
          if (!Array.isArray(payload?.elements) || !payload.elements.length) return;
          const graph = parseOverpassGraph(payload.elements);
          if (!graph?.edges?.length) return;
          state.graph = graph;
          state.segments = prepareSegments(graph);
          scheduleDraw();
        }).catch(() => {});
      }
      return response;
    };
    wrappedFetch.__acidchCoverageWrapped = true;
    wrappedFetch.__acidchCoverageOriginal = originalFetch;
    globalThis.fetch = wrappedFetch;
  }

  for (const id of ["geo4-engine", "geo4-layer", "geo4-threshold", "geo4-road-mode", "geo4-congestion", "geo4-congestion-share", "geo4-closure", "geo4-seed", "geo4-run"]) {
    const element = D.getElementById(id);
    element?.addEventListener("input", scheduleDraw);
    element?.addEventListener("change", scheduleDraw);
    element?.addEventListener("click", () => globalThis.setTimeout(scheduleDraw, 50));
  }
  D.querySelectorAll('[data-step="newRoads"]').forEach((button) => button.addEventListener("click", () => globalThis.setTimeout(scheduleDraw, 0)));
  const openList = D.getElementById("geo4-open-list");
  const observer = openList && globalThis.MutationObserver ? new globalThis.MutationObserver(() => globalThis.setTimeout(scheduleDraw, 50)) : null;
  observer?.observe(openList, { childList: true, subtree: true });
  const resizeObserver = globalThis.ResizeObserver ? new globalThis.ResizeObserver(scheduleDraw) : null;
  resizeObserver?.observe(mapBox);

  scheduleDraw();
}

boot();
