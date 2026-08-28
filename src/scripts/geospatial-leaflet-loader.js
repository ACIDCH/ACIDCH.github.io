import "./geospatial-idle-gis-guard.js";
import * as LeafletNamespace from "leaflet";
import "leaflet/dist/leaflet.css";

const D = globalThis.document;
const Leaflet = LeafletNamespace.default || LeafletNamespace;
const CARTO_TILE_PATTERN = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const CARTO_TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png";
const CARTO_KEY = import.meta.env.PUBLIC_CARTO_BASEMAP_KEY?.trim() || "";

function root() {
  return D?.getElementById("geo-v4") || null;
}

function setState(state, source = "bundle") {
  const target = root();
  if (!target) return;
  target.dataset.leafletState = state;
  target.dataset.leafletSource = source;
}

function configureBasemap() {
  if (!CARTO_KEY || typeof Leaflet.tileLayer !== "function") return;
  const originalTileLayer = Leaflet.tileLayer.bind(Leaflet);
  Leaflet.tileLayer = (url, options = {}) => {
    if (url !== CARTO_TILE_PATTERN) return originalTileLayer(url, options);
    return originalTileLayer(`${CARTO_TILE_URL}?key=${encodeURIComponent(CARTO_KEY)}`, {
      ...options,
      maxZoom: Math.min(options.maxZoom ?? 20, 20),
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
        '&copy; <a href="https://carto.com/attributions">CARTO</a>',
    });
  };
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

  configureBasemap();
  globalThis.L = Leaflet;
  setState("ready", CARTO_KEY ? "carto-dark-matter" : "osm-fallback");
  globalThis.__ACIDCH_LEAFLET_PROMISE__ = globalThis.Promise.resolve(Leaflet);
  globalThis.dispatchEvent(
    new globalThis.CustomEvent("acidch:leaflet-ready", {
      detail: { source: CARTO_KEY ? "carto-dark-matter" : "osm-fallback" },
    }),
  );
  return Leaflet;
}

try {
  exposeBundledLeaflet();
} catch (error) {
  globalThis.console?.warn("[Geo V4] bundled Leaflet", error);
}
