const D = globalThis.document;

function boot() {
  const root = D?.getElementById("geo-v4");
  const button = root?.querySelector(".geo4__fleet-build");
  const L = globalThis.L;
  if (!root || !button || !L) {
    globalThis.setTimeout(boot, 80);
    return;
  }
  if (root.dataset.fleetAllocationGuardReady === "true") return;
  root.dataset.fleetAllocationGuardReady = "true";

  const state = { map: null };

  function captureMap(layer) {
    if (!layer || typeof layer.addTo !== "function") return;
    const originalAddTo = layer.addTo;
    layer.addTo = function allocationGuardAddTo(target) {
      const result = originalAddTo.call(this, target);
      if (!state.map && target?._map) state.map = target._map;
      return result;
    };
  }

  if (!L.polyline.__acidchFleetAllocationGuardWrapped) {
    const original = L.polyline;
    const wrapped = (...args) => {
      const layer = original.apply(L, args);
      captureMap(layer);
      return layer;
    };
    wrapped.__acidchFleetAllocationGuardWrapped = true;
    wrapped.__acidchFleetAllocationGuardOriginal = original;
    L.polyline = wrapped;
  }

  const flowPattern = /(?:Flow|Allocated):\s*[\d,.]+/i;
  const isMainAllocation = (layer, content) => {
    if (!content.includes("→") || !flowPattern.test(content)) return false;
    const className = String(layer.options?.className || "").toLowerCase();
    if (className.includes("transshipment") || className.includes("fleet")) return false;
    const colour = String(layer.options?.color || "").toLowerCase();
    return colour === "#62ecff" || colour === "#ffcc66";
  };

  button.addEventListener(
    "click",
    () => {
      if (!state.map) return;
      const restore = [];
      for (const layer of Object.values(state.map._layers || {})) {
        const tooltip = layer?.getTooltip?.();
        if (!tooltip || typeof tooltip.getContent !== "function" || typeof tooltip.setContent !== "function")
          continue;
        const content = String(tooltip.getContent() || "");
        if (!content.includes("→") || !flowPattern.test(content)) continue;
        restore.push(() => tooltip.setContent(content));
        if (isMainAllocation(layer, content)) {
          tooltip.setContent(content.replace(/Allocated:/gi, "Flow:"));
        } else {
          tooltip.setContent(content.replace(/Flow:/gi, "Routed:").replace(/Allocated:/gi, "Routed:"));
        }
      }
      globalThis.setTimeout(() => restore.forEach((fn) => fn()), 0);
    },
    true,
  );
}

boot();
