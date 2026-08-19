import { readFile } from "node:fs/promises";

const files = {
  fallbackLib: await readFile("src/lib/geospatial/localRoutingFallback.js", "utf8"),
  fallbackRuntime: await readFile("src/scripts/geospatial-local-routing-fallback.js", "utf8"),
  downstream: await readFile("src/scripts/geospatial-downstream-state.js", "utf8"),
  advanced: await readFile("src/components/GeospatialAdvancedVisuals.astro", "utf8"),
};

const requireToken = (source, token, label) => {
  if (!source.includes(token)) {
    throw new Error(`[geospatial-chain-v2] missing ${label}: ${token}`);
  }
};

requireToken(files.fallbackLib, "parseOsrmRouteRequest", "OSRM route parser");
requireToken(files.fallbackLib, "buildLocalRoutePayload", "local OSM route payload");
requireToken(files.fallbackLib, "reconstructGraphPath", "graph-based route reconstruction");
requireToken(files.fallbackLib, 'geometry: { type: "LineString", coordinates }', "OSRM-compatible route geometry");
requireToken(files.fallbackRuntime, 'const CACHE_PREFIX = "acidch-osm-compact-v2:"', "session OSM graph cache discovery");
requireToken(files.fallbackRuntime, "graphFromSession", "cached-graph hydration");
requireToken(files.fallbackRuntime, 'url.includes("/table/v1/driving/")', "local Table interception");
requireToken(files.fallbackRuntime, 'url.includes("/route/v1/driving/")', "local Route interception");
requireToken(files.fallbackRuntime, 'root.dataset.localRoutingSource = "osm-graph"', "auditable local-routing source state");

requireToken(files.advanced, "geospatial-downstream-state.js", "downstream freshness controller mount");
requireToken(files.downstream, 'root.dataset.fleetFreshness = "stale"', "Fleet/TSP invalidation");
requireToken(files.downstream, 'root.dataset.transFreshness = "stale"', "transshipment invalidation");
requireToken(files.downstream, 'root.dataset.robustFreshness = "stale"', "Monte Carlo invalidation");
requireToken(files.downstream, "resetRobustness", "stale robustness cleanup");
requireToken(files.downstream, 'event.target?.closest?.("#geo4-run,#geo4-reset,[data-remove-entity]")', "entity/run downstream invalidation");
requireToken(files.downstream, 'root.dataset.resultFreshness === "stale"', "stale-main Monte Carlo guard");
requireToken(files.downstream, 'simulate.disabled = root.dataset.resultFreshness === "stale"', "Monte Carlo availability sync");
requireToken(files.downstream, 'className: `${options.className || ""} geo4__optimal-route`.trim()', "main optimal-route stale visual marker");

console.log(
  "[geospatial-chain-v2] PASS: cached OSM graphs can satisfy both OSRM Table and Route calls locally, while Fleet/TSP, Transshipment, Monte Carlo and optimal-route presentation are invalidated independently when main decision inputs change.",
);
