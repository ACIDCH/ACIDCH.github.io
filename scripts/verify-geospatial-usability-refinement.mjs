import { readFile } from "node:fs/promises";

const files = {
  refinement: await readFile("src/scripts/geospatial-usability-refinement.js", "utf8"),
  initialState: await readFile("src/scripts/geospatial-osm-initial-state.js", "utf8"),
  queryPolish: await readFile("src/scripts/geospatial-overpass-query-polish.js", "utf8"),
  fallback: await readFile("src/scripts/geospatial-osm-fallback.js", "utf8"),
  mobile: await readFile("src/scripts/geospatial-mobile-view.js", "utf8"),
  advanced: await readFile("src/components/GeospatialAdvancedVisuals.astro", "utf8"),
  lab: await readFile("src/components/GeospatialSupplyChainLabV4.astro", "utf8"),
  leafletLoader: await readFile("src/scripts/geospatial-leaflet-loader.js", "utf8"),
  service: await readFile("src/lib/geospatial/serviceRuntime.js", "utf8"),
  home: await readFile("src/components/HomePage.astro", "utf8"),
  packageJson: await readFile("package.json", "utf8"),
  packageLock: await readFile("package-lock.json", "utf8"),
};

const requireToken = (source, token, label) => {
  if (!source.includes(token))
    throw new Error(`[geospatial-usability] missing ${label}: ${token}`);
};

requireToken(files.advanced, "geospatial-usability-refinement.js", "refinement mount");
requireToken(files.advanced, "geospatial-osm-initial-state.js", "default OSM stale-state mount");
requireToken(files.advanced, "geospatial-overpass-query-polish.js", "Overpass query-polish mount");
requireToken(files.advanced, "geospatial-osm-fallback.js", "OSM fallback mount");
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
requireToken(files.leafletLoader, 'from "leaflet"', "local Leaflet module import");
requireToken(files.leafletLoader, 'import "leaflet/dist/leaflet.css"', "local Leaflet stylesheet import");
requireToken(files.leafletLoader, 'setState("ready", "bundle")', "bundled Leaflet readiness state");
requireToken(files.leafletLoader, "globalThis.L = Leaflet", "Leaflet compatibility global");
requireToken(files.initialState, 'root.dataset.resultFreshness = "stale"', "initial stale-result state");
requireToken(files.initialState, "默认 OSM 情景已就绪 · 请运行优化", "Chinese default OSM freshness copy");
requireToken(files.initialState, "Default OSM scenario ready · Run optimisation", "English default OSM freshness copy");
requireToken(
  files.refinement,
  'mergedTitle: "设施、覆盖与网络实体"',
  "merged facility/entity panel",
);
requireToken(files.refinement, 'mapAdd: "点击地图添加"', "Chinese map-add label");
requireToken(files.refinement, 'engine.value = "osm"', "OSM-first engine selection");
requireToken(files.refinement, 'threshold.value = "30"', "OSM default threshold");
requireToken(files.refinement, "BUNDLED_AUCKLAND_COORDS", "bundled fast-start GIS coordinates");
requireToken(files.refinement, "compactFacilityPreset", "compact facility preset");
requireToken(
  files.refinement,
  "const label = removed ? copy.restore : copy.delete;",
  "facility remove/restore label",
);
requireToken(
  files.refinement,
  "if (button.textContent?.trim() !== label) button.textContent = label;",
  "idempotent facility-button DOM update",
);
requireToken(
  files.refinement,
  "policyObserver.observe(policyList, { childList: true });",
  "bounded facility-list mutation observer",
);
requireToken(files.refinement, "syncExcludedFacilityMarkers", "removed-facility map visibility");
requireToken(files.refinement, "loadButton?.click()", "run-triggered OSM graph loading");
requireToken(files.refinement, "responseCache", "in-page GIS response cache");
requireToken(
  files.refinement,
  ".geo4__service-chip strong{font-size:.58rem!important}",
  "service-health readability",
);
requireToken(
  files.refinement,
  ".geo4__micro{font-size:.71rem!important",
  "micro-copy readability",
);
requireToken(files.mobile, 'labels = zh', "bilingual mobile workspace labels");
requireToken(files.mobile, 'setView("map")', "map-first mobile default");
requireToken(files.mobile, 'data-geo4-mobile-view="${view}"', "three mobile workspace controls");
requireToken(files.mobile, 'shell.dataset.mobileView = next', "mobile view state binding");
requireToken(files.mobile, 'data-mobile-view="controls"', "mobile controls mode styling");
requireToken(files.mobile, 'data-mobile-view="results"', "mobile results mode styling");
requireToken(files.mobile, 'new globalThis.Event("resize")', "Leaflet resize refresh after mobile switching");
requireToken(files.mobile, "ArrowLeft", "keyboard navigation for mobile workspace");
requireToken(files.queryPolish, "motorway_link|trunk|trunk_link|primary", "drivable Overpass road filter");
requireToken(files.queryPolish, '.replace("[timeout:35]", "[timeout:16]")', "narrowed Overpass query budget");
requireToken(files.queryPolish, '.replace("out body;", "out body qt;")', "quick Overpass output");
requireToken(files.fallback, "run.click()", "automatic Fast OD fallback solve");
requireToken(
  files.service,
  'overpassPrimary: "https://overpass.private.coffee/api/interpreter"',
  "primary Overpass endpoint",
);
requireToken(
  files.service,
  'overpassSecondary: "https://overpass-api.de/api/interpreter"',
  "secondary Overpass endpoint",
);
requireToken(
  files.service,
  'if (service === "overpass") return 18_000;',
  "Overpass failover budget",
);
requireToken(
  files.home,
  ':global(html[data-theme="light"]) .home-hero__featured-project',
  "light-theme featured-project contrast",
);
requireToken(
  files.home,
  "background: rgb(248 252 253 / 0.92);",
  "light-theme featured card background",
);

console.log(
  "[geospatial-usability] PASS: OSM-first workflow, locally bundled Leaflet 1.9.4, explicit initial stale-result state, bounded mutation observers, bundled fast-start coordinates, narrower drivable-road Overpass queries, faster endpoint failover, automatic Fast OD recovery, compact editable facilities, merged entity controls, readable mobile Map/Controls/Results switching and desktop readability improvements are wired into the release gate.",
);
