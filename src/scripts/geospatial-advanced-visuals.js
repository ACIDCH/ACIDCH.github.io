import {
  buildPolylineMetrics,
  flattenLatLngs,
  particleCountForFlow,
  pointAlongPolyline,
} from "../lib/geospatial/flowGeometry.js";

const doc = globalThis.document;
const raf = (callback) => globalThis.requestAnimationFrame(callback);
const caf = (id) => globalThis.cancelAnimationFrame(id);

function boot() {
  const root = doc?.getElementById("geo-v4");
  const shell = root?.querySelector(".geo4__shell");
  const mapContainer = doc?.getElementById("geo4-map");
  const L = globalThis.L;
  if (!root || !shell || !mapContainer || !L) {
    globalThis.setTimeout(boot, 80);
    return;
  }
  if (root.dataset.advancedVisualReady === "true") return;
  root.dataset.advancedVisualReady = "true";

  const zh = (root.dataset.locale || "zh") === "zh";
  const copy = zh
    ? {
        eyebrow: "LIVE ROUTE FLOW",
        title: "真实路线流动",
        waiting: "先运行优化并加载当前最优路径",
        live: "条最优道路路径 · 实时流动",
        animation: "流动动画",
        speed: "流动速度",
        density: "粒子密度",
        glow: "路线辉光",
        ambient: "环境视觉层",
        on: "开启",
        off: "关闭",
      }
    : {
        eyebrow: "LIVE ROUTE FLOW",
        title: "Real Route Flow",
        waiting: "Run optimisation and load the current optimal paths",
        live: "optimal road paths · live flow",
        animation: "Flow animation",
        speed: "Flow speed",
        density: "Particle density",
        glow: "Route glow",
        ambient: "Ambient visual layer",
        on: "On",
        off: "Off",
      };

  const reducedMotion = Boolean(
    globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches,
  );
  const state = {
    enabled: !reducedMotion,
    ambient: true,
    speed: 1,
    density: 4,
    glow: 1,
    routes: [],
    frame: null,
    startedAt: globalThis.performance?.now?.() || Date.now(),
  };

  const style = doc.createElement("style");
  style.dataset.geoAdvancedVisualStyle = "true";
  style.textContent = `
    .geo4__flow-canvas{position:absolute;inset:0;z-index:425;width:100%;height:100%;pointer-events:none;mix-blend-mode:screen}
    .geo4__visual-atmosphere{position:absolute;inset:0;z-index:510;pointer-events:none;opacity:0;transition:opacity .35s ease;background:radial-gradient(circle at 50% 45%,transparent 24%,rgba(3,13,20,.16) 64%,rgba(0,5,9,.58) 100%)}
    .geo4__visual-atmosphere::after{content:"";position:absolute;inset:0;opacity:.16;background:repeating-linear-gradient(0deg,rgba(98,236,255,.025) 0,rgba(98,236,255,.025) 1px,transparent 1px,transparent 5px);animation:geo4-scan 12s linear infinite}
    .geo4__shell.is-advanced-ambient .geo4__visual-atmosphere{opacity:1}
    .geo4__visual-panel{position:absolute;z-index:680;left:50%;bottom:12px;transform:translateX(-50%);width:min(520px,calc(100% - 760px));min-width:390px;padding:.65rem .75rem;border:1px solid rgba(98,236,255,.24);background:rgba(4,19,28,.88);backdrop-filter:blur(14px);box-shadow:0 14px 50px rgba(0,0,0,.26);color:#dff9fd}
    .geo4__visual-head{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.7rem;align-items:center}.geo4__visual-head span{display:block;color:#62ecff;font:700 .58rem/1.2 monospace;letter-spacing:.12em}.geo4__visual-head strong{display:block;margin-top:.15rem;font-size:.7rem}.geo4__visual-state{color:#7f9ca8!important;text-align:right;font:500 .58rem/1.25 sans-serif!important;letter-spacing:0!important;max-width:180px}
    .geo4__visual-controls{display:grid;grid-template-columns:auto 1fr 1fr 1fr auto;gap:.55rem;align-items:end;margin-top:.55rem}.geo4__visual-toggle{display:flex;gap:.35rem;align-items:center;color:#8aa7b2;font-size:.58rem;white-space:nowrap}.geo4__visual-toggle input{accent-color:#d8ff6b}.geo4__visual-control{display:grid;gap:.2rem;color:#7d9aa6;font-size:.54rem}.geo4__visual-control input{width:100%;accent-color:#62ecff}.geo4__ambient-button{border:1px solid rgba(116,190,213,.2);background:transparent;color:#8aa7b2;padding:.35rem .45rem;font-size:.56rem;cursor:pointer}.geo4__ambient-button.is-active{border-color:rgba(216,255,107,.5);color:#d8ff6b}
    .geo4__route-live-badge{position:absolute;z-index:615;top:1rem;left:50%;transform:translateX(-50%);display:none;align-items:center;gap:.4rem;padding:.32rem .5rem;border:1px solid rgba(216,255,107,.28);background:rgba(5,20,27,.78);color:#b8d0d7;font:600 .56rem/1 monospace;letter-spacing:.05em;pointer-events:none}.geo4__route-live-badge.is-live{display:flex}.geo4__route-live-badge i{width:6px;height:6px;border-radius:50%;background:#d8ff6b;box-shadow:0 0 12px rgba(216,255,107,.85);animation:geo4-pulse 1.4s ease-in-out infinite}
    @keyframes geo4-pulse{0%,100%{opacity:.4;transform:scale(.75)}50%{opacity:1;transform:scale(1.25)}}@keyframes geo4-scan{from{transform:translateY(0)}to{transform:translateY(24px)}}
    @media(prefers-reduced-motion:reduce){.geo4__visual-atmosphere::after,.geo4__route-live-badge i{animation:none}}
    @media(max-width:1180px){.geo4__visual-panel{left:auto;right:1rem;bottom:1rem;transform:none;width:350px;min-width:0}.geo4__visual-controls{grid-template-columns:1fr 1fr 1fr}.geo4__visual-toggle,.geo4__ambient-button{grid-column:auto}}
    @media(max-width:820px){.geo4__visual-panel{position:absolute;right:.5rem;bottom:3rem;left:.5rem;width:auto;min-width:0}.geo4__visual-controls{grid-template-columns:1fr 1fr}.geo4__route-live-badge{top:176px}.geo4__visual-state{max-width:130px}}
  `;
  doc.head.appendChild(style);

  const canvas = doc.createElement("canvas");
  canvas.className = "geo4__flow-canvas";
  canvas.setAttribute("aria-hidden", "true");
  mapContainer.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const atmosphere = doc.createElement("div");
  atmosphere.className = "geo4__visual-atmosphere";
  atmosphere.setAttribute("aria-hidden", "true");
  shell.appendChild(atmosphere);
  shell.classList.add("is-advanced-ambient");

  const liveBadge = doc.createElement("div");
  liveBadge.className = "geo4__route-live-badge";
  liveBadge.innerHTML = `<i></i><span>ROUTE FLOW</span>`;
  shell.appendChild(liveBadge);

  const panel = doc.createElement("section");
  panel.className = "geo4__visual-panel";
  panel.setAttribute("aria-label", copy.title);
  panel.innerHTML = `
    <div class="geo4__visual-head">
      <div><span>${copy.eyebrow}</span><strong>${copy.title}</strong></div>
      <span id="geo4-visual-state" class="geo4__visual-state">${copy.waiting}</span>
    </div>
    <div class="geo4__visual-controls">
      <label class="geo4__visual-toggle"><input id="geo4-flow-enabled" type="checkbox" ${state.enabled ? "checked" : ""}/><span>${copy.animation}</span></label>
      <label class="geo4__visual-control"><span>${copy.speed}</span><input id="geo4-flow-speed" type="range" min="0.25" max="2.5" step="0.25" value="1" /></label>
      <label class="geo4__visual-control"><span>${copy.density}</span><input id="geo4-flow-density" type="range" min="1" max="8" step="1" value="4" /></label>
      <label class="geo4__visual-control"><span>${copy.glow}</span><input id="geo4-flow-glow" type="range" min="0" max="2" step="0.25" value="1" /></label>
      <button id="geo4-ambient-toggle" class="geo4__ambient-button is-active" type="button">${copy.ambient}</button>
    </div>`;
  shell.appendChild(panel);

  const status = panel.querySelector("#geo4-visual-state");
  const enabledInput = panel.querySelector("#geo4-flow-enabled");
  const speedInput = panel.querySelector("#geo4-flow-speed");
  const densityInput = panel.querySelector("#geo4-flow-density");
  const glowInput = panel.querySelector("#geo4-flow-glow");
  const ambientButton = panel.querySelector("#geo4-ambient-toggle");

  const clearRoutes = () => {
    state.routes = [];
    status.textContent = copy.waiting;
    liveBadge.classList.remove("is-live");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const updateStatus = () => {
    if (!state.routes.length) {
      status.textContent = copy.waiting;
      liveBadge.classList.remove("is-live");
      return;
    }
    status.textContent = `${state.routes.length} ${copy.live}`;
    liveBadge.classList.toggle("is-live", state.enabled);
  };

  const originalPolyline = L.polyline;
  if (!originalPolyline.__acidchAdvancedWrapped) {
    const wrapped = function wrappedPolyline(latlngs, options = {}) {
      const layer = originalPolyline.call(L, latlngs, options);
      const color = String(options?.color || "").toLowerCase();
      const isOptimalRoute = color === "#d8ff6b" && Number(options?.weight || 0) >= 2.4;
      if (isOptimalRoute) {
        const points = flattenLatLngs(latlngs);
        const stride = Math.max(1, Math.ceil(points.length / 700));
        const sampled = points.filter((_, index) => index % stride === 0);
        if (points.length && sampled[sampled.length - 1] !== points[points.length - 1]) {
          sampled.push(points[points.length - 1]);
        }
        const record = { layer, points: sampled, flow: 1 };
        state.routes.push(record);
        const originalBindTooltip = layer.bindTooltip;
        layer.bindTooltip = function bindTooltipWithFlow(content, ...args) {
          const match = String(content).match(/Flow:\s*([\d,.]+)/i);
          if (match) record.flow = Number(match[1].replaceAll(",", "")) || 1;
          updateStatus();
          return originalBindTooltip.call(this, content, ...args);
        };
        updateStatus();
      }
      return layer;
    };
    wrapped.__acidchAdvancedWrapped = true;
    wrapped.__acidchOriginal = originalPolyline;
    L.polyline = wrapped;
  }

  const resizeCanvas = () => {
    const rect = mapContainer.getBoundingClientRect();
    const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    }
    return dpr;
  };

  const drawFrame = (timestamp) => {
    state.frame = raf(drawFrame);
    if (!ctx) return;
    const dpr = resizeCanvas();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const rect = mapContainer.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    if (!state.enabled || !state.routes.length) return;
    const map = state.routes.find((route) => route.layer?._map)?.layer?._map;
    if (!map) return;

    const elapsed = Math.max(0, (timestamp - state.startedAt) / 1000);
    const maxFlow = Math.max(1, ...state.routes.map((route) => route.flow || 1));
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    state.routes.forEach((route, routeIndex) => {
      const projected = route.points.map((point) => {
        const p = map.latLngToContainerPoint([point.lat, point.lng]);
        return { x: p.x, y: p.y };
      });
      const metrics = buildPolylineMetrics(projected);
      if (metrics.total < 2) return;
      const flowRatio = Math.max(0.08, Math.min(1, route.flow / maxFlow));

      ctx.beginPath();
      projected.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.strokeStyle = `rgba(98,236,255,${0.08 + 0.08 * state.glow})`;
      ctx.lineWidth = 3 + flowRatio * 3.5 * state.glow;
      ctx.shadowColor = "rgba(98,236,255,.72)";
      ctx.shadowBlur = 8 * state.glow;
      ctx.stroke();
      ctx.shadowBlur = 0;

      const count = particleCountForFlow(route.flow, maxFlow, state.density);
      for (let i = 0; i < count; i += 1) {
        const phase = (i / count + routeIndex * 0.137) % 1;
        const distance = elapsed * 62 * state.speed + phase * metrics.total;
        const point = pointAlongPolyline(metrics, distance);
        if (!point) continue;
        const radius = 1.25 + flowRatio * 1.8;
        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.rotate(point.angle);
        ctx.beginPath();
        ctx.moveTo(radius * 2.8, 0);
        ctx.lineTo(-radius * 1.8, radius * 1.25);
        ctx.lineTo(-radius * 1.2, 0);
        ctx.lineTo(-radius * 1.8, -radius * 1.25);
        ctx.closePath();
        ctx.fillStyle = flowRatio > 0.7 ? "rgba(216,255,107,.95)" : "rgba(98,236,255,.92)";
        ctx.shadowColor = flowRatio > 0.7 ? "rgba(216,255,107,.9)" : "rgba(98,236,255,.9)";
        ctx.shadowBlur = 5 + 6 * state.glow;
        ctx.fill();
        ctx.restore();
      }

      const pulsePhase = (elapsed * 0.8 + routeIndex * 0.23) % 1;
      const start = projected[0];
      const end = projected[projected.length - 1];
      [start, end].forEach((node, nodeIndex) => {
        const pulse = nodeIndex === 0 ? pulsePhase : (pulsePhase + 0.5) % 1;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 4 + pulse * 10, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(216,255,107,${0.45 * (1 - pulse)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    });
    ctx.restore();
  };

  enabledInput.addEventListener("change", () => {
    state.enabled = enabledInput.checked;
    state.startedAt = globalThis.performance?.now?.() || Date.now();
    updateStatus();
  });
  speedInput.addEventListener("input", () => {
    state.speed = Number(speedInput.value);
  });
  densityInput.addEventListener("input", () => {
    state.density = Number(densityInput.value);
  });
  glowInput.addEventListener("input", () => {
    state.glow = Number(glowInput.value);
  });
  ambientButton.addEventListener("click", () => {
    state.ambient = !state.ambient;
    shell.classList.toggle("is-advanced-ambient", state.ambient);
    ambientButton.classList.toggle("is-active", state.ambient);
  });

  doc.getElementById("geo4-routes")?.addEventListener("click", clearRoutes);
  doc.getElementById("geo4-run")?.addEventListener("click", clearRoutes);
  doc.getElementById("geo4-reset")?.addEventListener("click", clearRoutes);
  doc.getElementById("geo4-engine")?.addEventListener("change", clearRoutes);
  doc.getElementById("geo4-road-mode")?.addEventListener("change", clearRoutes);

  const observer = new globalThis.ResizeObserver?.(() => resizeCanvas());
  observer?.observe(mapContainer);
  state.frame = raf(drawFrame);

  globalThis.addEventListener?.("pagehide", () => {
    if (state.frame) caf(state.frame);
    observer?.disconnect();
  });
}

boot();
