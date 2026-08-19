import "./geospatial-idle-gis-guard.js";
import * as LeafletNamespace from "leaflet";
import "leaflet/dist/leaflet.css";

const D = globalThis.document;
const Leaflet = LeafletNamespace.default || LeafletNamespace;

function root() {
  return D?.getElementById("geo-v4") || null;
}

function setState(state, source = "bundle") {
  const target = root();
  if (!target) return;
  target.dataset.leafletState = state;
  target.dataset.leafletSource = source;
}

function exposeBundledLeaflet() {
  if (!Leaflet || typeof Leaflet.map !== "function") {
    setState("failed", "bundle");
    const target = D?.getElementById("geo4-graph-status");
    if (target) {
      const zh = (root()?.dataset.locale || "zh") === "zh";
      target.textContent = zh
        ? "本站地图引擎初始化失败，请刷新页面后重试。"
        : "The bundled map engine failed to initialise. Refresh the page to retry.";
    }
    throw new Error("Bundled Leaflet did not expose the expected map API");
  }

  globalThis.L = Leaflet;
  setState("ready", "bundle");
  globalThis.__ACIDCH_LEAFLET_PROMISE__ = globalThis.Promise.resolve(Leaflet);
  globalThis.dispatchEvent(
    new globalThis.CustomEvent("acidch:leaflet-ready", {
      detail: { source: "bundle" },
    }),
  );
  return Leaflet;
}

try {
  exposeBundledLeaflet();
} catch (error) {
  globalThis.console?.warn("[Geo V4] bundled Leaflet", error);
}
