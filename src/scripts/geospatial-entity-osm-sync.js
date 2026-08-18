const D = globalThis.document;

function boot() {
  const root = D?.getElementById("geo-v4");
  const shell = root?.querySelector(".geo4__shell");
  const engine = D?.getElementById("geo4-engine");
  const graphStatus = D?.getElementById("geo4-graph-status");
  const customList = D?.getElementById("geo4-custom-list");
  if (!root || !shell || !engine || !graphStatus || !customList) {
    globalThis.setTimeout(boot, 100);
    return;
  }
  if (root.dataset.entityOsmSyncReady === "true") return;
  root.dataset.entityOsmSyncReady = "true";

  const zh = (root.dataset.locale || "zh") === "zh";
  const refreshText = zh
    ? "网络实体已更新 · 运行优化时会刷新 OSM 道路网络"
    : "Network entities changed · the OSM road graph will refresh on the next optimisation run";
  let mounted = false;

  const sync = () => {
    if (!mounted) {
      mounted = true;
      return;
    }
    engine.value = "osm";
    shell.dataset.networkEngine = "osm";
    graphStatus.textContent = refreshText;
    root.dataset.resultFreshness = "stale";
    const freshness = root.querySelector(".geo4__freshness");
    if (freshness)
      freshness.textContent = zh
        ? "网络实体已变更 · 请重新运行优化"
        : "Network entities changed · run optimisation again";
  };

  const observer = new globalThis.MutationObserver(sync);
  observer.observe(customList, { childList: true, subtree: false });
}

boot();
