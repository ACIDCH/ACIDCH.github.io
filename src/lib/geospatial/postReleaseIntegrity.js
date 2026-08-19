export function isPrimaryOptimalFlowLayer(layer) {
  if (!layer || typeof layer.getTooltip !== "function" || typeof layer.getLatLngs !== "function") {
    return false;
  }
  const content = String(layer.getTooltip()?.getContent?.() || "");
  if (!content.includes("→") || !/Flow:\s*[\d,.]+/i.test(content)) return false;
  const colour = String(layer.options?.color || "").toLowerCase();
  const className = String(layer.options?.className || "").toLowerCase();
  if (className.includes("transshipment") || className.includes("fleet")) return false;
  return colour === "#d8ff6b";
}

export function isDecisionControl(target) {
  const id = String(target?.id || "");
  if (target?.matches?.("[data-policy],[data-demand-edit]")) return true;
  const ids = new Set([
    "geo4-objective",
    "geo4-engine",
    "geo4-road-mode",
    "geo4-congestion",
    "geo4-congestion-share",
    "geo4-closure",
    "geo4-seed",
    "geo4-threshold",
    "geo4-redundancy",
    "geo4-facility-capacity-base",
    "geo4-facility-capacity",
    "geo4-fixed-cost",
    "geo4-enforce-fleet",
    "geo4-vehicle-capacity",
    "geo4-trips",
    "geo4-transport-cost",
    "geo4-demand-multiplier",
    "geo4-inv-mean",
    "geo4-inv-sd-base",
    "geo4-lead-time",
    "geo4-lead-time-sd",
    "geo4-service",
    "geo4-holding-cost",
    "geo4-shift-hours",
  ]);
  return ids.has(id);
}

export function isNominatimRequest(input) {
  try {
    const raw = typeof input === "string" ? input : input?.url || "";
    return new globalThis.URL(raw).hostname.toLowerCase() === "nominatim.openstreetmap.org";
  } catch {
    return false;
  }
}
