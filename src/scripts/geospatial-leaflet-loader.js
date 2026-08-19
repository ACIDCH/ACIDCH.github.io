const D = globalThis.document;

const SOURCES = [
  {
    name: "jsDelivr",
    js: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js",
    css: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css",
  },
  {
    name: "unpkg",
    js: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
    css: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  },
];

const LOAD_BUDGET_MS = 7_000;

function root() {
  return D?.getElementById("geo-v4") || null;
}

function setState(state, source = "") {
  const target = root();
  if (!target) return;
  target.dataset.leafletState = state;
  target.dataset.leafletSource = source;
}

function mountStylesheet(url) {
  let link = D?.getElementById("geo4-leaflet-css");
  if (!link) {
    link = D.createElement("link");
    link.id = "geo4-leaflet-css";
    link.rel = "stylesheet";
    D.head.appendChild(link);
  }
  if (link.href !== url) link.href = url;
}

function loadScript(source) {
  return new globalThis.Promise((resolve, reject) => {
    if (globalThis.L) {
      resolve(source.name);
      return;
    }

    mountStylesheet(source.css);
    const script = D.createElement("script");
    script.async = true;
    script.src = source.js;
    script.crossOrigin = "anonymous";
    script.dataset.geo4LeafletSource = source.name;

    let settled = false;
    const finish = (error = null) => {
      if (settled) return;
      settled = true;
      globalThis.clearTimeout(timer);
      script.onload = null;
      script.onerror = null;
      if (error) {
        script.remove();
        reject(error);
      } else {
        resolve(source.name);
      }
    };

    const timer = globalThis.setTimeout(
      () => finish(new Error(`Leaflet ${source.name} load timeout`)),
      LOAD_BUDGET_MS,
    );
    script.onload = () =>
      globalThis.L
        ? finish()
        : finish(new Error(`Leaflet ${source.name} loaded without global L`));
    script.onerror = () => finish(new Error(`Leaflet ${source.name} load error`));
    D.head.appendChild(script);
  });
}

async function loadLeaflet() {
  if (globalThis.L) {
    setState("ready", "existing");
    return globalThis.L;
  }
  if (globalThis.__ACIDCH_LEAFLET_PROMISE__) return globalThis.__ACIDCH_LEAFLET_PROMISE__;

  setState("loading");
  globalThis.__ACIDCH_LEAFLET_PROMISE__ = (async () => {
    let lastError = null;
    for (const source of SOURCES) {
      try {
        const name = await loadScript(source);
        setState("ready", name);
        globalThis.dispatchEvent(
          new globalThis.CustomEvent("acidch:leaflet-ready", { detail: { source: name } }),
        );
        return globalThis.L;
      } catch (error) {
        lastError = error;
      }
    }

    setState("failed");
    const target = D?.getElementById("geo4-graph-status");
    if (target) {
      const zh = (root()?.dataset.locale || "zh") === "zh";
      target.textContent = zh
        ? "地图引擎暂时无法加载，请刷新页面后重试。"
        : "The map engine is temporarily unavailable. Refresh the page to retry.";
    }
    throw lastError || new Error("Leaflet failed to load");
  })();

  return globalThis.__ACIDCH_LEAFLET_PROMISE__;
}

loadLeaflet().catch((error) => {
  globalThis.console?.warn("[Geo V4] Leaflet loader", error);
});
