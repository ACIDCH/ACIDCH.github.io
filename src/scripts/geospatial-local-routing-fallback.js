import { parseOverpassGraph } from "../lib/geospatial/decisionEngine.js";
import { buildLocalTablePayload } from "../lib/geospatial/localRoutingFallback.js";

const root = globalThis.document?.getElementById("geo-v4");

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
    try {
      const response = await currentFetch.call(globalThis, input, init);
      if (response.ok && /api\/interpreter/i.test(url)) {
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
      const payload = buildLocalTablePayload(url, state.graph);
      return payload
        ? new globalThis.Response(JSON.stringify(payload), {
            status: 200,
            headers: { "Content-Type": "application/json", "X-ACIDCH-Fallback": "osm-graph" },
          })
        : response;
    } catch (error) {
      if (!isTable || !state.graph) throw error;
      const payload = buildLocalTablePayload(url, state.graph);
      if (!payload) throw error;
      return new globalThis.Response(JSON.stringify(payload), {
        status: 200,
        headers: { "Content-Type": "application/json", "X-ACIDCH-Fallback": "osm-graph" },
      });
    }
  };
  wrappedFetch.__acidchLocalRoutingFallbackWrapped = true;
  wrappedFetch.__acidchLocalRoutingFallbackOriginal = currentFetch;
  globalThis.fetch = wrappedFetch;
}

boot();
