import { getGeospatialStore } from "../lib/geospatial/geospatialStore.js";

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
        flow: "货物流等级",
        low: "低",
        medium: "中",
        high: "高",
        source: "设施流出",
        sink: "需求流入",
      }
    : {
        flow: "Flow tier",
        low: "Low",
        medium: "Medium",
        high: "High",
        source: "Facility outflow",
        sink: "Demand inflow",
      };

  const style = D.createElement("style");
  style.textContent = `
    .geo4__flow-tier{position:absolute;z-index:660;left:1rem;bottom:3.6rem;padding:.48rem .58rem;border:1px solid rgba(116,190,213,.18);background:rgba(4,19,28,.78);backdrop-filter:blur(10px);color:#8ca8b2;pointer-events:none}.geo4__flow-tier b{display:block;color:#dff9fd;font-size:.58rem;margin-bottom:.3rem}.geo4__flow-tier div{display:flex;gap:.55rem;align-items:center;font-size:.52rem}.geo4__flow-tier em{display:inline-block;width:28px;height:3px;border-radius:99px;box-shadow:0 0 8px currentColor}.geo4__flow-tier .low{color:#62ecff}.geo4__flow-tier .mid{color:#b5f6ff}.geo4__flow-tier .high{color:#d8ff6b}.geo4__flow-tier small{display:block;margin-top:.28rem;color:#627f8b;font-size:.48rem}
    .geo4__node-canvas{position:absolute;inset:0;z-index:430;width:100%;height:100%;pointer-events:none;mix-blend-mode:screen}
    @media(max-width:820px){.geo4__flow-tier{left:.5rem;bottom:7.2rem}}
  `;
  D.head.appendChild(style);

  const tier = D.createElement("div");
  tier.className = "geo4__flow-tier";
  tier.innerHTML = `<b>${text.flow}</b><div><span><em class="low"></em> ${text.low}</span><span><em class="mid"></em> ${text.medium}</span><span><em class="high"></em> ${text.high}</span></div><small>${text.source} · ${text.sink}</small>`;
  shell.appendChild(tier);

  const canvas = D.createElement("canvas");
  canvas.className = "geo4__node-canvas";
  canvas.setAttribute("aria-hidden", "true");
  mapBox.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  const store = getGeospatialStore();
  const routeState = { routes: [], animationFrame: 0, rect: null, dpr: 1 };
  const clearCanvas = () => {
    if (!ctx || !routeState.rect) return;
    ctx.clearRect(0, 0, routeState.rect.width, routeState.rect.height);
  };
  const shouldAnimate = () => Boolean(ctx && routeState.routes.length && !D.hidden);
  const stopAnimation = () => {
    if (!routeState.animationFrame) return;
    globalThis.cancelAnimationFrame(routeState.animationFrame);
    routeState.animationFrame = 0;
  };
  const scheduleAnimation = () => {
    if (routeState.animationFrame || !shouldAnimate()) return;
    routeState.animationFrame = globalThis.requestAnimationFrame(draw);
  };
  const syncRoutes = (snapshot = store.getState()) => {
    const map = snapshot.presentation.map;
    routeState.routes = (snapshot.routeVisuals || [])
      .filter((route) => route.coordinates?.length >= 2)
      .map((route) => {
        const start = route.coordinates[0];
        const end = route.coordinates.at(-1);
        return {
          map,
          start: { lat: start.lat, lng: start.lon ?? start.lng },
          end: { lat: end.lat, lng: end.lon ?? end.lng },
          flow: route.flow,
        };
      });
    if (routeState.routes.length) scheduleAnimation();
    else {
      stopAnimation();
      clearCanvas();
    }
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
    routeState.rect = rect;
    routeState.dpr = dpr;
    return { rect, dpr };
  }

  function draw() {
    routeState.animationFrame = 0;
    if (!shouldAnimate()) {
      clearCanvas();
      return;
    }
    const { rect, dpr } = routeState.rect
      ? { rect: routeState.rect, dpr: routeState.dpr }
      : fit();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    const active = routeState.routes.filter(
      (route) => route.map && route.start && route.end,
    );
    if (!active.length) return;
    const map = active[0].map;
    const maxFlow = Math.max(1, ...active.map((route) => route.flow));
    const aggregate = new Map();
    for (const route of active) {
      for (const [kind, point] of [
        ["source", route.start],
        ["sink", route.end],
      ]) {
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
    scheduleAnimation();
  }

  const resizeObserver = globalThis.ResizeObserver
    ? new globalThis.ResizeObserver(() => {
        fit();
        if (shouldAnimate()) scheduleAnimation();
        else clearCanvas();
      })
    : null;
  resizeObserver?.observe(mapBox);
  D.addEventListener("visibilitychange", () => {
    if (D.hidden) {
      stopAnimation();
      clearCanvas();
    } else scheduleAnimation();
  });
  fit();
  scheduleAnimation();
}

boot();
