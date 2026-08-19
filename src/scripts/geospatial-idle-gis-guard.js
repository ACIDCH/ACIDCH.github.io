const D = globalThis.document;
const originalSetTimeout = globalThis.setTimeout.bind(globalThis);
let armed = true;

function restore() {
  if (globalThis.setTimeout === guardedSetTimeout) globalThis.setTimeout = originalSetTimeout;
}

function guardedSetTimeout(callback, delay, ...args) {
  const source = typeof callback === "function" ? String(callback) : "";
  if (armed && Number(delay) === 120 && source.includes("loadGraph(true)")) {
    armed = false;
    restore();
    const root = D?.getElementById("geo-v4");
    if (root) {
      root.dataset.externalGisBootDeferred = "true";
      const zh = (root.dataset.locale || "zh") === "zh";
      const graphStatus = D.getElementById("geo4-graph-status");
      if (graphStatus) {
        graphStatus.textContent = zh
          ? "轻量 GIS 场景已就绪。默认使用 OSM 道路网络；首次运行优化或点击加载时按需获取路网。"
          : "Compact GIS scene ready. OSM Road Network is the default; the road graph loads on the first optimisation run or explicit load action.";
      }
    }
    return 0;
  }
  return originalSetTimeout(callback, delay, ...args);
}

globalThis.setTimeout = guardedSetTimeout;
originalSetTimeout(() => {
  armed = false;
  restore();
}, 750);
