import {
  buildPolylineMetrics,
  flattenLatLngs,
  particleCountForFlow,
  pointAlongPolyline,
} from "../lib/geospatial/flowGeometry.js";

const D = globalThis.document;
const frame = (fn) => globalThis.requestAnimationFrame(fn);

function boot() {
  const root = D?.getElementById("geo-v4");
  const shell = root?.querySelector(".geo4__shell");
  const mapBox = D?.getElementById("geo4-map");
  const L = globalThis.L;
  if (!root || !shell || !mapBox || !L) {
    globalThis.setTimeout(boot, 80);
    return;
  }
  if (root.dataset.advancedVisualReady === "true") return;
  root.dataset.advancedVisualReady = "true";

  const zh = (root.dataset.locale || "zh") === "zh";
  const text = zh
    ? {
        title: "真实路线流动",
        waiting: "运行优化后加载当前最优路径",
        live: "条真实最优路径正在流动",
        animation: "流动",
        speed: "速度",
        density: "密度",
        glow: "辉光",
        ambient: "环境层",
      }
    : {
        title: "Real Route Flow",
        waiting: "Load current optimal paths after optimisation",
        live: "real optimal paths in motion",
        animation: "Flow",
        speed: "Speed",
        density: "Density",
        glow: "Glow",
        ambient: "Ambient",
      };

  const reducedMotion = Boolean(
    globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches,
  );
  const state = {
    routes: [],
    enabled: !reducedMotion,
    speed: 1,
    density: 4,
    glow: 1,
    started: globalThis.performance?.now?.() || Date.now(),
  };

  const style = D.createElement("style");
  style.textContent = `
  .geo4__flow-canvas{position:absolute;inset:0;z-index:425;width:100%;height:100%;pointer-events:none;mix-blend-mode:screen}
  .geo4__ambient{position:absolute;inset:0;z-index:510;pointer-events:none;opacity:0;transition:opacity .3s;background:radial-gradient(circle at 50% 45%,transparent 24%,rgba(3,13,20,.14) 64%,rgba(0,5,9,.58) 100%)}
  .geo4__ambient:after{content:"";position:absolute;inset:0;opacity:.14;background:repeating-linear-gradient(0deg,rgba(98,236,255,.025) 0,rgba(98,236,255,.025) 1px,transparent 1px,transparent 5px);animation:geo-flow-scan 12s linear infinite}
  .geo4__shell.is-flow-ambient .geo4__ambient{opacity:1}
  .geo4__flow-panel{position:absolute;z-index:680;left:50%;bottom:12px;transform:translateX(-50%);width:min(520px,calc(100% - 760px));min-width:390px;padding:.62rem .72rem;border:1px solid rgba(98,236,255,.24);background:rgba(4,19,28,.88);backdrop-filter:blur(14px);box-shadow:0 14px 50px rgba(0,0,0,.26);color:#dff9fd}
  .geo4__flow-head{display:flex;justify-content:space-between;gap:.8rem;align-items:center}.geo4__flow-head b{font-size:.68rem}.geo4__flow-head small{color:#7897a3;font-size:.56rem;text-align:right}.geo4__flow-head em{display:block;color:#62ecff;font:700 .54rem monospace;letter-spacing:.13em;font-style:normal}
  .geo4__flow-controls{display:grid;grid-template-columns:auto 1fr 1fr 1fr auto;gap:.5rem;align-items:end;margin-top:.5rem}.geo4__flow-controls label{display:grid;gap:.18rem;color:#7e9ba7;font-size:.54rem}.geo4__flow-controls label:first-child{grid-auto-flow:column;align-items:center;white-space:nowrap}.geo4__flow-controls input[type=range]{width:100%;accent-color:#62ecff}.geo4__flow-controls input[type=checkbox]{accent-color:#d8ff6b}.geo4__flow-ambient{border:1px solid rgba(116,190,213,.2);background:transparent;color:#8ba8b3;padding:.34rem .42rem;font-size:.54rem;cursor:pointer}.geo4__flow-ambient.is-active{border-color:rgba(216,255,107,.5);color:#d8ff6b}
  .geo4__flow-live{position:absolute;z-index:615;top:1rem;left:50%;transform:translateX(-50%);display:none;align-items:center;gap:.38rem;padding:.3rem .48rem;border:1px solid rgba(216,255,107,.26);background:rgba(5,20,27,.8);color:#a9c4cc;font:600 .55rem monospace;pointer-events:none}.geo4__flow-live.is-live{display:flex}.geo4__flow-live i{width:6px;height:6px;border-radius:50%;background:#d8ff6b;box-shadow:0 0 12px rgba(216,255,107,.9);animation:geo-flow-pulse 1.4s ease-in-out infinite}
  @keyframes geo-flow-pulse{0%,100%{opacity:.35;transform:scale(.75)}50%{opacity:1;transform:scale(1.3)}}@keyframes geo-flow-scan{to{transform:translateY(24px)}}
  @media(prefers-reduced-motion:reduce){.geo4__ambient:after,.geo4__flow-live i{animation:none}}
  @media(max-width:1180px){.geo4__flow-panel{left:auto;right:1rem;bottom:1rem;transform:none;width:350px;min-width:0}.geo4__flow-controls{grid-template-columns:1fr 1fr 1fr}}
  @media(max-width:820px){.geo4__flow-panel{right:.5rem;left:.5rem;bottom:3rem;width:auto;min-width:0;transform:none}.geo4__flow-controls{grid-template-columns:1fr 1fr}.geo4__flow-live{top:176px}}
  `;
  D.head.appendChild(style);

  const canvas = D.createElement("canvas");
  canvas.className = "geo4__flow-canvas";
  canvas.setAttribute("aria-hidden", "true");
  mapBox.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const ambient = D.createElement("div");
  ambient.className = "geo4__ambient";
  ambient.setAttribute("aria-hidden", "true");
  shell.appendChild(ambient);
  shell.classList.add("is-flow-ambient");

  const badge = D.createElement("div");
  badge.className = "geo4__flow-live";
  badge.innerHTML = "<i></i><span>LIVE ROUTE FLOW</span>";
  shell.appendChild(badge);

  const panel = D.createElement("section");
  panel.className = "geo4__flow-panel";
  panel.innerHTML = `
    <div class="geo4__flow-head"><div><em>ROUTE FLOW</em><b>${text.title}</b></div><small id="geo4-flow-state">${text.waiting}</small></div>
    <div class="geo4__flow-controls">
      <label><input id="geo4-flow-toggle" type="checkbox" ${state.enabled ? "checked" : ""}><span>${text.animation}</span></label>
      <label><span>${text.speed}</span><input id="geo4-flow-speed" type="range" min="0.25" max="2.5" step="0.25" value="1"></label>
      <label><span>${text.density}</span><input id="geo4-flow-density" type="range" min="1" max="8" step="1" value="4"></label>
      <label><span>${text.glow}</span><input id="geo4-flow-glow" type="range" min="0" max="2" step="0.25" value="1"></label>
      <button id="geo4-flow-ambient" class="geo4__flow-ambient is-active" type="button">${text.ambient}</button>
    </div>`;
  shell.appendChild(panel);

  const status = panel.querySelector("#geo4-flow-state");
  const toggle = panel.querySelector("#geo4-flow-toggle");
  const speed = panel.querySelector("#geo4-flow-speed");
  const density = panel.querySelector("#geo4-flow-density");
  const glow = panel.querySelector("#geo4-flow-glow");
  const ambientButton = panel.querySelector("#geo4-flow-ambient");

  const updateStatus = () => {
    if (!state.routes.length) {
      status.textContent = text.waiting;
      badge.classList.remove("is-live");
      return;
    }
    status.textContent = `${state.routes.length} ${text.live}`;
    badge.classList.toggle("is-live", state.enabled);
  };
  const clear = () => {
    state.routes = [];
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateStatus();
  };

  const original = L.polyline.__acidchFlowOriginal || L.polyline;
  if (!L.polyline.__acidchFlowWrapped) {
    const wrapped = function flowAwarePolyline(latlngs, options = {}) {
      const layer = original.call(L, latlngs, options);
      const acidRoute =
        String(options.color || "").toLowerCase() === "#d8ff6b" &&
        Number(options.weight || 0) >= 2.4;
      if (acidRoute) {
        const all = flattenLatLngs(latlngs);
        const stride = Math.max(1, Math.ceil(all.length / 700));
        const points = all.filter((_, index) => index % stride === 0);
        if (all.length && points.at(-1) !== all.at(-1)) points.push(all.at(-1));
        const record = { layer, points, flow: 1 };
        state.routes.push(record);
        const bind = layer.bindTooltip;
        layer.bindTooltip = function bindFlowTooltip(content, ...args) {
          const match = String(content).match(/Flow:\s*([\d,.]+)/i);
          if (match) record.flow = Number(match[1].replaceAll(",", "")) || 1;
          updateStatus();
          return bind.call(this, content, ...args);
        };
        updateStatus();
      }
      return layer;
    };
    wrapped.__acidchFlowWrapped = true;
    wrapped.__acidchFlowOriginal = original;
    L.polyline = wrapped;
  }

  function fitCanvas() {
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
    return { dpr, rect };
  }

  function animate(now) {
    frame(animate);
    if (!ctx) return;
    const { dpr, rect } = fitCanvas();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    if (!state.enabled || !state.routes.length) return;
    const map = state.routes.find((route) => route.layer?._map)?.layer?._map;
    if (!map) return;
    const elapsed = Math.max(0, (now - state.started) / 1000);
    const maxFlow = Math.max(1, ...state.routes.map((route) => route.flow));
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    state.routes.forEach((route, routeIndex) => {
      const projected = route.points.map((point) => {
        const p = map.latLngToContainerPoint([point.lat, point.lng]);
        return { x: p.x, y: p.y };
      });
      const metrics = buildPolylineMetrics(projected);
      if (metrics.total < 2) return;
      const ratio = Math.max(0.08, Math.min(1, route.flow / maxFlow));

      ctx.beginPath();
      projected.forEach((point, index) =>
        index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y),
      );
      ctx.strokeStyle = `rgba(98,236,255,${0.06 + state.glow * 0.08})`;
      ctx.lineWidth = 2.5 + ratio * 4 * state.glow;
      ctx.shadowColor = "rgba(98,236,255,.75)";
      ctx.shadowBlur = 8 * state.glow;
      ctx.stroke();
      ctx.shadowBlur = 0;

      const count = particleCountForFlow(route.flow, maxFlow, state.density);
      for (let index = 0; index < count; index += 1) {
        const phase = (index / count + routeIndex * 0.137) % 1;
        const p = pointAlongPolyline(
          metrics,
          elapsed * 62 * state.speed + phase * metrics.total,
        );
        if (!p) continue;
        const r = 1.2 + ratio * 1.7;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.beginPath();
        ctx.moveTo(r * 2.8, 0);
        ctx.lineTo(-r * 1.7, r * 1.2);
        ctx.lineTo(-r * 1.1, 0);
        ctx.lineTo(-r * 1.7, -r * 1.2);
        ctx.closePath();
        ctx.fillStyle = ratio > 0.7 ? "rgba(216,255,107,.96)" : "rgba(98,236,255,.93)";
        ctx.shadowColor = ratio > 0.7 ? "rgba(216,255,107,.9)" : "rgba(98,236,255,.9)";
        ctx.shadowBlur = 5 + state.glow * 6;
        ctx.fill();
        ctx.restore();
      }

      const pulse = (elapsed * 0.8 + routeIndex * 0.19) % 1;
      for (const node of [projected[0], projected.at(-1)]) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 4 + pulse * 10, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(216,255,107,${0.42 * (1 - pulse)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });
    ctx.restore();
  }

  toggle.addEventListener("change", () => {
    state.enabled = toggle.checked;
    state.started = globalThis.performance?.now?.() || Date.now();
    updateStatus();
  });
  speed.addEventListener("input", () => (state.speed = Number(speed.value)));
  density.addEventListener("input", () => (state.density = Number(density.value)));
  glow.addEventListener("input", () => (state.glow = Number(glow.value)));
  ambientButton.addEventListener("click", () => {
    shell.classList.toggle("is-flow-ambient");
    ambientButton.classList.toggle("is-active");
  });

  for (const id of ["geo4-routes", "geo4-run", "geo4-reset", "geo4-engine", "geo4-road-mode"]) {
    D.getElementById(id)?.addEventListener("click", clear);
    if (id === "geo4-engine" || id === "geo4-road-mode") {
      D.getElementById(id)?.addEventListener("change", clear);
    }
  }

  const observer = globalThis.ResizeObserver
    ? new globalThis.ResizeObserver(() => fitCanvas())
    : null;
  observer?.observe(mapBox);
  updateStatus();
  frame(animate);
}

boot();
