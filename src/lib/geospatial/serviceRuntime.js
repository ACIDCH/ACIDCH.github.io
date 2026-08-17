export const DEFAULT_GIS_ENDPOINTS = Object.freeze({
  nominatim: "https://nominatim.openstreetmap.org",
  osrm: "https://router.project-osrm.org",
  overpassPrimary: "https://overpass-api.de/api/interpreter",
  overpassSecondary: "https://overpass.private.coffee/api/interpreter",
});

const LEGACY_SECONDARY_OVERPASS_HOSTS = new Set([
  "overpass.kumi.systems",
  "overpass.private.coffee",
]);

function asUrl(input) {
  try {
    if (input instanceof URL) return input;
    if (typeof input === "string") return new URL(input);
    if (input && typeof input.url === "string") return new URL(input.url);
  } catch {
    return null;
  }
  return null;
}

function safeEndpoint(value, fallback) {
  try {
    const url = new URL(String(value || fallback));
    if (url.protocol !== "https:" && url.protocol !== "http:") return fallback;
    return url.toString().replace(/\/$/, "");
  } catch {
    return fallback;
  }
}

export function normalizeGisEndpoints(overrides = {}) {
  return {
    nominatim: safeEndpoint(overrides.nominatim, DEFAULT_GIS_ENDPOINTS.nominatim),
    osrm: safeEndpoint(overrides.osrm, DEFAULT_GIS_ENDPOINTS.osrm),
    overpassPrimary: safeEndpoint(
      overrides.overpassPrimary,
      DEFAULT_GIS_ENDPOINTS.overpassPrimary,
    ),
    overpassSecondary: safeEndpoint(
      overrides.overpassSecondary,
      DEFAULT_GIS_ENDPOINTS.overpassSecondary,
    ),
  };
}

export function classifyServiceUrl(input) {
  const url = asUrl(input);
  if (!url) return null;
  const host = url.hostname.toLowerCase();
  if (host === "nominatim.openstreetmap.org") return "nominatim";
  if (host === "router.project-osrm.org") return "osrm";
  if (
    host === "overpass-api.de" ||
    host.endsWith(".overpass-api.de") ||
    LEGACY_SECONDARY_OVERPASS_HOSTS.has(host)
  ) {
    return "overpass";
  }
  return null;
}

function joinBase(base, pathname, search) {
  const root = String(base).replace(/\/$/, "");
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${root}${path}${search || ""}`;
}

export function rewriteServiceUrl(input, overrides = {}) {
  const url = asUrl(input);
  if (!url) return typeof input === "string" ? input : input?.url || "";
  const endpoints = normalizeGisEndpoints(overrides);
  const service = classifyServiceUrl(url);
  if (service === "nominatim") {
    return joinBase(endpoints.nominatim, url.pathname, url.search);
  }
  if (service === "osrm") {
    return joinBase(endpoints.osrm, url.pathname, url.search);
  }
  if (service === "overpass") {
    const secondary = LEGACY_SECONDARY_OVERPASS_HOSTS.has(url.hostname.toLowerCase());
    const endpoint = secondary ? endpoints.overpassSecondary : endpoints.overpassPrimary;
    const base = new URL(endpoint);
    base.search = url.search;
    return base.toString();
  }
  return url.toString();
}

export function timeoutForService(service) {
  if (service === "overpass") return 45_000;
  if (service === "nominatim") return 12_000;
  if (service === "osrm") return 15_000;
  return 0;
}
