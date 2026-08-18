import {
  classifyServiceUrl,
  normalizeGisEndpoints,
  rewriteServiceUrl,
  shareJsonResponse,
  timeoutForService,
} from "../lib/geospatial/serviceRuntime.js";

const D = globalThis.document;

function boot() {
  const root = D?.getElementById("geo-v4");
  const graphStatus = D?.getElementById("geo4-graph-status");
  if (!root || !graphStatus) {
    globalThis.setTimeout(boot, 60);
    return;
  }
  if (root.dataset.serviceResilienceReady === "true") return;
  root.dataset.serviceResilienceReady = "true";

  const zh = (root.dataset.locale || "zh") === "zh";
  const copy = zh
    ? {
        title: "外部 GIS 服务",
        idle: "待调用",
        pending: "请求中",
        ok: "正常",
        degraded: "降级",
        policy: "仅由用户操作触发；不做后台轮询。失败时保留课程 OD 基线或现有结果。",
      }
    : {
        title: "External GIS services",
        idle: "Idle",
        pending: "Requesting",
        ok: "Healthy",
        degraded: "Degraded",
        policy: "User-triggered only; no background polling. Failures preserve the course OD baseline or existing result.",
      };

  const style = D.createElement("style");
  style.textContent = `
    .geo4__service-health{margin-top:.52rem;padding:.45rem .5rem;border:1px solid rgba(116,190,213,.14);background:rgba(7,29,39,.48)}
    .geo4__service-health-head{display:flex;justify-content:space-between;gap:.5rem;align-items:center;color:#7695a0;font-size:.49rem;text-transform:uppercase;letter-spacing:.08em}
    .geo4__service-health-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.28rem;margin-top:.35rem}
    .geo4__service-chip{display:grid;grid-template-columns:auto minmax(0,1fr);gap:.28rem .35rem;align-items:center;padding:.28rem .32rem;border:1px solid rgba(116,190,213,.1);background:rgba(8,35,46,.42)}
    .geo4__service-chip i{width:6px;height:6px;border-radius:50%;background:#5c7882;box-shadow:0 0 0 2px rgba(92,120,130,.1)}
    .geo4__service-chip strong{font:700 .49rem monospace;color:#dceff3;overflow:hidden;text-overflow:ellipsis}
    .geo4__service-chip small{grid-column:1/-1;color:#607d87;font-size:.43rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .geo4__service-chip[data-state="pending"] i{background:#ffcc66;box-shadow:0 0 8px rgba(255,204,102,.5)}
    .geo4__service-chip[data-state="ok"] i{background:#d8ff6b;box-shadow:0 0 8px rgba(216,255,107,.45)}
    .geo4__service-chip[data-state="degraded"] i{background:#ff759a;box-shadow:0 0 8px rgba(255,117,154,.45)}
    .geo4__service-policy{margin:.32rem 0 0;color:#58747e;font-size:.45rem;line-height:1.35}
  `;
  D.head.appendChild(style);

  const panel = D.createElement("div");
  panel.className = "geo4__service-health";
  panel.innerHTML = `<div class="geo4__service-health-head"><span>GIS SERVICE HEALTH</span><strong>${copy.title}</strong></div><div class="geo4__service-health-grid"><div class="geo4__service-chip" data-service="nominatim" data-state="idle"><i></i><strong>Nominatim</strong><small>${copy.idle}</small></div><div class="geo4__service-chip" data-service="osrm" data-state="idle"><i></i><strong>OSRM</strong><small>${copy.idle}</small></div><div class="geo4__service-chip" data-service="overpass" data-state="idle"><i></i><strong>Overpass</strong><small>${copy.idle}</small></div></div><p class="geo4__service-policy">${copy.policy}</p>`;
  graphStatus.insertAdjacentElement("afterend", panel);

  const states = new Map(
    ["nominatim", "osrm", "overpass"].map((name) => [
      name,
      { state: "idle", latencyMs: null, status: null, updatedAt: 0 },
    ]),
  );

  function render(service) {
    const chip = panel.querySelector(`[data-service="${service}"]`);
    const state = states.get(service);
    if (!chip || !state) return;
    chip.dataset.state = state.state;
    const detail = chip.querySelector("small");
    const label = copy[state.state] || copy.idle;
    const latency = Number.isFinite(state.latencyMs) ? ` · ${Math.round(state.latencyMs)} ms` : "";
    const status = Number.isFinite(state.status) ? ` · HTTP ${state.status}` : "";
    detail.textContent = `${label}${status}${latency}`;
    root.dataset[`service${service[0].toUpperCase()}${service.slice(1)}`] = state.state;
  }

  function update(service, patch) {
    if (!states.has(service)) return;
    states.set(service, { ...states.get(service), ...patch, updatedAt: Date.now() });
    render(service);
  }

  function runtimeOverrides() {
    const stored = (() => {
      try {
        return JSON.parse(globalThis.localStorage?.getItem("acidch-gis-endpoints") || "{}") || {};
      } catch {
        return {};
      }
    })();
    return normalizeGisEndpoints({
      ...stored,
      ...(globalThis.__ACIDCH_GIS_ENDPOINTS__ || {}),
    });
  }

  const originalFetch = globalThis.fetch;
  if (typeof originalFetch !== "function" || originalFetch.__acidchServiceResilienceWrapped) return;

  const wrappedFetch = async (input, init = {}) => {
    const sourceUrl = typeof input === "string" ? input : input?.url || "";
    const service = classifyServiceUrl(sourceUrl);
    if (!service) return originalFetch.call(globalThis, input, init);

    const rewritten = rewriteServiceUrl(sourceUrl, runtimeOverrides());
    const timeoutMs = timeoutForService(service);
    const controller = new globalThis.AbortController();
    const inheritedSignal = init?.signal || (typeof input !== "string" ? input?.signal : null);
    const inheritedAbort = () => controller.abort(inheritedSignal?.reason);
    if (inheritedSignal?.aborted) inheritedAbort();
    else inheritedSignal?.addEventListener?.("abort", inheritedAbort, { once: true });
    const timer = globalThis.setTimeout(
      () => controller.abort(new globalThis.DOMException("GIS service timeout", "TimeoutError")),
      timeoutMs,
    );
    const started = globalThis.performance?.now?.() || Date.now();
    update(service, { state: "pending", latencyMs: null, status: null });

    let requestInput = rewritten;
    if (typeof input !== "string" && globalThis.Request && input instanceof globalThis.Request) {
      requestInput = new globalThis.Request(rewritten, input);
    }

    try {
      const response = await originalFetch.call(globalThis, requestInput, {
        ...init,
        signal: controller.signal,
      });
      const ended = globalThis.performance?.now?.() || Date.now();
      update(service, {
        state: response.ok ? "ok" : "degraded",
        latencyMs: ended - started,
        status: response.status,
      });
      return service === "overpass" && response.ok ? shareJsonResponse(response) : response;
    } catch (error) {
      const ended = globalThis.performance?.now?.() || Date.now();
      update(service, {
        state: "degraded",
        latencyMs: ended - started,
        status: null,
      });
      throw error;
    } finally {
      globalThis.clearTimeout(timer);
      inheritedSignal?.removeEventListener?.("abort", inheritedAbort);
    }
  };

  wrappedFetch.__acidchServiceResilienceWrapped = true;
  wrappedFetch.__acidchServiceResilienceOriginal = originalFetch;
  globalThis.fetch = wrappedFetch;
  globalThis.__ACIDCH_GIS_RUNTIME__ = {
    getEndpoints: runtimeOverrides,
    getHealth: () => Object.fromEntries(states),
  };
}

boot();
