const D = globalThis.document;

function boot() {
  const root = D?.getElementById("geo-v4");
  const engine = D?.getElementById("geo4-engine");
  const graphStatus = D?.getElementById("geo4-graph-status");
  if (!root || !engine || !graphStatus || root.dataset.usabilityRefinementReady !== "true") {
    globalThis.setTimeout(boot, 80);
    return;
  }
  if (root.dataset.osmInitialStateReady === "true") return;
  root.dataset.osmInitialStateReady = "true";

  const graphReady = () => /nodes\s*\/\s*[\d,]+\s*edges/i.test(graphStatus.textContent || "");
  if (engine.value !== "osm" || graphReady()) return;

  root.dataset.resultFreshness = "stale";
  const freshness = root.querySelector(".geo4__freshness");
  if (freshness) {
    freshness.textContent =
      (root.dataset.locale || "zh") === "zh"
        ? "默认 OSM 情景已就绪 · 请运行优化"
        : "Default OSM scenario ready · Run optimisation";
  }
}

boot();
