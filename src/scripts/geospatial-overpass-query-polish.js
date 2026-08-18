const D = globalThis.document;

function boot() {
  const root = D?.getElementById("geo-v4");
  if (!root) {
    globalThis.setTimeout(boot, 100);
    return;
  }
  if (root.dataset.overpassQueryPolishReady === "true") return;
  root.dataset.overpassQueryPolishReady = "true";

  const originalFetch = globalThis.fetch;
  if (typeof originalFetch !== "function" || originalFetch.__acidchOverpassQueryPolished)
    return;

  const wrappedFetch = (input, init = {}) => {
    const url = typeof input === "string" ? input : input?.url || "";
    const method = String(
      init?.method || (typeof input !== "string" ? input?.method : "GET") || "GET",
    ).toUpperCase();
    if (!/overpass|api\/interpreter/i.test(url) || method !== "POST") {
      return originalFetch.call(globalThis, input, init);
    }

    try {
      const params = new globalThis.URLSearchParams(String(init?.body || ""));
      const source = params.get("data");
      if (!source) return originalFetch.call(globalThis, input, init);
      const roadFilter =
        'way["highway"~"^(motorway|motorway_link|trunk|trunk_link|primary|primary_link|secondary|secondary_link|tertiary|tertiary_link|unclassified|residential|living_street|service)$"]';
      const query = source
        .replace("[timeout:35]", "[timeout:16]")
        .replace(
          'way["highway"]["highway"!~"footway|path|cycleway|steps|pedestrian|track"]',
          roadFilter,
        )
        .replace("out body;", "out body qt;");
      params.set("data", query);
      return originalFetch.call(globalThis, input, { ...init, body: params.toString() });
    } catch {
      return originalFetch.call(globalThis, input, init);
    }
  };

  wrappedFetch.__acidchOverpassQueryPolished = true;
  wrappedFetch.__acidchOverpassQueryOriginal = originalFetch;
  globalThis.fetch = wrappedFetch;
}

boot();
