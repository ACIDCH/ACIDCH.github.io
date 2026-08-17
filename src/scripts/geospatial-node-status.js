const D = globalThis.document;

function boot() {
  const root = D?.getElementById("geo-v4");
  const shell = root?.querySelector(".geo4__shell");
  const mapBox = D?.getElementById("geo4-map");
  const L = globalThis.L;
  if (!root || !shell || !mapBox || !L) {
    globalThis.setTimeout(boot, 100);
    return;
  }
  if (root.dataset.nodeStatusReady === "true") return;
  root.dataset.nodeStatusReady = "true";

  const zh = (root.dataset.locale || "zh") === "zh";
  const text = zh
    ? {
        event: "路网状态",
        baseline: "基线",
        congestion: "拥堵",
        closure: "临时封路",
        newroad: "新增道路 / 改善",
        mixed: "混合扰动",
        stable: "稳定",
        moderate: "中等扰动",
        high: "高扰动",
        flow: "货物流等级",
        low: "低",
        medium: "中",
        highFlow: "高",
        source: "设施流出",
        sink: "需求流入",
      }
    : {
        event: "Network state",
        baseline: "Baseline",
        congestion: "Congestion",
        closure: "Temporary closure",
        newroad: "New road / improvement",
        mixed: "Mixed disruption",
        stable: "Stable",
        moderate: "Moderate disruption",
        high: "High disruption",
        flow: "Flow tier",
        low: "Low",
        medium: "Medium",
        highFlow: "High",
        source: "Facility outflow",
        sink: "Demand inflow",
      };

  const style = D.createElement("style");
  style.textContent = `
    .geo4__scenario-status{position:absolute;z-index:690;left:1rem;top:156px;min-width:190px;padding:.58rem .65rem;border:1px solid rgba(98,236,255,.22);background:rgba(4,19,28,.86);backdrop-filter:blur(12px);color:#dff9fd;pointer-events:none}
    .geo4__scenario-status span{display:block;color:#6f909d;font:700 .53rem/1.2 monospace;letter-spacing:.12em}.geo4__scenario-status strong{display:block;margin-top:.2rem;font-size:.72rem}.geo4__scenario-status small{display:flex;align-items:center;gap:.34rem;margin-top:.25rem;color:#8ca8b2;font-size:.56rem}.geo4__scenario-status i{width:7px;height:7px;border-radius:50%;background:#62ecff;box-shadow:0 0 10px rgba(98,236,255,.65)}
    .geo4__scenario-status[data-level="moderate"]{border-color:rgba(255,204,102,.38)}.geo4__scenario-status[data-level="moderate"] i{background:#ffcc66;box-shadow:0 0 10px rgba(255,204,102,.7)}
    .geo4__scenario-status[data-level="high"]{border-color:rgba(255,117,154,.46)}.geo4__scenario-status[data-level="high"] i{background:#ff759a;box-shadow:0 0 11px rgba(255,117,154,.75)}
    .geo4__flow-tier{position:absolute;z-index:660;left:1rem;bottom:3.6rem;padding:.48rem .58rem;border:1px solid rgba(116,190,213,.18);background:rgba(4,19,28,.78);backdrop-filter:blur(10px);color:#8ca8b2;pointer-events:none}.geo4__flow-tier b{display:block;color:#dff9fd;font-size:.58rem;margin-bottom:.3rem}.geo4__flow-tier div{display:flex;gap:.55rem;align-items:center;font-size:.52rem}.geo4__flow-tier em{display:inline-block;width:28px;height:3px;border-radius:99px;box-shadow:0 0 8px currentColor}.geo4__flow-tier .low{color:#62ecff}.geo4__flow-tier .mid{color:#b5f6ff}.geo4__flow-tier .high{color:#d8ff6b}
    .geo4__node-canvas{position:absolute;inset:0;z-index:430;width:100%;height:100%;pointer-events:none;mix-blend-mode:screen}
    @media(max-width:820px){.geo4__scenario-status{top:184px;left:.5rem}.geo4__flow-tier{left:.5rem;bottom:7.2rem}}
  `;
  D.head.appendChild(style);

  const status = D.createElement("div");
  status.className = "geo4__scenario-status";
  status.innerHTML = `<span>${text.event}</span><strong id="geo4-visual-scenario">—</strong><small><i></i><b id="geo4-visual-level">—</b></small>`;
  shell.appendChild(status);

  const tier = D.createElement("div");
  tier.className = "geo4__flow-tier";
  tier.innerHTML = `<b>${text.flow}</b><div><span><em class="low"></em> ${text.low}</span><span><em class="mid"></em> ${text.medium}</span><span><em class="high"></em> ${text.highFlow}</span></div>`;
  shell.appendChild(tier);

  const canvas = D.createElement("canvas");
  canvas.className = "geo4__node-canvas";
  canvas.setAttribute("aria-hidden", "true");
  mapBox.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const routeState = { routes: [] };
  const modeSelect = D.getElementById("geo4-road-mode");
  const congestion = D.getElementById("geo4-congestion");
  const closure = D.getElementById("geo4-closure");
  const congestionShare = D.getElementById("geo4-congestion-share");
  const scenarioLabel = status.querySelector("#geo4-visual-scenario");
  const levelLabel = status.querySelector("#geo4-visual-level");

  function scenarioName(mode) {
    return text[mode] || text.baseline;
  }
  function updateScenario() {
    const mode = modeSelect?.value || "baseline";
    const c = Number(congestion?.value || 0) / 100;
    const share = Number(congestionShare?.value || 0) / 100;
    const closed = Number(closure?.value || 0) / 100;
    const score = mode === "baseline" ? 0 : c * share + closed * 2.2 + (mode === "mixed" ? 0.18 : 0);
    const level = score >= 0.55 ? "high" : score >= 0.18 ? "moderate" : "stable";
    status.dataset.level = level;
    scenarioLabel.textContent = scenarioName(mode);
    levelLabel.textContent = level === "high" ? text.high : level === "moderate" ? text.moderate : text.stable;
  }

  const original = L.polyline.__acidchNodeOriginal || L.polyline;
  if (!L.polyline.__acidchNodeWrapped) {
    const wrapped = function nodeStatusPolyline(latlngs, options = {}) {
      const layer = original.call(L, latlngs, options);
      const optimal = String(options.color || "").toLowerCase() === "#d8ff6b" && Number(options.weight || 0) >= 2.4;
      if (optimal) {
        const flat = [];
        const walk = (value) => {
          if (Array.isArray(value)) {
            if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") flat.push({ lat: value[0], lng: value[1] });
            else value.forEach(walk);
          } else if (value && Number.isFinite(value.lat) && Number.isFinite(value.lng)) flat.push({ lat: value.lat, lng: value.lng });
        };
        walk(latlngs);
        const record = { layer, start: flat[0], end: flat.at(-1), flow: 1 };
        routeState.routes.push(record);
        const bind = layer.bindTooltip;
        layer.bindTooltip = function bindNodeTooltip(content, ...args) {
          const match = String(content).match(/Flow:\s*([\d,.]+)/i);
          if (match) record.flow = Number(match[1].replaceAll(",", "")) || 1;
          return bind.call(this, content, ...args);
        };
      }
      return layer;
    };
    wrapped.__acidchNodeWrapped = true;
    wrapped.__acidchNodeOriginal = original;
    L.polyline = wrapped;
  }

  function fit() {
    const rect = mapBox.getBoundingClientRect();
    const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    }
    return { rect, dpr };
  }

  function draw() {
    globalThis.requestAnimationFrame(draw);
    if (!ctx) return;
    const { rect, dpr } = fit();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    const active = routeState.routes.filter((route) => route.layer?._map && route.start && route.end);
    if (!active.length) return;
    const map = active[0].layer._map;
    const maxFlow = Math.max(1, ...active.map((route) => route.flow));
    const aggregate = new Map();
    for (const route of active) {
      for (const [kind, point] of [["source", route.start], ["sink", route.end]]) {
        const key = `${kind}:${point.lat.toFixed(5)}:${point.lng.toFixed(5)}`;
        const current = aggregate.get(key) || { kind, point, flow: 0 };
        current.flow += route.flow;
        aggregate.set(key, current);
      }
    }
    const time = (globalThis.performance?.now?.() || Date.now()) / 1000;
    for (const node of aggregate.values()) {
      const p = map.latLngToContainerPoint([node.point.lat, node.point.lng]);
      const ratio = Math.min(1, node.flow / maxFlow);
      const pulse = 0.5 + 0.5 * Math.sin(time * 2.2 + p.x * 0.01);
      const colour = node.kind === "source" ? "98,236,255" : "216,255,107";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5 + ratio * 6 + pulse * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${colour},${0.08 + ratio * 0.16})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3 + ratio * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${colour},.92)`;
      ctx.shadowColor = `rgba(${colour},.85)`;
      ctx.shadowBlur = 8 + ratio * 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  const clearRoutes = () => {
    routeState.routes.length = 0;
  };
  for (const id of ["geo4-run", "geo4-routes", "geo4-reset", "geo4-engine", "geo4-road-mode"]) {
    const el = D.getElementById(id);
    el?.addEventListener("click", clearRoutes);
    el?.addEventListener("change", () => {
      clearRoutes();
      updateScenario();
    });
  }
  for (const el of [modeSelect, congestion, closure, congestionShare]) {
    el?.addEventListener("input", updateScenario);
    el?.addEventListener("change", updateScenario);
  }
  updateScenario();
  draw();
}

boot();
