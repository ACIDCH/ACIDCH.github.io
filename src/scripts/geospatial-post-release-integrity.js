import {
  isDecisionControl,
  isNominatimRequest,
  isPrimaryOptimalFlowLayer,
} from "../lib/geospatial/postReleaseIntegrity.js";

const D = globalThis.document;

function boot() {
  const root = D?.getElementById("geo-v4");
  const shell = root?.querySelector(".geo4__shell");
  const L = globalThis.L;
  if (!root || !shell || !L) {
    globalThis.setTimeout(boot, 80);
    return;
  }
  if (root.dataset.postReleaseIntegrityReady === "true") return;
  root.dataset.postReleaseIntegrityReady = "true";

  const zh = (root.dataset.locale || "zh") === "zh";
  const copy = zh
    ? {
        stale: "参数已变更 · 请重新运行优化",
        calculating: "正在更新结果…",
        staleAction: "参数已变更，请先重新运行优化再继续此操作。",
        transNeedOsm:
          "两级转运需要 OSM 道路网络，以保证转运成本与当前拥堵、封路和新增道路情景一致。请先加载 OSM 道路图。",
        transNote:
          "Factory → Warehouse → Demand 两级转运使用当前 OSM 道路情景与严格仓库吞吐容量。",
        osmLabel: "OSM 道路网络",
      }
    : {
        stale: "Inputs changed · run optimisation again",
        calculating: "Updating results…",
        staleAction: "Inputs changed. Run optimisation again before continuing.",
        transNeedOsm:
          "Two-echelon transshipment requires the OSM Road Network so its costs remain consistent with the active congestion, closure and proposed-road scenario. Load the OSM road graph first.",
        transNote:
          "Factory → Warehouse → Demand transshipment uses the active OSM road scenario with strict warehouse throughput capacity.",
        osmLabel: "OSM Road Network",
      };

  const style = D.createElement("style");
  style.textContent = `
    .geo4__freshness{display:none;margin:.5rem 0 0;padding:.38rem .46rem;border:1px solid rgba(255,204,102,.3);background:rgba(73,52,18,.22);color:#ffdb86;font-size:.55rem;line-height:1.35}
    #geo-v4[data-result-freshness="stale"] .geo4__freshness,#geo-v4[data-result-freshness="calculating"] .geo4__freshness{display:block}
    #geo-v4[data-result-freshness="calculating"] .geo4__freshness{border-color:rgba(98,236,255,.24);background:rgba(11,48,61,.28);color:#9cefff}
    .geo4__shell:not([data-analysis-layer="coverage"]) .leaflet-overlay-pane path.geo4-demand-node{stroke:#ff759a!important;fill:#ff3d78!important;stroke-width:1.5px!important;filter:none!important;animation:none!important}
    .geo4__road-hud{opacity:0!important;visibility:hidden;transform:translateY(-4px);transition:opacity .22s,transform .22s,visibility .22s}
    .geo4__shell[data-network-engine="osm"] .geo4__road-hud{opacity:1!important;visibility:visible;transform:none}
    .geo4__coverage-hud-v2{opacity:0!important;visibility:hidden;transform:translateY(-4px);transition:opacity .22s,transform .22s,visibility .22s}
    .geo4__shell[data-network-engine="osm"][data-analysis-layer="coverage"] .geo4__coverage-hud-v2{opacity:1!important;visibility:visible;transform:none}
  `;
  D.head.appendChild(style);

  const results = root.querySelector(".geo4__results");
  const freshness = D.createElement("div");
  freshness.className = "geo4__freshness";
  freshness.setAttribute("role", "status");
  freshness.setAttribute("aria-live", "polite");
  results?.querySelector(".geo4__results-head")?.insertAdjacentElement("afterend", freshness);

  const status = D.getElementById("geo4-status");
  const solvedText = zh ? "当前情景已完成重新优化" : "Scenario re-optimised";
  const infeasibleText = zh ? "没有可行方案" : "No feasible solution";

  function setFreshness(value) {
    root.dataset.resultFreshness = value;
    if (value === "stale") freshness.textContent = copy.stale;
    else if (value === "calculating") freshness.textContent = copy.calculating;
    else freshness.textContent = "";
  }

  function markStale() {
    if (root.dataset.resultFreshness !== "calculating") setFreshness("stale");
  }

  function markCalculating() {
    setFreshness("calculating");
  }

  function markFreshFromStatus() {
    const text = String(status?.textContent || "");
    if (text.includes(solvedText) || text.includes(infeasibleText)) setFreshness("fresh");
  }

  const statusObserver =
    status && globalThis.MutationObserver
      ? new globalThis.MutationObserver(markFreshFromStatus)
      : null;
  statusObserver?.observe(status, { childList: true, characterData: true, subtree: true });
  markFreshFromStatus();
  if (!root.dataset.resultFreshness) setFreshness("fresh");

  root.addEventListener("input", (event) => {
    if (isDecisionControl(event.target)) markStale();
  });
  root.addEventListener("change", (event) => {
    if (isDecisionControl(event.target)) markStale();
  });
  root.addEventListener("click", (event) => {
    const step = event.target?.closest?.("[data-step]");
    if (step && ["maxOpen", "fleet", "newRoads"].includes(step.dataset.step)) markStale();
  });

  for (const id of ["geo4-run", "geo4-reset"]) {
    D.getElementById(id)?.addEventListener("click", markCalculating, true);
  }

  function blockStale(event) {
    if (root.dataset.resultFreshness !== "stale") return false;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (status) status.textContent = copy.staleAction;
    return true;
  }

  for (const id of ["geo4-routes", "geo4-save-a", "geo4-save-b"]) {
    D.getElementById(id)?.addEventListener("click", blockStale, true);
  }

  const state = { map: null };
  function captureMap(layer) {
    if (!layer || typeof layer.addTo !== "function") return;
    const originalAddTo = layer.addTo;
    layer.addTo = function integrityCaptureAddTo(target) {
      const result = originalAddTo.call(this, target);
      if (!state.map && target?._map) state.map = target._map;
      return result;
    };
  }

  if (!L.polyline.__acidchPostReleaseWrapped) {
    const originalPolyline = L.polyline;
    const wrappedPolyline = (...args) => {
      const layer = originalPolyline.apply(L, args);
      captureMap(layer);
      return layer;
    };
    wrappedPolyline.__acidchPostReleaseWrapped = true;
    wrappedPolyline.__acidchPostReleaseOriginal = originalPolyline;
    L.polyline = wrappedPolyline;
  }

  const stripCoverageStatus = (content) =>
    String(content).replace(
      /<br>(?:已覆盖|未覆盖|2×\+\s*重叠覆盖|Covered|Uncovered|2×\+\s*coverage)\s*$/i,
      "",
    );

  if (!L.circleMarker.__acidchPostReleaseWrapped) {
    const originalCircleMarker = L.circleMarker;
    const wrappedCircleMarker = (latlng, options = {}) => {
      const isDemand = String(options?.className || "").includes("geo4-demand-node");
      const coverageMode = D.getElementById("geo4-layer")?.value === "coverage";
      const nextOptions =
        isDemand && !coverageMode
          ? {
              ...options,
              color: "#ff759a",
              fillColor: "#ff3d78",
              weight: 1.5,
              className: "geo4-demand-node",
            }
          : options;
      const layer = originalCircleMarker.call(L, latlng, nextOptions);
      captureMap(layer);
      if (isDemand && !coverageMode && typeof layer.bindTooltip === "function") {
        const originalBindTooltip = layer.bindTooltip;
        layer.bindTooltip = function integrityDemandTooltip(content, ...args) {
          return originalBindTooltip.call(this, stripCoverageStatus(content), ...args);
        };
      }
      return layer;
    };
    wrappedCircleMarker.__acidchPostReleaseWrapped = true;
    wrappedCircleMarker.__acidchPostReleaseOriginal = originalCircleMarker;
    L.circleMarker = wrappedCircleMarker;
  }

  function maskPrimaryRouteFlowMetadata() {
    if (!state.map) return [];
    const restore = [];
    for (const layer of Object.values(state.map._layers || {})) {
      if (typeof layer?.getTooltip !== "function" || typeof layer?.getLatLngs !== "function") continue;
      const tooltip = layer.getTooltip();
      const content = String(tooltip?.getContent?.() || "");
      if (!/Flow:\s*[\d,.]+/i.test(content) || !isPrimaryOptimalFlowLayer(layer)) continue;
      if (typeof tooltip?.setContent !== "function") continue;
      restore.push(() => tooltip.setContent(content));
      // Fleet planning must consume the complete Facility → Demand allocation
      // layer. The acid-green path is presentation geometry and can be a strict
      // subset after route rendering or visual-layer filtering, so hide only its
      // duplicate Flow label for the duration of the fleet click.
      tooltip.setContent(content.replace(/Flow:/gi, "Routed:"));
    }
    return restore;
  }

  const fleetButton = root.querySelector(".geo4__fleet-build");
  fleetButton?.addEventListener(
    "click",
    (event) => {
      if (blockStale(event)) return;
      const restore = maskPrimaryRouteFlowMetadata();
      globalThis.setTimeout(() => restore.forEach((fn) => fn()), 0);
    },
    true,
  );

  const transButton = root.querySelector(".geo4__trans-run");
  const transStatus = root.querySelector(".geo4__trans-status");
  const transNote = root.querySelector(".geo4__trans-note");
  if (transNote) transNote.textContent = copy.transNote;

  function syncEngineUi() {
    const engine = D.getElementById("geo4-engine")?.value || "od";
    shell.dataset.networkEngine = engine;
    const osmOption = D.querySelector('#geo4-engine option[value="osm"]');
    if (osmOption) osmOption.textContent = copy.osmLabel;
    if (engine !== "osm" && transStatus && !transStatus.classList.contains("ok")) {
      transStatus.textContent = copy.transNeedOsm;
      transStatus.className = "geo4__trans-status";
    }
  }

  transButton?.addEventListener(
    "click",
    (event) => {
      if (blockStale(event)) return;
      if (D.getElementById("geo4-engine")?.value === "osm") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (transStatus) {
        transStatus.textContent = copy.transNeedOsm;
        transStatus.className = "geo4__trans-status bad";
      }
    },
    true,
  );

  D.getElementById("geo4-engine")?.addEventListener("change", () =>
    globalThis.setTimeout(syncEngineUi, 0),
  );
  const graphStatus = D.getElementById("geo4-graph-status");
  const graphObserver =
    graphStatus && globalThis.MutationObserver
      ? new globalThis.MutationObserver(syncEngineUi)
      : null;
  graphObserver?.observe(graphStatus, { childList: true, characterData: true, subtree: true });
  syncEngineUi();

  const originalFetch = globalThis.fetch;
  if (typeof originalFetch === "function" && !originalFetch.__acidchNominatimQueueWrapped) {
    let queue = globalThis.Promise.resolve();
    let lastStart = 0;
    const cache = new Map();
    const wrappedFetch = (input, init = {}) => {
      if (!isNominatimRequest(input)) return originalFetch.call(globalThis, input, init);
      const method = String(init?.method || (typeof input !== "string" ? input?.method : "GET") || "GET").toUpperCase();
      const url = typeof input === "string" ? input : input?.url || "";
      const key = method === "GET" ? url : null;
      const cached = key ? cache.get(key) : null;
      if (cached) return globalThis.Promise.resolve(cached.clone());
      const task = queue.then(async () => {
        const elapsed = globalThis.Date.now() - lastStart;
        const delay = Math.max(0, 1100 - elapsed);
        if (delay) await new globalThis.Promise((resolve) => globalThis.setTimeout(resolve, delay));
        lastStart = globalThis.Date.now();
        const response = await originalFetch.call(globalThis, input, init);
        if (key && response.ok && typeof response.clone === "function") {
          if (cache.size >= 100) cache.delete(cache.keys().next().value);
          cache.set(key, response.clone());
        }
        return response;
      });
      queue = task.then(
        () => undefined,
        () => undefined,
      );
      return task;
    };
    wrappedFetch.__acidchNominatimQueueWrapped = true;
    wrappedFetch.__acidchNominatimQueueOriginal = originalFetch;
    globalThis.fetch = wrappedFetch;
  }
}

boot();
