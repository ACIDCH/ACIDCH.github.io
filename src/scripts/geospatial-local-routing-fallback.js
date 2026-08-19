import { parseOverpassGraph } from "../lib/geospatial/decisionEngine.js";
import {
  buildLocalRoutePayload,
  buildLocalTablePayload,
  parseOsrmRouteRequest,
  parseOsrmTableRequest,
} from "../lib/geospatial/localRoutingFallback.js";

const root = globalThis.document?.getElementById("geo-v4");
const CACHE_PREFIX = "acidch-osm-compact-v2:";

function activeRoadScenario(url) {
  const engine = globalThis.document?.getElementById("geo4-engine")?.value || "od";
  if (engine !== "osm") return { mode: "baseline" };

  try {
    const parsed = new globalThis.URL(url);
    const annotations = parsed.searchParams.get("annotations") || "";
    const isCoreBaseTable =
      parsed.pathname.includes("/table/v1/driving/") &&
      parsed.searchParams.has("sources") &&
      parsed.searchParams.has("destinations") &&
      annotations.includes("distance") &&
      annotations.includes("duration");
    if (isCoreBaseTable) return { mode: "baseline" };
  } catch {
    return { mode: "baseline" };
  }

  const read = (id, fallback = 0) =>
    Number(globalThis.document?.getElementById(id)?.value ?? fallback);
  return {
    mode: globalThis.document?.getElementById("geo4-road-mode")?.value || "baseline",
    congestionSeverity: read("geo4-congestion") / 100,
    congestionShare: read("geo4-congestion-share") / 100,
    closureShare: read("geo4-closure") / 100,
    improvement: 0.25,
    improvementShare: 0.3,
    newRoadLinks: Number(
      globalThis.document?.getElementById("geo4-new-roads-out")?.textContent || 0,
    ),
    maxNewRoadKm: 0.65,
    newRoadSpeedKph: 50,
    seed: read("geo4-seed", 708709),
  };
}

function localResponse(url, graph) {
  const scenarioParams = activeRoadScenario(url);
  const payload = url.includes("/route/v1/driving/")
    ? buildLocalRoutePayload(url, graph, scenarioParams)
    : buildLocalTablePayload(url, graph, scenarioParams);
  return payload
    ? new globalThis.Response(JSON.stringify(payload), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-ACIDCH-Fallback": "osm-graph",
        },
      })
    : null;
}

function requestPoints(url) {
  return (
    parseOsrmTableRequest(url)?.points ||
    parseOsrmRouteRequest(url)?.points ||
    []
  );
}

function cacheBounds(key) {
  if (!key.startsWith(CACHE_PREFIX)) return null;
  const values = key.slice(CACHE_PREFIX.length).split(":").map(Number);
  return values.length === 4 && values.every(Number.isFinite) ? values : null;
}

function containsAll(bounds, points) {
  if (!bounds || !points.length) return false;
  const [minLat, minLon, maxLat, maxLon] = bounds;
  const pad = 0.002;
  return points.every(
    (point) =>
      point.lat >= minLat - pad &&
      point.lon >= minLon - pad &&
      point.lat <= maxLat + pad &&
      point.lon <= maxLon + pad,
  );
}

function boot() {
  if (!root) return;
  if (root.dataset.localRoutingFallbackReady === "true") return;
  const currentFetch = globalThis.fetch;
  if (typeof currentFetch !== "function") return;
  root.dataset.localRoutingFallbackReady = "true";

  const state = { graph: null, cachedGraphs: new Map() };

  function graphFromSession(url) {
    const points = requestPoints(url);
    if (!points.length) return null;
    try {
      const storage = globalThis.sessionStorage;
      for (let index = 0; index < (storage?.length || 0); index += 1) {
        const key = storage.key(index);
        const bounds = cacheBounds(String(key || ""));
        if (!key || !containsAll(bounds, points)) continue;
        if (state.cachedGraphs.has(key)) return state.cachedGraphs.get(key);
        const payload = JSON.parse(storage.getItem(key) || "null");
        if (!Array.isArray(payload?.elements) || !payload.elements.length) continue;
        const graph = parseOverpassGraph(payload.elements);
        if (!graph?.edges?.length) continue;
        state.cachedGraphs.set(key, graph);
        return graph;
      }
    } catch {
      // Session cache is an optimisation only; continue with the live graph/service.
    }
    return null;
  }

  const wrappedFetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input?.url || "";
    const isTable = url.includes("/table/v1/driving/");
    const isRoute = url.includes("/route/v1/driving/");
    const isRouting = isTable || isRoute;

    if (isRouting) {
      const graph = graphFromSession(url) || state.graph;
      if (graph) {
        const response = localResponse(url, graph);
        if (response) {
          root.dataset.localRoutingSource = "osm-graph";
          return response;
        }
      }
    }

    try {
      const response = await currentFetch.call(globalThis, input, init);
      if (response.ok && /overpass|api\/interpreter/i.test(url)) {
        response
          .clone()
          .json()
          .then((payload) => {
            if (!Array.isArray(payload?.elements) || !payload.elements.length) return;
            const graph = parseOverpassGraph(payload.elements);
            if (graph?.edges?.length) state.graph = graph;
          })
          .catch(() => {});
      }
      if (!isRouting || response.ok) return response;
      const graph = graphFromSession(url) || state.graph;
      if (!graph) return response;
      const local = localResponse(url, graph);
      if (local) root.dataset.localRoutingSource = "osm-graph";
      return local || response;
    } catch (error) {
      if (!isRouting) throw error;
      const graph = graphFromSession(url) || state.graph;
      if (!graph) throw error;
      const response = localResponse(url, graph);
      if (!response) throw error;
      root.dataset.localRoutingSource = "osm-graph";
      return response;
    }
  };
  wrappedFetch.__acidchLocalRoutingFallbackWrapped = true;
  wrappedFetch.__acidchLocalRoutingFallbackOriginal = currentFetch;
  globalThis.fetch = wrappedFetch;
}

boot();
