import {
  buildPolylineMetrics,
  particleCountForFlow,
  pointAlongPolyline,
} from "../lib/geospatial/flowGeometry.js";
import { getGeospatialStore } from "../lib/geospatial/geospatialStore.js";

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
        flowUnit: "总流量",
        animation: "流动",
        speed: "速度",
        density: "密度",
        glow: "辉光",
        ambient: "环境层",
        low: "低",
        medium: "中",
        high: "高",
      }
    : {
        title: "Real Route Flow",
        waiting: "Load current optimal paths after optimisation",
        live: "real optimal paths in motion",
        flowUnit: "Total flow",
        animation: "Flow",
        speed: "Speed",
        density: "Density",
        glow: "Glow",
        ambient: "Ambient",
        low: "Low",
        medium: "Medium",
        high: "High",
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
  .geo4__flow-canvas{position:absolute;inset:0;z-index:425;width:100%;height:100%;pointer-events:none;mix-blend-mode:screen;transition:opacity .25s}
  .geo4__ambient{position:absolute;inset:0;z-index:510;pointer-events:none;opacity:0;transition:opacity .3s;background:radial-gradient(circle at 46% 45%,transparent 22%,rgba(3,13,20,.12) 62%,rgba(0,5,9,.58) 100%)}
  .geo4__ambient:before{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 0 44%,rgba(98,236,255,.018) 49%,transparent 54%);opacity:.7}
  .geo4__ambient:after{content:"";position:absolute;inset:0;opacity:.14;background:repeating-linear-gradient(0deg,rgba(98,236,255,.025) 0,rgba(98,236,255,.025) 1px,transparent 1px,transparent 5px);animation:geo-flow-scan 12s linear infinite}
  .geo4__shell.is-flow-ambient .geo4__ambient{opacity:1}
  .geo4__flow-panel{position:absolute;z-index:680;left:50%;bottom:12px;transform:translateX(-50%);width:min(540px,calc(100% - 760px));min-width:390px;padding:.62rem .72rem .58rem;border:1px solid rgba(98,236,255,.28);background:linear-gradient(135deg,rgba(4,19,28,.93),rgba(4,19,28,.78));backdrop-filter:blur(15px);box-shadow:0 14px 50px rgba(0,0,0,.3);color:#dff9fd;overflow:hidden}
  .geo4__flow-panel:before{content:"";position:absolute;top:0;left:0;width:42%;height:1px;background:linear-gradient(90deg,#62ecff,rgba(98,236,255,0));box-shadow:0 0 12px rgba(98,236,255,.55)}
  .geo4__flow-head{display:flex;justify-content:space-between;gap:.8rem;align-items:center}.geo4__flow-head b{font-size:.69rem}.geo4__flow-head small{color:#7897a3;font-size:.55rem;text-align:right;line-height:1.35}.geo4__flow-head em{display:block;color:#62ecff;font:700 .54rem monospace;letter-spacing:.13em;font-style:normal}
  .geo4__flow-controls{display:grid;grid-template-columns:auto 1fr 1fr 1fr auto;gap:.5rem;align-items:end;margin-top:.48rem}.geo4__flow-controls label{display:grid;gap:.18rem;color:#7e9ba7;font-size:.54rem}.geo4__flow-controls label:first-child{grid-auto-flow:column;align-items:center;white-space:nowrap}.geo4__flow-controls input[type=range]{width:100%;accent-color:#62ecff}.geo4__flow-controls input[type=checkbox]{accent-color:#d8ff6b}.geo4__flow-ambient{border:1px solid rgba(116,190,213,.2);background:transparent;color:#8ba8b3;padding:.34rem .42rem;font-size:.54rem;cursor:pointer}.geo4__flow-ambient.is-active{border-color:rgba(216,255,107,.5);color:#d8ff6b}
  .geo4__flow-scale{display:grid;grid-template-columns:auto 1fr auto;gap:.42rem;align-items:center;margin-top:.42rem;color:#668591;font:600 .48rem monospace}.geo4__flow-scale i{display:block;height:4px;border-radius:99px;background:linear-gradient(90deg,rgba(98,236,255,.45),#62ecff 55%,#d8ff6b);box-shadow:0 0 12px rgba(98,236,255,.15)}
  .geo4__flow-live{position:absolute;z-index:615;top:1rem;left:50%;transform:translateX(-50%);display:none;align-items:center;gap:.38rem;padding:.3rem .48rem;border:1px solid rgba(216,255,107,.3);background:rgba(5,20,27,.84);color:#a9c4cc;font:600 .55rem monospace;pointer-events:none}.geo4__flow-live.is-live{display:flex}.geo4__flow-live i{width:6px;height:6px;border-radius:50%;background:#d8ff6b;box-shadow:0 0 12px rgba(216,255,107,.9);animation:geo-flow-pulse 1.4s ease-in-out infinite}
  @keyframes geo-flow-pulse{0%,100%{opacity:.35;transform:scale(.75)}50%{opacity:1;transform:scale(1.3)}}@keyframes geo-flow-scan{to{transform:translateY(24px)}}
  @media(prefers-reduced-motion:reduce){.geo4__ambient:after,.geo4__flow-live i{animation:none}}
  @media(max-width:1180px){.geo4__flow-panel{left:auto;right:1rem;bottom:1rem;transform:none;width:350px;min-width:0}.geo4__flow-controls{grid-template-columns:1fr 1fr 1fr}}
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
    </div>
    <div class="geo4__flow-scale"><span>${text.low}</span><i></i><span>${text.high}</span></div>`;
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
    const totalFlow = state.routes.reduce((sum, route) => sum + route.flow, 0);
    status.textContent = `${state.routes.length} ${text.live} · ${text.flowUnit} ${Math.round(totalFlow).toLocaleString()}`;
    badge.classList.toggle("is-live", state.enabled);
  };
  const clear = () => {
    state.routes = [];
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateStatus();
  };

  const store = getGeospatialStore();
  const syncRoutes = (snapshot = store.getState()) => {
    const map = snapshot.presentation.map;
    state.routes = (snapshot.routeVisuals || []).map((route) => {
      const all = route.coordinates || [];
      const stride = Math.max(1, Math.ceil(all.length / 700));
      const points = all
        .filter((_, index) => index % stride === 0)
        .map((point) => ({ lat: point.lat, lng: point.lon ?? point.lng }));
      if (all.length) {
        const last = all.at(-1);
        const normalized = { lat: last.lat, lng: last.lon ?? last.lng };
        if (
          !points.length ||
          points.at(-1).lat !== normalized.lat ||
          points.at(-1).lng !== normalized.lng
        )
          points.push(normalized);
      }
      return { map, points, flow: route.flow, travelMin: route.travelMin };
    });
    updateStatus();
  };
  store.subscribe((snapshot, reason) => {
    if (
      reason === "route-visuals" ||
      reason === "reset" ||
      String(reason).includes("commit:mainSolution")
    )
      syncRoutes(snapshot);
  });
  syncRoutes();

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

  function drawPath(projected, colour, width, alpha, blur = 0) {
    ctx.beginPath();
    projected.forEach((point, index) =>
      index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y),
    );
    ctx.strokeStyle = colour;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = colour;
    ctx.shadowBlur = blur;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  function animate(now) {
    frame(animate);
    if (!ctx) return;
    const { dpr, rect } = fitCanvas();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    if (!state.enabled || !state.routes.length) return;
    const map = state.routes.find((route) => route.map)?.map;
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
      const hot = ratio > 0.68;
      const core = hot ? "rgba(216,255,107,.96)" : "rgba(98,236,255,.96)";

      drawPath(
        projected,
        "rgba(98,236,255,.72)",
        3.4 + ratio * 5.2 * state.glow,
        0.045 + state.glow * 0.055,
        12 * state.glow,
      );
      drawPath(
        projected,
        core,
        0.7 + ratio * 1.15,
        0.28 + ratio * 0.38,
        3.5 * state.glow,
      );

      const count = particleCountForFlow(route.flow, maxFlow, state.density);
      const traversalSeconds = route.travelMin
        ? Math.max(4.5, Math.min(18, route.travelMin / 2.2))
        : 9.5;
      for (let index = 0; index < count; index += 1) {
        const phase = (index / count + routeIndex * 0.137) % 1;
        const distance =
          (elapsed * state.speed * metrics.total) / traversalSeconds +
          phase * metrics.total;
        const p = pointAlongPolyline(metrics, distance);
        if (!p) continue;
        const r = 1.15 + ratio * 1.65;
        const tail = 5 + ratio * 8;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        const gradient = ctx.createLinearGradient(-tail, 0, r * 3, 0);
        gradient.addColorStop(0, hot ? "rgba(216,255,107,0)" : "rgba(98,236,255,0)");
        gradient.addColorStop(
          0.68,
          hot ? "rgba(216,255,107,.38)" : "rgba(98,236,255,.34)",
        );
        gradient.addColorStop(
          1,
          hot ? "rgba(216,255,107,.98)" : "rgba(98,236,255,.98)",
        );
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1 + ratio * 1.2;
        ctx.shadowColor = hot ? "rgba(216,255,107,.9)" : "rgba(98,236,255,.9)";
        ctx.shadowBlur = 5 + state.glow * 7;
        ctx.beginPath();
        ctx.moveTo(-tail, 0);
        ctx.lineTo(r * 2.4, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(r * 3, 0);
        ctx.lineTo(-r * 1.2, r * 1.15);
        ctx.lineTo(-r * 0.6, 0);
        ctx.lineTo(-r * 1.2, -r * 1.15);
        ctx.closePath();
        ctx.fillStyle = hot ? "rgba(216,255,107,.98)" : "rgba(98,236,255,.98)";
        ctx.fill();
        ctx.restore();
      }

      const pulse = (elapsed * 0.8 + routeIndex * 0.19) % 1;
      for (const [nodeIndex, node] of [projected[0], projected.at(-1)].entries()) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 4 + pulse * (nodeIndex ? 11 : 8), 0, Math.PI * 2);
        ctx.strokeStyle = nodeIndex
          ? `rgba(255,117,154,${0.36 * (1 - pulse)})`
          : `rgba(216,255,107,${0.42 * (1 - pulse)})`;
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

  for (const id of [
    "geo4-routes",
    "geo4-run",
    "geo4-reset",
    "geo4-engine",
    "geo4-road-mode",
  ]) {
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
