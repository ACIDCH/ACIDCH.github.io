const D = globalThis.document;
const originalSetTimeout = globalThis.setTimeout.bind(globalThis);
let armed = true;

function restore() {
  if (globalThis.setTimeout === guardedSetTimeout)
    globalThis.setTimeout = originalSetTimeout;
}

function hasLocalFixture() {
  try {
    const configured = JSON.parse(
      globalThis.localStorage?.getItem("acidch-gis-endpoints") || "null",
    );
    const endpoint = String(configured?.overpassPrimary || "");
    return /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?\//i.test(endpoint);
  } catch {
    return false;
  }
}

function guardedSetTimeout(callback, delay, ...args) {
  const source = typeof callback === "function" ? String(callback) : "";
  if (armed && Number(delay) === 120 && source.includes("loadGraph(true)")) {
    armed = false;
    restore();
    if (hasLocalFixture()) {
      return originalSetTimeout(callback, delay, ...args);
    }
    const root = D?.getElementById("geo-v4");
    if (root) {
      root.dataset.externalGisBootDeferred = "true";
      const zh = (root.dataset.locale || "zh") === "zh";
      const graphStatus = D.getElementById("geo4-graph-status");
      if (graphStatus) {
        graphStatus.textContent = zh
          ? "轻量 GIS 场景已就绪。内置 OSM 道路图可立即运行；点击加载时按需获取在线路网。"
          : "Compact GIS scene ready. The bundled OSM road graph runs immediately; live roads load only on the explicit load action.";
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
