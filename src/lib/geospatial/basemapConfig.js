const CARTO_RASTER_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png";
const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const CARTO_KEY = import.meta.env.PUBLIC_CARTO_BASEMAP_KEY?.trim() || "";

const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
  '&copy; <a href="https://carto.com/attributions">CARTO</a>';
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export function getBasemapSource() {
  return CARTO_KEY ? "carto-dark-matter" : "osm-fallback";
}

export function getBasemapConfig() {
  if (CARTO_KEY) {
    return {
      source: "carto-dark-matter",
      url: `${CARTO_RASTER_URL}?key=${encodeURIComponent(CARTO_KEY)}`,
      options: {
        maxZoom: 20,
        subdomains: "abcd",
        attribution: CARTO_ATTRIBUTION,
      },
    };
  }

  return {
    source: "osm-fallback",
    url: OSM_TILE_URL,
    options: {
      maxZoom: 20,
      attribution: OSM_ATTRIBUTION,
    },
  };
}
