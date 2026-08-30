import { buildEdgeScenario } from "../lib/geospatial/decisionEngine.js";
import { getGeospatialStore } from "../lib/geospatial/geospatialStore.js";
import { createDisruptionEvent } from "../lib/geospatial/disruptionEvents.js";

const D = globalThis.document;

function boot() {
  const root = D?.getElementById("geo-v4");
  const shell = root?.querySelector(".geo4__shell");
  const mapBox = D?.getElementById("geo4-map");
  const L = globalThis.L;
  if (!root || !shell || !mapBox || !L) {
    globalThis.setTimeout(boot, 80);
    return;
  }
  if (root.dataset.roadNetworkVisualReady === "true") return;
  root.dataset.roadNetworkVisualReady = "true";

  const zh = (root.dataset.locale || "zh") === "zh";
  const copy = zh
    ? {
        title: "真实道路网络",
        empty: "OSM 路网未加载",
        emptyDetail: "加载 OSM 道路图后显示真实道路层级、拥堵、封路与新增连接。",
        nodes: "节点",
        segments: "道路段",
        congested: "拥堵",
        closed: "封闭",
        proposed: "新增",
        normal: "正常",
        high: "高负载",
      }
    : {
        title: "Real Road Network",
        empty: "OSM graph not loaded",
        emptyDetail:
          "Load the OSM road graph to reveal real road hierarchy, congestion, closures and proposed links.",
        nodes: "Nodes",
        segments: "Segments",
        congested: "Congested",
        closed: "Closed",
        proposed: "New",
        normal: "Normal",
        high: "High load",
      };

  const style = D.createElement("style");
  style.textContent = `
    .geo4__road-canvas{position:absolute;inset:0;z-index:355;width:100%;height:100%;pointer-events:none;mix-blend-mode:screen;opacity:.92;transition:opacity .25s}
    .geo4__road-hud{position:absolute;z-index:665;top:9.15rem;left:1rem;width:246px;padding:.62rem .68rem;border:1px solid rgba(98,236,255,.22);background:linear-gradient(135deg,rgba(4,19,28,.92),rgba(4,19,28,.76));backdrop-filter:blur(12px);box-shadow:0 14px 42px rgba(0,0,0,.22);pointer-events:none}
    .geo4__road-hud>span{display:block;color:#62ecff;font:700 .51rem/1.2 monospace;letter-spacing:.13em;text-transform:uppercase}.geo4__road-hud>strong{display:block;margin-top:.25rem;color:#eefcff;font-size:.68rem;line-height:1.25}.geo4__road-hud>small{display:block;margin-top:.23rem;color:#72929e;font-size:.54rem;line-height:1.45}
    .geo4__road-load{height:5px;margin:.55rem 0 .35rem;border-radius:99px;background:linear-gradient(90deg,#2fd6be 0%,#65ecff 38%,#ffe16d 72%,#ff759a 100%);box-shadow:0 0 16px rgba(98,236,255,.14)}
    .geo4__road-scale{display:flex;justify-content:space-between;color:#668591;font:600 .48rem monospace}.geo4__road-stats{display:grid;grid-template-columns:1fr 1fr;gap:.3rem;margin-top:.55rem}.geo4__road-stats div{padding:.34rem .38rem;border:1px solid rgba(116,190,213,.13);background:rgba(8,34,45,.48)}.geo4__road-stats span{display:block;color:#6f909d;font-size:.46rem}.geo4__road-stats b{display:block;margin-top:.15rem;color:#e9fbfe;font:700 .64rem monospace}.geo4__road-stats .warn b{color:#ffcc66}.geo4__road-stats .danger b{color:#ff759a}.geo4__road-stats .new b{color:#d8ff6b}
    .geo4__shell[data-analysis-layer="network"] .geo4__road-canvas{opacity:1}.geo4__shell[data-analysis-layer="flow"] .geo4__road-canvas{opacity:.66}.geo4__shell[data-analysis-layer="coverage"] .geo4__road-canvas,.geo4__shell[data-analysis-layer="utilisation"] .geo4__road-canvas,.geo4__shell[data-analysis-layer="inventory"] .geo4__road-canvas{opacity:.48}.geo4__shell[data-analysis-layer="cost"] .geo4__road-canvas{opacity:.62}.geo4__shell[data-analysis-layer="risk"] .geo4__road-canvas{opacity:1}
    .geo4__shell[data-road-visual="closure"] .geo4__road-hud,.geo4__shell[data-road-visual="mixed"] .geo4__road-hud{border-color:rgba(255,117,154,.35)}.geo4__shell[data-road-visual="congestion"] .geo4__road-hud{border-color:rgba(255,204,102,.35)}.geo4__shell[data-road-visual="newroad"] .geo4__road-hud{border-color:rgba(216,255,107,.35)}
  `;
  D.head.appendChild(style);

  const canvas = D.createElement("canvas");
  canvas.className = "geo4__road-canvas";
  canvas.setAttribute("aria-hidden", "true");
  mapBox.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const hud = D.createElement("section");
  hud.className = "geo4__road-hud";
  hud.innerHTML = `
    <span>ROAD GRAPH / OSM</span>
    <strong>${copy.title}</strong>
    <small data-road-detail>${copy.emptyDetail}</small>
    <div class="geo4__road-load"></div>
    <div class="geo4__road-scale"><span>${copy.normal}</span><span>${copy.high}</span></div>
    <div class="geo4__road-stats">
      <div><span>${copy.nodes}</span><b data-road-nodes>—</b></div>
      <div><span>${copy.segments}</span><b data-road-segments>—</b></div>
      <div class="warn"><span>${copy.congested}</span><b data-road-congested>—</b></div>
      <div class="danger"><span>${copy.closed}</span><b data-road-closed>—</b></div>
      <div class="new"><span>${copy.proposed}</span><b data-road-proposed>—</b></div>
    </div>`;
  shell.appendChild(hud);

  const detail = hud.querySelector("[data-road-detail]");
  const stats = {
    nodes: hud.querySelector("[data-road-nodes]"),
    segments: hud.querySelector("[data-road-segments]"),
    congested: hud.querySelector("[data-road-congested]"),
    closed: hud.querySelector("[data-road-closed]"),
    proposed: hud.querySelector("[data-road-proposed]"),
  };

  const store = getGeospatialStore();
  const initial = store.getState();
  const state = {
    graph: initial.graph,
    scenario: null,
    segments: [],
    map: initial.presentation.map,
    drawing: false,
  };

  const importance = (highway = "") => {
    if (/motorway|trunk/.test(highway)) return 4;
    if (/primary/.test(highway)) return 3;
    if (/secondary/.test(highway)) return 2;
    if (/tertiary/.test(highway)) return 1;
    return 0;
  };

  const hash = (value) => {
    let h = 2166136261;
    for (const ch of String(value)) {
      h ^= ch.charCodeAt(0);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };

  function prepareSegments(graph) {
    const unique = new Map();
    for (const edge of graph?.edges || []) {
      if (unique.has(edge.segmentKey)) continue;
      const a = graph.nodes.get(String(edge.from));
      const b = graph.nodes.get(String(edge.to));
      if (!a || !b) continue;
      unique.set(edge.segmentKey, {
        key: edge.segmentKey,
        a,
        b,
        highway: edge.highway || "road",
        importance: importance(edge.highway),
      });
    }
    return [...unique.values()];
  }
  if (state.graph) state.segments = prepareSegments(state.graph);
  state.map?.on("move zoom resize", scheduleDraw);

  function currentScenario() {
    if (!state.graph) return null;
    const snapshot = store.getState();
    const mode = D.getElementById("geo4-road-mode")?.value || "baseline";
    const seed = Number(D.getElementById("geo4-seed")?.value || 708709);
    const event = createDisruptionEvent({
      eventId: snapshot.scenarioInputs.disruptionEvent || "none",
      seed,
      facilities: snapshot.entities.facilities,
      demands: snapshot.entities.demands,
    });
    const newRoads = Number(snapshot.scenarioInputs.newRoads || 0);
    return buildEdgeScenario(state.graph, {
      mode,
      congestionSeverity: Number(D.getElementById("geo4-congestion")?.value || 0) / 100,
      congestionShare:
        Number(D.getElementById("geo4-congestion-share")?.value || 0) / 100,
      closureShare: Number(D.getElementById("geo4-closure")?.value || 0) / 100,
      improvement: 0.25,
      improvementShare: 0.3,
      newRoadLinks: newRoads,
      maxNewRoadKm: 0.65,
      newRoadSpeedKph: 50,
      seed,
      ...event.networkScenario,
    });
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

  function updateHud() {
    const engine = D.getElementById("geo4-engine")?.value || "od";
    if (!state.graph || engine !== "osm") {
      detail.textContent = copy.emptyDetail;
      Object.values(stats).forEach((node) => (node.textContent = "—"));
      return;
    }
    const scenario = state.scenario || currentScenario();
    detail.textContent = copy.title;
    stats.nodes.textContent = state.graph.nodeList.length.toLocaleString();
    stats.segments.textContent = state.segments.length.toLocaleString();
    stats.congested.textContent = (scenario?.factors?.size || 0).toLocaleString();
    stats.closed.textContent = (scenario?.disabled?.size || 0).toLocaleString();
    const proposed = new Set((scenario?.shortcuts || []).map((edge) => edge.segmentKey))
      .size;
    stats.proposed.textContent = proposed.toLocaleString();
  }

  function stroke(a, b, colour, width, alpha = 1, glow = 0, dash = null) {
    if (!ctx || !state.map) return;
    const p1 = state.map.latLngToContainerPoint([a.lat, a.lon]);
    const p2 = state.map.latLngToContainerPoint([b.lat, b.lon]);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = colour;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (dash) ctx.setLineDash(dash);
    if (glow) {
      ctx.shadowColor = colour;
      ctx.shadowBlur = glow;
    }
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.restore();
    return { p1, p2 };
  }

  function drawClosureCross(p1, p2) {
    if (!ctx) return;
    const x = (p1.x + p2.x) / 2;
    const y = (p1.y + p2.y) / 2;
    ctx.save();
    ctx.strokeStyle = "rgba(255,117,154,.95)";
    ctx.lineWidth = 1.2;
    ctx.shadowColor = "rgba(255,117,154,.8)";
    ctx.shadowBlur = 7;
    ctx.beginPath();
    ctx.moveTo(x - 3, y - 3);
    ctx.lineTo(x + 3, y + 3);
    ctx.moveTo(x + 3, y - 3);
    ctx.lineTo(x - 3, y + 3);
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    state.drawing = false;
    if (!ctx) return;
    const { rect, dpr } = fitCanvas();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    updateHud();
    const engine = D.getElementById("geo4-engine")?.value || "od";
    if (!state.map || !state.graph || engine !== "osm") return;

    state.scenario = currentScenario();
    const scenario = state.scenario;
    const analysis = D.getElementById("geo4-layer")?.value || "network";
    const zoom = state.map.getZoom?.() || 12;
    const localStride = Math.max(
      1,
      Math.ceil(state.segments.length / (zoom >= 14 ? 9000 : 5600)),
    );
    let closureCrosses = 0;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const segment of state.segments) {
      const affected = scenario.factors.has(segment.key);
      const closed = scenario.disabled.has(segment.key);
      if (
        !affected &&
        !closed &&
        segment.importance === 0 &&
        hash(segment.key) % localStride !== 0
      )
        continue;

      const baseAlpha =
        analysis === "network" ? 0.2 : analysis === "risk" ? 0.075 : 0.11;
      const baseWidth = [0.48, 0.66, 0.88, 1.15, 1.55][segment.importance];
      if (!closed) {
        stroke(
          segment.a,
          segment.b,
          segment.importance >= 3 ? "rgba(98,236,255,.95)" : "rgba(47,214,190,.9)",
          baseWidth,
          baseAlpha + segment.importance * 0.035,
          segment.importance >= 3 && analysis === "network" ? 2.5 : 0,
        );
      }
      if (affected) {
        const factor = scenario.factors.get(segment.key) || 1;
        const strength = Math.min(1, Math.max(0.18, (factor - 1) / 0.75));
        stroke(
          segment.a,
          segment.b,
          strength > 0.62 ? "rgba(255,225,109,.98)" : "rgba(255,204,102,.96)",
          baseWidth + 1.05 + strength * 1.25,
          analysis === "risk" ? 0.9 : 0.7,
          5 + strength * 7,
        );
      }
      if (closed) {
        const points = stroke(
          segment.a,
          segment.b,
          "rgba(255,117,154,.98)",
          baseWidth + 1.55,
          analysis === "risk" ? 1 : 0.84,
          8,
          [4, 4],
        );
        if (
          points &&
          closureCrosses < 90 &&
          (segment.importance > 0 || hash(segment.key) % 7 === 0)
        ) {
          drawClosureCross(points.p1, points.p2);
          closureCrosses += 1;
        }
      }
    }

    const shortcutSeen = new Set();
    for (const edge of scenario.shortcuts || []) {
      if (shortcutSeen.has(edge.segmentKey)) continue;
      shortcutSeen.add(edge.segmentKey);
      const a = state.graph.nodes.get(String(edge.from));
      const b = state.graph.nodes.get(String(edge.to));
      if (!a || !b) continue;
      stroke(a, b, "rgba(216,255,107,.98)", 2.25, 0.92, 10, [7, 3]);
    }
    ctx.restore();
    updateHud();
  }

  function scheduleDraw() {
    if (state.drawing) return;
    state.drawing = true;
    globalThis.requestAnimationFrame(draw);
  }

  store.subscribe((snapshot, reason) => {
    const nextMap = snapshot.presentation.map;
    if (nextMap && nextMap !== state.map) {
      state.map = nextMap;
      state.map.on("move zoom resize", scheduleDraw);
    }
    if (snapshot.graph !== state.graph) {
      state.graph = snapshot.graph;
      state.segments = prepareSegments(snapshot.graph);
      state.scenario = currentScenario();
    }
    if (
      ["graph", "reset", "scenario-inputs"].some((value) =>
        String(reason).includes(value),
      )
    )
      scheduleDraw();
  });

  const refresh = () => {
    if (D.getElementById("geo4-engine")?.value !== "osm") state.scenario = null;
    else state.scenario = currentScenario();
    scheduleDraw();
  };
  for (const id of [
    "geo4-road-mode",
    "geo4-event",
    "geo4-congestion",
    "geo4-congestion-share",
    "geo4-closure",
    "geo4-seed",
    "geo4-layer",
    "geo4-engine",
  ]) {
    const element = D.getElementById(id);
    element?.addEventListener("input", refresh);
    element?.addEventListener("change", refresh);
  }
  D.querySelectorAll('[data-step="newRoads"]').forEach((button) =>
    button.addEventListener("click", () => globalThis.setTimeout(refresh, 0)),
  );
  const resizeObserver = globalThis.ResizeObserver
    ? new globalThis.ResizeObserver(scheduleDraw)
    : null;
  resizeObserver?.observe(mapBox);

  updateHud();
  scheduleDraw();
}

boot();
