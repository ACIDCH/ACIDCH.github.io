import { readFile } from "node:fs/promises";

const files = {
  core: await readFile("src/scripts/geospatial-v4.js", "utf8"),
  compactUi: await readFile("src/scripts/geospatial-compact-entity-ui.js", "utf8"),
  idleGuard: await readFile("src/scripts/geospatial-idle-gis-guard.js", "utf8"),
  readability: await readFile("src/scripts/geospatial-readability-polish.js", "utf8"),
  initialState: await readFile("src/scripts/geospatial-osm-initial-state.js", "utf8"),
  queryPolish: await readFile("src/scripts/geospatial-overpass-query-polish.js", "utf8"),
  hedge: await readFile("src/scripts/geospatial-overpass-hedge.js", "utf8"),
  fallback: await readFile("src/scripts/geospatial-osm-fallback.js", "utf8"),
  localRouting: await readFile("src/scripts/geospatial-local-routing-fallback.js", "utf8"),
  fleetGuard: await readFile("src/scripts/geospatial-fleet-allocation-guard.js", "utf8"),
  mobile: await readFile("src/scripts/geospatial-mobile-view.js", "utf8"),
  advanced: await readFile("src/components/GeospatialAdvancedVisuals.astro", "utf8"),
  lab: await readFile("src/components/GeospatialSupplyChainLabV4.astro", "utf8"),
  leafletLoader: await readFile("src/scripts/geospatial-leaflet-loader.js", "utf8"),
  service: await readFile("src/lib/geospatial/serviceRuntime.js", "utf8"),
  serviceResilience: await readFile("src/scripts/geospatial-service-resilience.js", "utf8"),
  home: await readFile("src/components/HomePage.astro", "utf8"),
  packageJson: await readFile("package.json", "utf8"),
  packageLock: await readFile("package-lock.json", "utf8"),
};

const requireToken = (source, token, label) => {
  if (!source.includes(token)) {
    throw new Error(`[geospatial-usability] missing ${label}: ${token}`);
  }
};

requireToken(files.advanced, "geospatial-compact-entity-ui.js", "compact unified entity UI mount");
requireToken(files.advanced, "geospatial-readability-polish.js", "readability-polish mount");
requireToken(files.advanced, "geospatial-osm-initial-state.js", "default OSM stale-state mount");
requireToken(files.advanced, "geospatial-overpass-query-polish.js", "Overpass query-polish mount");
requireToken(files.advanced, "geospatial-overpass-hedge.js", "Overpass hedged-request mount");
requireToken(files.advanced, "geospatial-local-routing-fallback.js", "local OSM table fallback mount");
requireToken(files.advanced, "geospatial-osm-fallback.js", "Fast OD recovery mount");
requireToken(files.advanced, "geospatial-fleet-allocation-guard.js", "fleet allocation guard mount");
requireToken(files.advanced, "geospatial-mobile-view.js", "mobile workspace mount");

requireToken(files.lab, "geospatial-leaflet-loader.js", "bundled Leaflet loader mount");
if (/https:\/\/(?:unpkg\.com|cdn\.jsdelivr\.net).*leaflet/i.test(files.lab)) {
  throw new Error("[geospatial-usability] the lab component must not synchronously depend on a Leaflet CDN");
}
if (/https:\/\/(?:unpkg\.com|cdn\.jsdelivr\.net).*leaflet/i.test(files.leafletLoader)) {
  throw new Error("[geospatial-usability] the Leaflet runtime must be bundled locally rather than loaded from a CDN");
}
requireToken(files.packageJson, '"leaflet": "1.9.4"', "exact Leaflet package dependency");
requireToken(files.packageLock, '"leaflet": "1.9.4"', "locked Leaflet package dependency");
requireToken(files.packageLock, '"node_modules/leaflet"', "Leaflet lockfile package entry");
requireToken(files.leafletLoader, 'import "./geospatial-idle-gis-guard.js"', "idle GIS guard bootstrap");
requireToken(files.leafletLoader, 'from "leaflet"', "local Leaflet module import");
requireToken(files.leafletLoader, 'import "leaflet/dist/leaflet.css"', "local Leaflet stylesheet import");
requireToken(files.leafletLoader, 'setState("ready", "bundle")', "bundled Leaflet readiness state");
requireToken(files.leafletLoader, "globalThis.L = Leaflet", "Leaflet compatibility global");

requireToken(files.core, "FACILITY_REGIONS", "regional facility pools");
requireToken(files.core, "DEMAND_REGIONS", "regional demand pools");
requireToken(files.core, "acidch-geo-v4-scene-seed", "session-stable randomized scene seed");
requireToken(files.core, "regionalWarehouseNames", "regionally feasible first-load warehouse anchors");
requireToken(files.core, "if (facilities.length >= 10)", "ten-facility randomized scene size");
requireToken(files.core, "if (demands.length >= 12)", "twelve-demand randomized scene size");
requireToken(files.core, ".slice(0, 3)", "three factories in the feasible regional scene");
requireToken(files.core, "factoryNames.has(item.name)", "three factories and seven warehouses");
requireToken(files.core, "solveInitialScenario", "bounded first-load feasibility retry");
requireToken(files.lab, '<option value="flow" selected', "flow analysis layer default");
requireToken(files.core, 'q("geo4-facility-count").textContent = String(H.length + N.length)', "dynamic entity list count");
requireToken(files.core, 'data-remove-entity="facility:${i}"', "physical facility delete action");
requireToken(files.core, 'data-remove-entity="demand:${i}"', "physical demand delete action");
requireToken(files.core, "async function removeEntity(kind, index)", "physical model-entity deletion");
requireToken(files.core, "H.splice(index, 1)", "facility model-array deletion");
requireToken(files.core, "N.splice(index, 1)", "demand model-array deletion");
requireToken(files.core, 'q("geo4-engine").value = "osm"', "OSM-first engine selection");
requireToken(files.core, 'q("geo4-threshold").value = "30"', "OSM 30-minute threshold");
requireToken(files.core, "const M = HC.map", "dynamic OD distance matrix");
requireToken(files.core, "graphRequestBounds", "randomized graph bounding box");
requireToken(files.core, "const bounds = graphRequestBounds()", "graph request uses compact entity extent");
requireToken(files.core, "acidch-osm-compact-v2", "session OSM graph cache");
requireToken(files.core, 'q("geo4-run").addEventListener("click", solveAndShowRoutes)', "scenario solve with current-route redraw");
requireToken(files.core, "loadGraph(false)", "out-of-bounds live-graph route refresh");
requireToken(files.core, "insideGraphBounds", "reuse loaded graph for in-bounds entity edits");
requireToken(files.core, "GRAPH_RETRY_COOLDOWN_MS", "failed OSM retry cooldown");
requireToken(files.core, "MAX_SESSION_GRAPH_ELEMENTS", "large live-graph cache guard");
requireToken(files.core, "readGraphRetryAfter", "session-scoped failed OSM retry guard");
requireToken(files.core, "graphLoadPromise", "concurrent OSM graph-load deduplication");
requireToken(files.core, "loadGraph(true, { force: true })", "explicit OSM retry bypass");
requireToken(files.core, "fallbackGeometry = !graph || !activeGraph", "exact built-in graph route fallback");
if (files.core.includes("fallbackGeometry = !refreshed || graph === baselineGraph")) {
  throw new Error("[geospatial-usability] built-in graph paths must not fall through to slow serial OSRM requests");
}

requireToken(files.compactUi, 'title: "设施、覆盖与网络实体"', "merged facility/entity title");
requireToken(files.compactUi, 'list: "网络实体与设施决策"', "unified entity decision list");
requireToken(files.compactUi, 'mapAdd: "点击地图添加"', "Chinese map-add label");
requireToken(files.compactUi, 'init: "随机轻量场景"', "compact random-scene action");
requireToken(files.compactUi, "root.dataset.entityEditorMerged", "merged entity editor state");
requireToken(files.compactUi, ".geo4__entity-remove", "readable physical-delete control");

requireToken(files.idleGuard, "externalGisBootDeferred", "idle external-GIS deferral state");
requireToken(files.idleGuard, 'source.includes("loadGraph(true)")', "legacy boot-preload suppression");
requireToken(files.idleGuard, "hasLocalFixture", "deterministic local fixture exception");
requireToken(files.idleGuard, "点击加载时按需获取在线路网", "explicit live-OSM copy");

requireToken(files.initialState, 'root.dataset.resultFreshness = "stale"', "initial stale-result state");
requireToken(files.readability, ".geo4__service-chip strong{font-size:.68rem!important", "larger service-health labels");
requireToken(files.readability, ".geo4__service-chip small{font-size:.61rem!important", "larger service-health details");
requireToken(files.readability, '"点击地图添加"', "final Chinese map-add label");

requireToken(files.queryPolish, '.replace(/\\[timeout:\\d+\\]/, "[timeout:16]")', "bounded Overpass query timeout");
requireToken(files.queryPolish, "motorway_link|trunk|trunk_link|primary", "drivable Overpass road filter");
requireToken(files.hedge, "const attempts = [primary, secondary]", "primary/secondary Overpass attempt set");
requireToken(files.hedge, "Promise.any(attempts)", "hedged primary/secondary Overpass fetch");
requireToken(files.hedge, "Promise.allSettled(attempts)", "hedged Overpass health reconciliation");
requireToken(files.hedge, "configured.overpassSecondary", "runtime-configured secondary endpoint");
requireToken(files.hedge, "Date.now() - exhaustedAt < 5000", "duplicate secondary wait suppression");
requireToken(files.hedge, "2600", "staggered Overpass backup start");
requireToken(files.fallback, "run.click()", "automatic Fast OD fallback solve");
requireToken(files.localRouting, 'url.includes("/table/v1/driving/")', "local OSM table interception");
requireToken(files.localRouting, "buildLocalTablePayload", "loaded-graph OSRM-compatible table fallback");
requireToken(files.fleetGuard, "isMainAllocation", "fleet main-allocation selector");
requireToken(files.fleetGuard, '.replace(/Allocated:/gi, "Flow:")', "fleet allocation unmasking");
requireToken(files.fleetGuard, '.replace(/Flow:/gi, "Routed:")', "fleet non-allocation masking");

requireToken(files.service, 'overpassPrimary: "https://overpass.private.coffee/api/interpreter"', "primary Overpass endpoint");
requireToken(files.service, 'overpassSecondary: "https://overpass-api.de/api/interpreter"', "secondary Overpass endpoint");
requireToken(files.service, "function matchesEndpoint", "configured endpoint identity matcher");
requireToken(files.service, "matchesEndpoint(url, endpoints.overpassPrimary)", "primary endpoint preservation");
requireToken(files.service, "matchesEndpoint(url, endpoints.overpassSecondary)", "secondary endpoint preservation");
requireToken(files.service, 'if (service === "overpass") return 18_000;', "per-endpoint Overpass ceiling");
requireToken(files.serviceResilience, "classifyServiceUrl(sourceUrl, endpoints)", "configured endpoint health classification");
requireToken(files.serviceResilience, "rewriteServiceUrl(sourceUrl, endpoints)", "configured endpoint rewrite routing");

requireToken(files.home, ':global(html[data-theme="light"]) .home-hero__featured-project', "light-theme featured-project contrast");
requireToken(files.home, "background: rgb(248 252 253 / 0.92);", "light-theme featured card background");

console.log(
  "[geospatial-usability] PASS: four-entity random compact scenes, physical facility/demand deletion, unified entity controls, OSM-first user-triggered road loading, compact cached graph requests, correctly separated and hedged Overpass endpoints, bounded failover waits, local loaded-graph table routing, Fast OD recovery, complete fleet allocation flow, bundled Leaflet and readability/light-theme refinements are wired into the release gate.",
);
