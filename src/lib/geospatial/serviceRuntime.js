export const DEFAULT_GIS_ENDPOINTS = Object.freeze({
  nominatim: "https://nominatim.openstreetmap.org",
  osrm: "https://router.project-osrm.org",
  overpassPrimary: "https://overpass.private.coffee/api/interpreter",
  overpassSecondary: "https://overpass-api.de/api/interpreter",
});

const LEGACY_SECONDARY_OVERPASS_HOSTS = new Set([
  "overpass.kumi.systems",
  "maps.mail.ru",
]);

function asUrl(input) {
  try {
    if (input instanceof globalThis.URL) return input;
    if (typeof input === "string") return new globalThis.URL(input);
    if (input && typeof input.url === "string") return new globalThis.URL(input.url);
  } catch {
    return null;
  }
  return null;
}

function safeEndpoint(value, fallback) {
  try {
    const url = new globalThis.URL(String(value || fallback));
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

function matchesEndpoint(url, endpoint) {
  const base = asUrl(endpoint);
  if (!url || !base || url.origin !== base.origin) return false;
  const basePath = base.pathname.replace(/\/$/, "");
  if (!basePath) return true;
  return url.pathname === basePath || url.pathname.startsWith(`${basePath}/`);
}

export function classifyServiceUrl(input, overrides = {}) {
  const url = asUrl(input);
  if (!url) return null;
  const endpoints = normalizeGisEndpoints(overrides);
  if (matchesEndpoint(url, endpoints.nominatim)) return "nominatim";
  if (matchesEndpoint(url, endpoints.osrm)) return "osrm";
  if (
    matchesEndpoint(url, endpoints.overpassPrimary) ||
    matchesEndpoint(url, endpoints.overpassSecondary)
  ) {
    return "overpass";
  }
  const host = url.hostname.toLowerCase();
  if (host === "nominatim.openstreetmap.org") return "nominatim";
  if (host === "router.project-osrm.org") return "osrm";
  if (
    host === "overpass-api.de" ||
    host.endsWith(".overpass-api.de") ||
    host === "overpass.private.coffee" ||
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

  // Calls already using the configured endpoint must stay on that exact
  // primary/secondary service. This prevents a configured secondary from
  // being silently rewritten back to the primary and allows local fixtures.
  if (
    matchesEndpoint(url, endpoints.nominatim) ||
    matchesEndpoint(url, endpoints.osrm) ||
    matchesEndpoint(url, endpoints.overpassPrimary) ||
    matchesEndpoint(url, endpoints.overpassSecondary)
  ) {
    return url.toString();
  }

  const service = classifyServiceUrl(url, endpoints);
  if (service === "nominatim") {
    return joinBase(endpoints.nominatim, url.pathname, url.search);
  }
  if (service === "osrm") {
    return joinBase(endpoints.osrm, url.pathname, url.search);
  }
  if (service === "overpass") {
    const requestedSecondary = LEGACY_SECONDARY_OVERPASS_HOSTS.has(
      url.hostname.toLowerCase(),
    );
    const endpoint = requestedSecondary
      ? endpoints.overpassSecondary
      : endpoints.overpassPrimary;
    const base = new globalThis.URL(endpoint);
    base.search = url.search;
    return base.toString();
  }
  return url.toString();
}

export function shareJsonResponse(response) {
  if (
    !response ||
    typeof response.clone !== "function" ||
    typeof response.json !== "function"
  ) {
    return response;
  }
  if (response.__acidchSharedJson === true) return response;

  const originalClone = response.clone.bind(response);
  let sharedJsonPromise = null;
  const sharedJson = () => {
    if (!sharedJsonPromise) sharedJsonPromise = originalClone().json();
    return sharedJsonPromise;
  };

  response.json = sharedJson;
  response.clone = () => {
    const clone = originalClone();
    clone.json = sharedJson;
    return clone;
  };
  response.__acidchSharedJson = true;
  return response;
}

export function timeoutForService(service) {
  if (service === "overpass") return 18_000;
  if (service === "nominatim") return 12_000;
  if (service === "osrm") return 15_000;
  return 0;
}
