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
    const method = String(
      init?.method || (typeof input !== "string" ? input?.method : "GET") || "GET",
    ).toUpperCase();
    return /overpass|api\/interpreter/i.test(url) && method === "POST";
  };
  const comparable = (value) => String(value || "").replace(/\/$/, "");
  let exhaustedAt = 0;

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

  function reconcileHealthyState() {
    const chip = root.querySelector('.geo4__service-chip[data-service="overpass"]');
    if (!chip) return;
    chip.dataset.state = "ok";
    root.dataset.serviceOverpass = "ok";
    const detail = chip.querySelector("small");
    if (detail && /降级|Degraded/i.test(detail.textContent || "")) {
      detail.textContent =
        (root.dataset.locale || "zh") === "zh"
          ? "正常 · 主/备端点已响应"
          : "Healthy · endpoint responded";
    }
  }

  const wrappedFetch = async (input, init = {}) => {
    if (!overpassPost(input, init)) return priorFetch.call(globalThis, input, init);
    const sourceUrl = typeof input === "string" ? input : input?.url || "";
    const configured = globalThis.__ACIDCH_GIS_RUNTIME__?.getEndpoints?.() || {};
    const secondarySource =
      configured.overpassSecondary || "https://overpass-api.de/api/interpreter";
    const sourceIsSecondary = comparable(sourceUrl) === comparable(secondarySource);

    // The primary call already starts the secondary after a short grace period.
    // If both have just failed, the core loader's next loop iteration must not
    // wait through the same secondary endpoint for another full timeout window.
    if (sourceIsSecondary) {
      if (exhaustedAt && Date.now() - exhaustedAt < 5000) {
        throw new Error("Overpass secondary already failed in the current hedged attempt");
      }
      return priorFetch.call(globalThis, input, init);
    }

    const primary = validatedFetch(input, init, 0);
    if (!secondarySource) return primary;
    const secondary = validatedFetch(secondarySource, init, 2600);
    const attempts = [primary, secondary];
    try {
      const response = await globalThis.Promise.any(attempts);
      exhaustedAt = 0;
      globalThis.Promise.allSettled(attempts).then((results) => {
        if (results.some((entry) => entry.status === "fulfilled")) reconcileHealthyState();
      });
      return response;
    } catch (error) {
      exhaustedAt = Date.now();
      throw new Error("Both Overpass graph endpoints were unavailable", { cause: error });
    }
  };

  wrappedFetch.__acidchOverpassHedged = true;
  wrappedFetch.__acidchOverpassHedgeOriginal = priorFetch;
  globalThis.fetch = wrappedFetch;
}

boot();
