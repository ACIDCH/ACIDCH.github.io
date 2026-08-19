import { isDecisionControl } from "../lib/geospatial/postReleaseIntegrity.js";

const D = globalThis.document;

function boot() {
  const root = D?.getElementById("geo-v4");
  const L = globalThis.L;
  if (!root || !L || !root.querySelector(".geo4__fleet-planner")) {
    globalThis.setTimeout(boot, 80);
    return;
  }
  if (root.dataset.downstreamStateReady === "true") return;
  root.dataset.downstreamStateReady = "true";

  const zh = (root.dataset.locale || "zh") === "zh";
  const copy = zh
    ? {
        fleetStale: "主模型或运力参数已变更，请重新生成车队路线。",
        transStale: "主模型、实体或路网参数已变更，请重新运行两级转运。",
      }
    : {
        fleetStale: "Main-model or fleet inputs changed. Rebuild the fleet tours.",
        transStale: "Main-model, entity or road inputs changed. Re-run transshipment.",
      };

  const style = D.createElement("style");
  style.textContent = `
    #geo-v4[data-fleet-freshness="stale"] .geo4__fleet-summary,
    #geo-v4[data-fleet-freshness="stale"] .geo4__fleet-tour-list,
    #geo-v4[data-trans-freshness="stale"] .geo4__trans-kpis{opacity:.34;filter:saturate(.5)}
    #geo-v4[data-result-freshness="stale"] .geo4__optimal-route,
    #geo-v4[data-result-freshness="stale"] .geo4__fleet-route,
    #geo-v4[data-result-freshness="stale"] .geo4__transshipment-route{opacity:0!important;pointer-events:none!important}
    #geo-v4[data-robust-freshness="stale"] #geo4-robust{display:none!important}
  `;
  D.head.appendChild(style);

  if (!L.polyline.__acidchDownstreamStateWrapped) {
    const original = L.polyline;
    const wrapped = (latlngs, options = {}) => {
      const colour = String(options?.color || "").toLowerCase();
      const weight = Number(options?.weight || 0);
      const isOptimalRoute = colour === "#d8ff6b" && weight >= 2.4;
      const next = isOptimalRoute
        ? {
            ...options,
            className: `${options.className || ""} geo4__optimal-route`.trim(),
          }
        : options;
      return original.call(L, latlngs, next);
    };
    wrapped.__acidchDownstreamStateWrapped = true;
    wrapped.__acidchDownstreamStateOriginal = original;
    L.polyline = wrapped;
  }

  const fleetStatus = root.querySelector(".geo4__fleet-status");
  const transStatus = root.querySelector(".geo4__trans-status");
  const robust = D.getElementById("geo4-robust");
  const layer = D.getElementById("geo4-layer");
  const riskOption = layer?.querySelector('option[value="risk"]');

  function resetFleet() {
    root.dataset.fleetFreshness = "stale";
    root.querySelectorAll(".geo4__fleet-summary b").forEach((node) => {
      node.textContent = "—";
    });
    const list = root.querySelector(".geo4__fleet-tour-list");
    if (list) list.innerHTML = "";
    if (fleetStatus) {
      fleetStatus.textContent = copy.fleetStale;
      fleetStatus.className = "geo4__fleet-status";
    }
  }

  function resetTransshipment() {
    root.dataset.transFreshness = "stale";
    root.querySelectorAll(".geo4__trans-kpis b").forEach((node) => {
      node.textContent = "—";
    });
    if (transStatus) {
      transStatus.textContent = copy.transStale;
      transStatus.className = "geo4__trans-status";
    }
  }

  function resetRobustness() {
    root.dataset.robustFreshness = "stale";
    if (robust) robust.hidden = true;
    if (riskOption) riskOption.disabled = true;
    if (layer?.value === "risk") {
      layer.value = "network";
      layer.dispatchEvent(new globalThis.Event("change", { bubbles: true }));
    }
  }

  function invalidateDownstream() {
    resetFleet();
    resetTransshipment();
    resetRobustness();
  }

  root.addEventListener("input", (event) => {
    if (isDecisionControl(event.target)) invalidateDownstream();
  });
  root.addEventListener("change", (event) => {
    if (isDecisionControl(event.target)) invalidateDownstream();
  });
  root.addEventListener(
    "click",
    (event) => {
      const step = event.target?.closest?.("[data-step]");
      if (step && ["maxOpen", "fleet", "newRoads"].includes(step.dataset.step)) {
        invalidateDownstream();
      }
      if (event.target?.closest?.("#geo4-run,#geo4-reset,[data-remove-entity]")) {
        invalidateDownstream();
      }
    },
    true,
  );

  const policyList = D.getElementById("geo4-policy-list");
  const entityObserver =
    policyList && globalThis.MutationObserver
      ? new globalThis.MutationObserver(() => invalidateDownstream())
      : null;
  entityObserver?.observe(policyList, { childList: true });

  const fleetObserver =
    fleetStatus && globalThis.MutationObserver
      ? new globalThis.MutationObserver(() => {
          const text = String(fleetStatus.textContent || "");
          if (/车队计划已生成|Fleet plan generated/i.test(text)) {
            root.dataset.fleetFreshness = "fresh";
          }
        })
      : null;
  fleetObserver?.observe(fleetStatus, { childList: true, characterData: true, subtree: true });

  const transObserver =
    transStatus && globalThis.MutationObserver
      ? new globalThis.MutationObserver(() => {
          const text = String(transStatus.textContent || "");
          if (/两级转运(?:可行|不可行)|Two-echelon transshipment is (?:feasible|infeasible)/i.test(text)) {
            root.dataset.transFreshness = "fresh";
          }
        })
      : null;
  transObserver?.observe(transStatus, { childList: true, characterData: true, subtree: true });

  const status = D.getElementById("geo4-status");
  const statusObserver =
    status && globalThis.MutationObserver
      ? new globalThis.MutationObserver(() => {
          const text = String(status.textContent || "");
          if (/Monte Carlo 稳健性模拟完成|Monte Carlo robustness simulation complete/i.test(text)) {
            root.dataset.robustFreshness = "fresh";
            if (riskOption) riskOption.disabled = false;
          }
        })
      : null;
  statusObserver?.observe(status, { childList: true, characterData: true, subtree: true });

  invalidateDownstream();
}

boot();
