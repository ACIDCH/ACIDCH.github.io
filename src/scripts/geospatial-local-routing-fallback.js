import { parseOverpassGraph } from "../lib/geospatial/decisionEngine.js";
import { buildLocalTablePayload } from "../lib/geospatial/localRoutingFallback.js";

const root = globalThis.document?.getElementById("geo-v4");

function localResponse(url, graph) {
  const payload = buildLocalTablePayload(url, graph);
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

function boot() {
  if (!root) return;
  if (root.dataset.localRoutingFallbackReady === "true") return;
  const currentFetch = globalThis.fetch;
  if (typeof currentFetch !== "function") return;
  root.dataset.localRoutingFallbackReady = "true";

  const state = { graph: null };
  const wrappedFetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input?.url || "";
    const isTable = url.includes("/table/v1/driving/");

    if (isTable && state.graph) {
      const response = localResponse(url, state.graph);
      if (response) return response;
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
      if (!isTable || response.ok || !state.graph) return response;
      return localResponse(url, state.graph) || response;
    } catch (error) {
      if (!isTable || !state.graph) throw error;
      const response = localResponse(url, state.graph);
      if (!response) throw error;
      return response;
    }
  };
  wrappedFetch.__acidchLocalRoutingFallbackWrapped = true;
  wrappedFetch.__acidchLocalRoutingFallbackOriginal = currentFetch;
  globalThis.fetch = wrappedFetch;
}

boot();
