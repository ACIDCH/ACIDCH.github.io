import { normalizeGisEndpoints, timeoutForService } from "./serviceRuntime.js";
import { networkMatrixFromOsrm } from "./networkMatrix.js";

const DEFAULT_RETRIES = Object.freeze({ nominatim: 1, osrm: 1, overpass: 0 });

function withTimeout(fetchImpl, timeoutMs) {
  return async (url, options = {}) => {
    const controller = new globalThis.AbortController();
    const upstream = options.signal;
    const abort = () => controller.abort(upstream?.reason);
    upstream?.addEventListener?.("abort", abort, { once: true });
    const timer = globalThis.setTimeout(() => controller.abort("timeout"), timeoutMs);
    try {
      return await fetchImpl(url, { ...options, signal: controller.signal });
    } finally {
      globalThis.clearTimeout(timer);
      upstream?.removeEventListener?.("abort", abort);
    }
  };
}

export function createGisServices({
  fetchImpl = (...args) => globalThis.fetch(...args),
  endpointOverrides = {},
  sleep = (ms) => new Promise((resolve) => globalThis.setTimeout(resolve, ms)),
  now = () => Date.now(),
  retries = DEFAULT_RETRIES,
} = {}) {
  const endpoints = normalizeGisEndpoints(endpointOverrides);
  const listeners = new Set();
  const cache = new Map();
  const inflight = new Map();
  let lastNominatimAt = 0;

  const emit = (event) => {
    for (const listener of listeners) listener(event);
  };

  async function request(service, url, options = {}, validator = () => true) {
    const key = `${service}:${options.method || "GET"}:${url}:${String(options.body || "")}`;
    if (options.cache !== false && cache.has(key)) return cache.get(key);
    if (inflight.has(key)) return inflight.get(key);
    const work = (async () => {
      const attempts = Math.max(1, Number(retries[service] || 0) + 1);
      let lastError;
      for (let attempt = 0; attempt < attempts; attempt += 1) {
        const started = now();
        emit({ service, state: "loading", attempt, url });
        try {
          const response = await withTimeout(fetchImpl, timeoutForService(service))(
            url,
            options,
          );
          if (!response?.ok) {
            const error = new Error(`${service} HTTP ${response?.status || "error"}`);
            error.status = response?.status;
            throw error;
          }
          const payload = await response.json();
          if (!validator(payload))
            throw new Error(`${service} returned a malformed payload`);
          emit({ service, state: "healthy", latencyMs: now() - started, url });
          if (options.cache !== false) cache.set(key, payload);
          return payload;
        } catch (error) {
          lastError = error;
          emit({
            service,
            state: attempt + 1 < attempts ? "retrying" : "degraded",
            latencyMs: now() - started,
            error,
            url,
          });
          if (attempt + 1 < attempts) await sleep(250 * 2 ** attempt);
        }
      }
      throw lastError;
    })();
    inflight.set(key, work);
    try {
      return await work;
    } finally {
      inflight.delete(key);
    }
  }

  async function paceNominatim() {
    const remaining = 1000 - (now() - lastNominatimAt);
    if (remaining > 0) await sleep(remaining);
    lastNominatimAt = now();
  }

  async function geocode(query, { locale = "en" } = {}) {
    const normalized = String(query || "").trim();
    if (!normalized) throw new TypeError("Geocoding query is required");
    const cacheKey = `geocode:${locale}:${normalized.toLowerCase()}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);
    await paceNominatim();
    const url = new globalThis.URL(`${endpoints.nominatim}/search`);
    url.searchParams.set("q", normalized);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "nz");
    const payload = await request(
      "nominatim",
      url.toString(),
      { headers: { "Accept-Language": locale } },
      (value) => Array.isArray(value),
    );
    if (!payload.length) throw new Error("Nominatim returned no matching location");
    const result = {
      lat: Number(payload[0].lat),
      lon: Number(payload[0].lon),
      label: payload[0].display_name || normalized,
    };
    if (!Number.isFinite(result.lat) || !Number.isFinite(result.lon)) {
      throw new Error("Nominatim returned invalid coordinates");
    }
    cache.set(cacheKey, result);
    return result;
  }

  async function reverseGeocode(point, { locale = "en" } = {}) {
    const lat = Number(point?.lat);
    const lon = Number(point?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new TypeError("Reverse-geocoding coordinates are required");
    }
    const cacheKey = `reverse:${locale}:${lat.toFixed(5)}:${lon.toFixed(5)}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);
    await paceNominatim();
    const url = new globalThis.URL(`${endpoints.nominatim}/reverse`);
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));
    url.searchParams.set("format", "jsonv2");
    const payload = await request(
      "nominatim",
      url.toString(),
      { headers: { "Accept-Language": locale } },
      (value) => typeof value?.display_name === "string",
    );
    cache.set(cacheKey, payload.display_name);
    return payload.display_name;
  }

  async function osrmTable(sources, destinations, pricing = {}) {
    if (!sources?.length || !destinations?.length) {
      throw new TypeError("OSRM table sources and destinations are required");
    }
    const points = [...sources, ...destinations];
    const coordinates = points.map((point) => `${point.lon},${point.lat}`).join(";");
    const sourceIndexes = sources.map((_, index) => index).join(";");
    const destinationIndexes = destinations
      .map((_, index) => index + sources.length)
      .join(";");
    const url = `${endpoints.osrm}/table/v1/driving/${coordinates}?sources=${sourceIndexes}&destinations=${destinationIndexes}&annotations=distance,duration`;
    const payload = await request(
      "osrm",
      url,
      {},
      (value) => Array.isArray(value?.distances) && Array.isArray(value?.durations),
    );
    return networkMatrixFromOsrm(payload, pricing);
  }

  async function osrmRoute(points) {
    if (!Array.isArray(points) || points.length < 2) {
      throw new TypeError("OSRM route requires at least two points");
    }
    const coordinates = points.map((point) => `${point.lon},${point.lat}`).join(";");
    const url = `${endpoints.osrm}/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=false`;
    const payload = await request(
      "osrm",
      url,
      {},
      (value) =>
        Array.isArray(value?.routes?.[0]?.geometry?.coordinates) &&
        Number.isFinite(value?.routes?.[0]?.distance) &&
        Number.isFinite(value?.routes?.[0]?.duration),
    );
    const route = payload.routes[0];
    return {
      coordinates: route.geometry.coordinates.map(([lon, lat]) => ({ lat, lon })),
      distanceKm: route.distance / 1000,
      durationMin: route.duration / 60,
    };
  }

  async function overpassGraph(query) {
    const body = `data=${encodeURIComponent(query)}`;
    const options = {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body,
    };
    const validate = (value) =>
      Array.isArray(value?.elements) && value.elements.length > 0;
    try {
      return await request("overpass", endpoints.overpassPrimary, options, validate);
    } catch (primaryError) {
      emit({ service: "overpass", state: "fallback", error: primaryError });
      return request("overpass", endpoints.overpassSecondary, options, validate);
    }
  }

  return Object.freeze({
    endpoints,
    geocode,
    reverseGeocode,
    osrmTable,
    osrmRoute,
    overpassGraph,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    clearCache() {
      cache.clear();
    },
    diagnostics() {
      return { cacheEntries: cache.size, inflightRequests: inflight.size };
    },
  });
}

let singleton;

export function getGisServices() {
  if (!singleton) singleton = createGisServices();
  return singleton;
}
