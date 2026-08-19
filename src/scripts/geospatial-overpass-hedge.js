const D = globalThis.document;

function boot() {
  const root = D?.getElementById("geo-v4");
  if (!root) {
    globalThis.setTimeout(boot, 80);
    return;
  }
  if (root.dataset.overpassHedgeReady === "true") return;
  root.dataset.overpassHedgeReady = "true";

  const priorFetch = globalThis.fetch;
  if (typeof priorFetch !== "function" || priorFetch.__acidchOverpassHedged) return;

  const sleep = (ms) => new globalThis.Promise((resolve) => globalThis.setTimeout(resolve, ms));
  const overpassPost = (input, init = {}) => {
    const url = typeof input === "string" ? input : input?.url || "";
    const method = String(init?.method || (typeof input !== "string" ? input?.method : "GET") || "GET").toUpperCase();
    return /overpass|api\/interpreter/i.test(url) && method === "POST";
  };

  async function validatedFetch(input, init, delayMs = 0) {
    if (delayMs) await sleep(delayMs);
    const controller = new globalThis.AbortController();
    const inherited = init?.signal || null;
    const inheritAbort = () => controller.abort(inherited?.reason);
    if (inherited?.aborted) inheritAbort();
    else inherited?.addEventListener?.("abort", inheritAbort, { once: true });
    const timer = globalThis.setTimeout(
      () => controller.abort(new globalThis.DOMException("Overpass hedge timeout", "TimeoutError")),
      12_000,
    );
    try {
      const response = await priorFetch.call(globalThis, input, { ...init, signal: controller.signal });
      if (!response.ok) throw new Error(`Overpass HTTP ${response.status}`);
      const payload = await response.clone().json();
      if (!Array.isArray(payload?.elements) || payload.elements.length < 20) {
        throw new Error("Overpass response did not contain a usable road graph");
      }
      return response;
    } finally {
      globalThis.clearTimeout(timer);
      inherited?.removeEventListener?.("abort", inheritAbort);
    }
  }

  const wrappedFetch = async (input, init = {}) => {
    if (!overpassPost(input, init)) return priorFetch.call(globalThis, input, init);
    const sourceUrl = typeof input === "string" ? input : input?.url || "";
    const host = (() => {
      try {
        return new globalThis.URL(sourceUrl).hostname.toLowerCase();
      } catch {
        return "";
      }
    })();

    // The core graph loader already calls a secondary URL after a failed first
    // request. Hedge only the first request so the two core attempts do not
    // recursively fan out into four public requests.
    if (host === "overpass.kumi.systems" || host === "overpass.private.coffee") {
      return priorFetch.call(globalThis, input, init);
    }

    const primarySource = input;
    // serviceRuntime rewrites this legacy secondary source to the configured
    // secondary endpoint (overpass-api.de by default).
    const secondarySource = "https://overpass.kumi.systems/api/interpreter";
    const primary = validatedFetch(primarySource, init, 0);
    const secondary = validatedFetch(secondarySource, init, 2600);
    try {
      return await globalThis.Promise.any([primary, secondary]);
    } catch (error) {
      throw new Error("Both Overpass graph endpoints were unavailable", { cause: error });
    }
  };

  wrappedFetch.__acidchOverpassHedged = true;
  wrappedFetch.__acidchOverpassHedgeOriginal = priorFetch;
  globalThis.fetch = wrappedFetch;
}

boot();
